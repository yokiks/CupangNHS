import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../../app.js";
import {
    getPool,
    destroyPool,
    createTestStudent,
    createTestCounselor,
    cleanAllTables,
} from "../helpers.js";

const request = supertest(app);

let pool;
let student;
let counselor;
let oldSchoolYearId;
let newSchoolYearId;
const oldSchoolYearLabel = "2025-2026";
const newSchoolYearLabel = "2026-2027";

beforeAll(async () => {
    pool = getPool();
    await cleanAllTables(pool);
    student = await createTestStudent(pool);
    counselor = await createTestCounselor(pool);

    await pool.query(
        `INSERT INTO student_records (lrn, first_name, last_name, grade_level, section)
         VALUES (?, ?, ?, ?, ?)`,
        [student.user.lrn, student.user.first_name, student.user.last_name, "Grade 7", "Rizal"]
    );

    const [oldYear] = await pool.query(
        "INSERT INTO school_years (label, status, created_at, updated_at) VALUES (?, 'active', NOW(), NOW())",
        [oldSchoolYearLabel]
    );
    oldSchoolYearId = oldYear.insertId;

    await pool.query(
        "UPDATE users SET last_validated_school_year_id = ?, account_status = 'active' WHERE id = ?",
        [oldSchoolYearId, student.user.id]
    );
});

afterAll(async () => {
    await cleanAllTables(pool);
    await destroyPool();
});

describe("Annual enrollment revalidation workflow", () => {
    it("flags outdated active students when a new school year is activated", async () => {
        const createRes = await request
            .post("/api/school-years")
            .set("Authorization", `Bearer ${counselor.token}`)
            .send({ label: newSchoolYearLabel });

        expect(createRes.status).toBe(201);
        newSchoolYearId = createRes.body.schoolYear.id;

        const activateRes = await request
            .patch(`/api/school-years/${newSchoolYearId}/activate`)
            .set("Authorization", `Bearer ${counselor.token}`);

        expect(activateRes.status).toBe(200);
        expect(activateRes.body.revalidationCount).toBe(1);

        const [userRows] = await pool.query(
            "SELECT account_status, last_validated_school_year_id FROM users WHERE id = ?",
            [student.user.id]
        );
        expect(userRows[0].account_status).toBe("pending_revalidation");
        expect(userRows[0].last_validated_school_year_id).toBe(oldSchoolYearId);

        const [yearRows] = await pool.query("SELECT id, status FROM school_years");
        const statuses = Object.fromEntries(yearRows.map((row) => [row.id, row.status]));
        expect(statuses[oldSchoolYearId]).toBe("archived");
        expect(statuses[newSchoolYearId]).toBe("active");
    });

    it("shows the student's previous enrollment and required next grade", async () => {
        const res = await request
            .get("/api/revalidation-requests/summary")
            .set("Authorization", `Bearer ${student.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            activeSchoolYear: { id: newSchoolYearId, label: newSchoolYearLabel },
            previousEnrollment: {
                schoolYear: { id: oldSchoolYearId, label: oldSchoolYearLabel },
                gradeLevel: "Grade 7",
                section: "Rizal",
                label: "Grade 7 - Rizal",
            },
            expectedNextGrade: "8",
            canSubmit: true,
        });
    });

    it("rejects grade-level jumps during revalidation submission", async () => {
        const submitRes = await request
            .post("/api/revalidation-requests")
            .set("Authorization", `Bearer ${student.token}`)
            .field("gradeLevel", "10")
            .field("section", "Sampaguita")
            .attach("schoolIdProof", Buffer.from("fake school id"), "school-id.png");

        expect(submitRes.status).toBe(400);
        expect(submitRes.body.message).toMatch(/Grade 8/);
    });

    it("lets a flagged student submit a school-year-linked revalidation request", async () => {
        const submitRes = await request
            .post("/api/revalidation-requests")
            .set("Authorization", `Bearer ${student.token}`)
            .field("gradeLevel", "8")
            .field("section", "Sampaguita")
            .attach("schoolIdProof", Buffer.from("fake school id"), "school-id.png");

        expect(submitRes.status).toBe(201);
        expect(submitRes.body.request.schoolYear).toMatchObject({
            id: newSchoolYearId,
            label: newSchoolYearLabel,
        });
        expect(submitRes.body.request.gradeLevel).toBe("8");
        expect(submitRes.body.request.section).toBe("Sampaguita");

        const [requestRows] = await pool.query(
            `SELECT user_id, school_year_id, grade_level, section, status
             FROM revalidation_requests
             WHERE user_id = ?`,
            [student.user.id]
        );
        expect(requestRows).toHaveLength(1);
        expect(requestRows[0]).toMatchObject({
            user_id: student.user.id,
            school_year_id: newSchoolYearId,
            grade_level: "8",
            section: "Sampaguita",
            status: "pending_review",
        });
    });

    it("shows pending revalidation details to the counselor", async () => {
        const res = await request
            .get("/api/revalidation-requests")
            .set("Authorization", `Bearer ${counselor.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toMatchObject({
            schoolYear: { id: newSchoolYearId, label: newSchoolYearLabel },
            previousGradeLevel: "Grade 7",
            previousSection: "Rizal",
            newGradeLevel: "8",
            newSection: "Sampaguita",
        });
        expect(res.body[0].schoolIdProofUrl).toContain("/uploads/");
    });

    it("approves the request and updates student status, enrollment, school year, and history", async () => {
        const [requestRows] = await pool.query(
            "SELECT id FROM revalidation_requests WHERE user_id = ? AND status = 'pending_review' LIMIT 1",
            [student.user.id]
        );
        const requestId = requestRows[0].id;

        const approveRes = await request
            .patch(`/api/revalidation-requests/${requestId}/approve`)
            .set("Authorization", `Bearer ${counselor.token}`);

        expect(approveRes.status).toBe(200);
        expect(approveRes.body.schoolYear).toMatchObject({
            id: newSchoolYearId,
            label: newSchoolYearLabel,
        });

        const [userRows] = await pool.query(
            "SELECT account_status, last_validated_school_year_id FROM users WHERE id = ?",
            [student.user.id]
        );
        expect(userRows[0].account_status).toBe("active");
        expect(userRows[0].last_validated_school_year_id).toBe(newSchoolYearId);

        const [studentRecords] = await pool.query(
            "SELECT grade_level, section FROM student_records WHERE lrn = ?",
            [student.user.lrn]
        );
        expect(studentRecords[0]).toMatchObject({
            grade_level: "8",
            section: "Sampaguita",
        });

        const [historyRows] = await pool.query(
            `SELECT student_id, school_year_id, school_year_label, grade_level, section, approved_by_id
             FROM enrollment_validation_history
             WHERE student_id = ?`,
            [student.user.id]
        );
        expect(historyRows).toHaveLength(1);
        expect(historyRows[0]).toMatchObject({
            student_id: student.user.id,
            school_year_id: newSchoolYearId,
            school_year_label: newSchoolYearLabel,
            grade_level: "8",
            section: "Sampaguita",
            approved_by_id: counselor.user.id,
        });

        const [approvedRequests] = await pool.query(
            "SELECT status FROM revalidation_requests WHERE id = ?",
            [requestId]
        );
        expect(approvedRequests[0].status).toBe("approved");
    });

    it("marks Grade 10 students as graduated instead of requiring revalidation next school year", async () => {
        const grade10Student = await createTestStudent(pool);
        await pool.query(
            `INSERT INTO student_records (lrn, first_name, last_name, grade_level, section)
             VALUES (?, ?, ?, ?, ?)`,
            [grade10Student.user.lrn, grade10Student.user.first_name, grade10Student.user.last_name, "Grade 10", "Mabini"]
        );
        await pool.query(
            `UPDATE users
             SET account_status = 'active',
                 last_validated_school_year_id = ?
             WHERE id = ?`,
            [newSchoolYearId, grade10Student.user.id]
        );

        const createRes = await request
            .post("/api/school-years")
            .set("Authorization", `Bearer ${counselor.token}`)
            .send({ label: "2027-2028" });

        expect(createRes.status).toBe(201);

        const activateRes = await request
            .patch(`/api/school-years/${createRes.body.schoolYear.id}/activate`)
            .set("Authorization", `Bearer ${counselor.token}`);

        expect(activateRes.status).toBe(200);
        expect(activateRes.body.graduatedCount).toBe(1);

        const [rows] = await pool.query(
            "SELECT account_status FROM users WHERE id = ?",
            [grade10Student.user.id]
        );
        expect(rows[0].account_status).toBe("graduated");

        const pendingAccountsRes = await request
            .get("/api/auth/students?status=pending_revalidation")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(pendingAccountsRes.status).toBe(200);
        expect(pendingAccountsRes.body.some((account) => account.id === grade10Student.user.id)).toBe(false);

        const graduatedAccountsRes = await request
            .get("/api/auth/students?status=graduated")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(graduatedAccountsRes.status).toBe(200);
        expect(graduatedAccountsRes.body.some((account) => account.id === grade10Student.user.id)).toBe(true);

        const loginRes = await request
            .post("/api/auth/login")
            .send({ identifier: grade10Student.user.username, password: "Test1234!" });
        expect(loginRes.status).toBe(403);
        expect(loginRes.body.message).toMatch(/graduated/i);
    });

    it("lets counselors mark a Grade 10 pending revalidation student as graduated from view account", async () => {
        const grade10Student = await createTestStudent(pool);
        await pool.query(
            `INSERT INTO student_records (lrn, first_name, last_name, grade_level, section)
             VALUES (?, ?, ?, ?, ?)`,
            [grade10Student.user.lrn, grade10Student.user.first_name, grade10Student.user.last_name, "Grade 10", "Mabini"]
        );
        await pool.query(
            `UPDATE users
             SET account_status = 'pending_revalidation',
                 revalidation_submission_unlocked = TRUE
             WHERE id = ?`,
            [grade10Student.user.id]
        );

        const graduateRes = await request
            .patch(`/api/revalidation-requests/students/${grade10Student.user.id}/mark-graduated`)
            .set("Authorization", `Bearer ${counselor.token}`);

        expect(graduateRes.status).toBe(200);
        expect(graduateRes.body).toMatchObject({
            message: "Student marked as graduated.",
            studentStatus: "graduated",
        });

        const [rows] = await pool.query(
            "SELECT account_status, revalidation_submission_unlocked FROM users WHERE id = ?",
            [grade10Student.user.id]
        );
        expect(rows[0]).toMatchObject({
            account_status: "graduated",
            revalidation_submission_unlocked: 0,
        });
    });

    it("allows catch-up revalidation for students who missed multiple school years", async () => {
        await cleanAllTables(pool);
        const catchUpStudent = await createTestStudent(pool);
        const catchUpCounselor = await createTestCounselor(pool);

        await pool.query(
            `INSERT INTO student_records (lrn, first_name, last_name, grade_level, section)
             VALUES (?, ?, ?, ?, ?)`,
            [catchUpStudent.user.lrn, catchUpStudent.user.first_name, catchUpStudent.user.last_name, "Grade 7", "Rizal"]
        );

        const [oldYear] = await pool.query(
            "INSERT INTO school_years (label, status, created_at, updated_at) VALUES ('2024-2025', 'archived', NOW(), NOW())"
        );
        const [activeYear] = await pool.query(
            "INSERT INTO school_years (label, status, created_at, updated_at) VALUES ('2027-2028', 'active', NOW(), NOW())"
        );
        await pool.query(
            `UPDATE users
             SET account_status = 'pending_revalidation',
                 last_validated_school_year_id = ?
             WHERE id = ?`,
            [oldYear.insertId, catchUpStudent.user.id]
        );

        const summaryRes = await request
            .get("/api/revalidation-requests/summary")
            .set("Authorization", `Bearer ${catchUpStudent.token}`);

        expect(summaryRes.status).toBe(200);
        expect(summaryRes.body).toMatchObject({
            activeSchoolYear: { id: activeYear.insertId, label: "2027-2028" },
            expectedNextGrade: "8",
            catchUpAllowed: true,
            minSelectableGrade: "8",
            maxSelectableGrade: 10,
        });

        const submitRes = await request
            .post("/api/revalidation-requests")
            .set("Authorization", `Bearer ${catchUpStudent.token}`)
            .field("gradeLevel", "10")
            .field("section", "Mabini")
            .attach("schoolIdProof", Buffer.from("fake school id"), "school-id.png");

        expect(submitRes.status).toBe(201);
        expect(submitRes.body.request).toMatchObject({
            gradeLevel: "10",
            section: "Mabini",
            reviewType: "catch_up",
        });

        const reviewRes = await request
            .get("/api/revalidation-requests")
            .set("Authorization", `Bearer ${catchUpCounselor.token}`);

        expect(reviewRes.status).toBe(200);
        expect(reviewRes.body[0]).toMatchObject({
            previousGradeLevel: "Grade 7",
            newGradeLevel: "10",
            reviewType: "catch_up",
        });
    });
});
