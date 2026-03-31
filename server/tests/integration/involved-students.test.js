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
let reporter;
let involved1;
let involved2;
let counselor;

beforeAll(async () => {
    pool = getPool();
    await cleanAllTables(pool);
    reporter = await createTestStudent(pool);

    const hash = (await import("bcryptjs")).default;
    const pw = await hash.hash("Test1234!", 10);

    const [r1] = await pool.query(
        `INSERT INTO users (first_name, last_name, username, password_hash, role, lrn, email)
         VALUES (?, ?, ?, ?, 'student', ?, ?)`,
        ["Involved", "One", `inv1_${Date.now()}`, pw, "301420000101", `inv1_${Date.now()}@test.com`]
    );
    const [u1] = await pool.query("SELECT * FROM users WHERE id = ?", [r1.insertId]);
    involved1 = { user: u1[0] };

    const [r2] = await pool.query(
        `INSERT INTO users (first_name, last_name, username, password_hash, role, lrn, email)
         VALUES (?, ?, ?, ?, 'student', ?, ?)`,
        ["Involved", "Two", `inv2_${Date.now()}`, pw, "301420000102", `inv2_${Date.now()}@test.com`]
    );
    const [u2] = await pool.query("SELECT * FROM users WHERE id = ?", [r2.insertId]);
    involved2 = { user: u2[0] };

    counselor = await createTestCounselor(pool);
});

afterAll(async () => {
    await cleanAllTables(pool);
    await destroyPool();
});

describe("Involved students on concern creation", () => {
    let concernId;

    it("should create a concern with involved students", async () => {
        const res = await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${reporter.token}`)
            .field("title", "Incident Report")
            .field("description", "A fight broke out in the hallway")
            .field("category", "behavioral")
            .field("involvedStudentIds", JSON.stringify([involved1.user.id, involved2.user.id]));
        expect(res.status).toBe(201);
        concernId = res.body.id;

        const [rows] = await pool.query(
            "SELECT * FROM concern_involved_students WHERE concern_id = ?",
            [concernId]
        );
        expect(rows.length).toBe(2);
        const userIds = rows.map((r) => r.user_id);
        expect(userIds).toContain(involved1.user.id);
        expect(userIds).toContain(involved2.user.id);
    });

    it("should create a concern without involved students", async () => {
        const res = await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${reporter.token}`)
            .send({ title: "Solo Concern", description: "No one else involved", category: "general" });
        expect(res.status).toBe(201);

        const [rows] = await pool.query(
            "SELECT * FROM concern_involved_students WHERE concern_id = ?",
            [res.body.id]
        );
        expect(rows.length).toBe(0);
    });

    it("counselor GET /api/concerns should include involvedStudents", async () => {
        const res = await request
            .get("/api/concerns")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);

        const concern = res.body.find((c) => c.id === concernId);
        expect(concern).toBeDefined();
        expect(concern.involvedStudents).toBeDefined();
        expect(concern.involvedStudents.length).toBe(2);
    });

    it("GET /api/concerns/:id/report should include involvedStudents", async () => {
        const res = await request
            .get(`/api/concerns/${concernId}/report`)
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        expect(res.body.involvedStudents).toBeDefined();
        expect(res.body.involvedStudents.length).toBe(2);
    });

    it("GET /api/concerns/report (overall) should include involvedStudents", async () => {
        const res = await request
            .get("/api/concerns/report")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        const concern = res.body.concerns.find((c) => c.id === concernId);
        expect(concern).toBeDefined();
        expect(concern.involvedStudents).toBeDefined();
        expect(concern.involvedStudents.length).toBe(2);
    });
});

describe("Student search and profile", () => {
    it("should search students by name", async () => {
        const res = await request
            .get("/api/students/search?q=Involved")
            .set("Authorization", `Bearer ${reporter.token}`);
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it("should return empty for short queries", async () => {
        const res = await request
            .get("/api/students/search?q=I")
            .set("Authorization", `Bearer ${reporter.token}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("should get student profile (counselor only)", async () => {
        const res = await request
            .get(`/api/students/${reporter.user.id}/profile`)
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        expect(res.body.student).toBeDefined();
        expect(res.body.student.id).toBe(reporter.user.id);
        expect(res.body.stats).toBeDefined();
        expect(res.body.stats.reportedCount).toBeGreaterThanOrEqual(1);
        expect(res.body.reportedConcerns).toBeDefined();
        expect(res.body.involvedConcerns).toBeDefined();
    });

    it("student should not access profile endpoint", async () => {
        const res = await request
            .get(`/api/students/${involved1.user.id}/profile`)
            .set("Authorization", `Bearer ${reporter.token}`);
        expect(res.status).toBe(403);
    });

    it("involved student profile should show involvedConcerns", async () => {
        const res = await request
            .get(`/api/students/${involved1.user.id}/profile`)
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        expect(res.body.stats.involvedCount).toBeGreaterThanOrEqual(1);
        expect(res.body.involvedConcerns.length).toBeGreaterThanOrEqual(1);
    });
});
