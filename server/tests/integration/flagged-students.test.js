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

beforeAll(async () => {
    pool = getPool();
    await cleanAllTables(pool);
    student = await createTestStudent(pool);
    counselor = await createTestCounselor(pool);

    for (let i = 1; i <= 3; i++) {
        await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`)
            .send({
                title: `Flag Test ${i} ${Date.now()}`,
                description: `Concern number ${i}`,
                category: "general",
            });
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
            .get("/api/concerns/flagged-students")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);

        const entry = res.body.find((s) => s.id === student.user.id);
        expect(entry).toBeDefined();
        expect(entry.firstName).toBe("Test");
        expect(entry.concernCount).toBe(3);
    });

    it("should return students ordered by count descending", async () => {
        const res = await request
            .get("/api/concerns/flagged-students")
            .set("Authorization", `Bearer ${counselor.token}`);
        for (let i = 1; i < res.body.length; i++) {
            expect(res.body[i - 1].concernCount).toBeGreaterThanOrEqual(res.body[i].concernCount);
        }
    });
});
