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
let involvedStudent;
let counselor;
let activeSchoolYearId;
const createdConcernIds = [];

beforeAll(async () => {
    pool = getPool();
    await cleanAllTables(pool);
    student = await createTestStudent(pool);
    involvedStudent = await createTestStudent(pool);
    counselor = await createTestCounselor(pool);
    const [schoolYearResult] = await pool.query(
        "INSERT INTO school_years (label, status) VALUES ('2026-2027', 'active')"
    );
    activeSchoolYearId = schoolYearResult.insertId;

    for (let i = 1; i <= 3; i++) {
        const result = await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`)
            .send({
                title: `Flag Test ${i} ${Date.now()}`,
                description: `Concern number ${i}`,
                category: "general",
                involvedStudentIds: [involvedStudent.user.id],
            });
        createdConcernIds.push(result.body.id);
    }
});

afterAll(async () => {
    await cleanAllTables(pool);
    await destroyPool();
});

describe("GET /api/concerns (concern count)", () => {
    it("counselor response should include concernCount", async () => {
        const res = await request
            .get("/api/concerns")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(3);
        for (const c of res.body) {
            expect(c.concernCount).toBeDefined();
            expect(typeof c.concernCount).toBe("number");
        }
        expect(res.body[0].concernCount).toBe(3);
    });

    it("student response should NOT include concernCount", async () => {
        const res = await request
            .get("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`);
        expect(res.status).toBe(200);
        for (const c of res.body) {
            expect(c.concernCount).toBeUndefined();
        }
    });
});

describe("GET /api/concerns/flagged-students", () => {
    it("should reject non-counselor access", async () => {
        const res = await request
            .get("/api/concerns/flagged-students")
            .set("Authorization", `Bearer ${student.token}`);
        expect(res.status).toBe(403);
    });

    it("should return flagged students for counselor", async () => {
        const res = await request
            .get(`/api/concerns/flagged-students?schoolYearId=${activeSchoolYearId}`)
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        expect(res.body.schoolYear.id).toBe(activeSchoolYearId);
        expect(Array.isArray(res.body.frequentReporters)).toBe(true);
        expect(Array.isArray(res.body.frequentlyInvolved)).toBe(true);

        const entry = res.body.frequentReporters.find((s) => s.id === student.user.id);
        expect(entry).toBeDefined();
        expect(entry.firstName).toBe("Test");
        expect(entry.reportCount).toBe(3);

        const involvedEntry = res.body.frequentlyInvolved.find((s) => s.id === involvedStudent.user.id);
        expect(involvedEntry).toBeDefined();
        expect(involvedEntry.involvedCount).toBe(3);
    });

    it("should return students ordered by count descending", async () => {
        const res = await request
            .get(`/api/concerns/flagged-students?schoolYearId=${activeSchoolYearId}`)
            .set("Authorization", `Bearer ${counselor.token}`);
        for (let i = 1; i < res.body.frequentReporters.length; i++) {
            expect(res.body.frequentReporters[i - 1].reportCount).toBeGreaterThanOrEqual(res.body.frequentReporters[i].reportCount);
        }
    });

    it("should default to the active school year", async () => {
        const res = await request
            .get("/api/concerns/flagged-students")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        expect(res.body.schoolYear.id).toBe(activeSchoolYearId);
    });

    it("should include archived concerns in activity totals and expose a breakdown", async () => {
        await pool.query("UPDATE concerns SET status = 'deleted' WHERE id = ?", [createdConcernIds[0]]);

        const res = await request
            .get(`/api/concerns/flagged-students?schoolYearId=${activeSchoolYearId}`)
            .set("Authorization", `Bearer ${counselor.token}`);

        const reporterEntry = res.body.frequentReporters.find((entry) => entry.id === student.user.id);
        const involvedEntry = res.body.frequentlyInvolved.find((entry) => entry.id === involvedStudent.user.id);

        expect(reporterEntry).toMatchObject({ reportCount: 3, currentCount: 2, archivedCount: 1 });
        expect(involvedEntry).toMatchObject({ involvedCount: 3, currentCount: 2, archivedCount: 1 });
    });
});
