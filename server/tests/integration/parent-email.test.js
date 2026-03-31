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
let studentWithParent;
let studentNoParent;
let involvedWithParent;
let involvedNoParent;
let counselor;
let concernWithParent;
let concernNoParent;
let concernWithInvolved;

beforeAll(async () => {
    pool = getPool();
    await cleanAllTables(pool);

    counselor = await createTestCounselor(pool);

    const hash = (await import("bcryptjs")).default;
    const pw = await hash.hash("Test1234!", 10);

    const [r1] = await pool.query(
        `INSERT INTO users (first_name, last_name, username, password_hash, role, lrn, email, parent_name, parent_email, parent_contact)
         VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?)`,
        ["WithParent", "Student", `wp_${Date.now()}`, pw, "301420000001", `wp${Date.now()}@test.com`, "Parent Doe", "parent@test.com", "09171234567"]
    );
    const [rows1] = await pool.query("SELECT * FROM users WHERE id = ?", [r1.insertId]);
    const { makeToken } = await import("../helpers.js");
    studentWithParent = { user: rows1[0], token: makeToken(rows1[0]) };

    studentNoParent = await createTestStudent(pool);

    const [r2] = await pool.query(
        `INSERT INTO users (first_name, last_name, username, password_hash, role, lrn, email, parent_name, parent_email)
         VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?)`,
        ["Involved", "WithParent", `iwp_${Date.now()}`, pw, "301420000010", `iwp${Date.now()}@test.com`, "Involved Parent", "involvedparent@test.com"]
    );
    const [rows2] = await pool.query("SELECT * FROM users WHERE id = ?", [r2.insertId]);
    involvedWithParent = { user: rows2[0], token: makeToken(rows2[0]) };

    const [r3] = await pool.query(
        `INSERT INTO users (first_name, last_name, username, password_hash, role, lrn, email)
         VALUES (?, ?, ?, ?, 'student', ?, ?)`,
        ["Involved", "NoParent", `inp_${Date.now()}`, pw, "301420000011", `inp${Date.now()}@test.com`]
    );
    const [rows3] = await pool.query("SELECT * FROM users WHERE id = ?", [r3.insertId]);
    involvedNoParent = { user: rows3[0], token: makeToken(rows3[0]) };

    const res1 = await request
        .post("/api/concerns")
        .set("Authorization", `Bearer ${studentWithParent.token}`)
        .send({ title: "Parent Test Concern", description: "test", category: "general" });
    concernWithParent = res1.body.id;

    const res2 = await request
        .post("/api/concerns")
        .set("Authorization", `Bearer ${studentNoParent.token}`)
        .send({ title: "No Parent Concern", description: "test", category: "general" });
    concernNoParent = res2.body.id;

    const res3 = await request
        .post("/api/concerns")
        .set("Authorization", `Bearer ${studentWithParent.token}`)
        .field("title", "Concern With Involved")
        .field("description", "has involved students")
        .field("category", "behavioral")
        .field("involvedStudentIds", JSON.stringify([involvedWithParent.user.id, involvedNoParent.user.id]));
    concernWithInvolved = res3.body.id;
});

afterAll(async () => {
    await cleanAllTables(pool);
    await destroyPool();
});

describe("POST /api/concerns/:id/notify-parent", () => {
    it("should reject non-counselor access", async () => {
        const res = await request
            .post(`/api/concerns/${concernWithParent}/notify-parent`)
            .set("Authorization", `Bearer ${studentWithParent.token}`);
        expect(res.status).toBe(403);
    });

    it("should return 400 when student has no parent email", async () => {
        const res = await request
            .post(`/api/concerns/${concernNoParent}/notify-parent`)
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/no parent email/i);
    });

    it("should return 404 for non-existent concern", async () => {
        const res = await request
            .post("/api/concerns/99999/notify-parent")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(404);
    });

    it("should send email or return 503 depending on mail config", async () => {
        const res = await request
            .post(`/api/concerns/${concernWithParent}/notify-parent`)
            .set("Authorization", `Bearer ${counselor.token}`);
        expect([200, 503]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body.message).toMatch(/parent/i);
            expect(res.body.notifiedCount).toBeGreaterThanOrEqual(1);
        } else {
            expect(res.body.message).toMatch(/not configured/i);
        }
    });

    it("should also notify parents of involved students when concern has them", async () => {
        const res = await request
            .post(`/api/concerns/${concernWithInvolved}/notify-parent`)
            .set("Authorization", `Bearer ${counselor.token}`);
        expect([200, 503]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body.notifiedCount).toBeGreaterThanOrEqual(2);
            expect(res.body.skippedStudents).toBeDefined();
            expect(res.body.skippedStudents).toContain("Involved NoParent");
        }
    });
});
