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
let counselor;
let concernWithParent;
let concernNoParent;

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
            expect(res.body.message).toMatch(/sent successfully/i);
        } else {
            expect(res.body.message).toMatch(/not configured/i);
        }
    });
});
