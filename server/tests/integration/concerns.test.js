import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
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
});

afterAll(async () => {
    await cleanAllTables(pool);
    await destroyPool();
});

describe("POST /api/concerns", () => {
    it("should reject unauthenticated requests", async () => {
        const res = await request.post("/api/concerns").send({
            title: "Test",
            description: "Test desc",
        });
        expect(res.status).toBe(401);
    });

    it("should reject missing title", async () => {
        const res = await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`)
            .send({ description: "Test desc" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Title and description/i);
    });

    it("should reject missing description", async () => {
        const res = await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`)
            .send({ title: "Test" });
        expect(res.status).toBe(400);
    });

    it("should create a concern as student", async () => {
        const res = await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`)
            .send({
                title: "Academic Struggle",
                description: "I need help with math",
                category: "academic",
            });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            title: "Academic Struggle",
            description: "I need help with math",
            category: "academic",
            status: "pending",
        });
        expect(res.body.id).toBeDefined();
    });

    it("should reject duplicate pending concern with same title", async () => {
        const res = await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`)
            .send({
                title: "Academic Struggle",
                description: "Same title again",
                category: "academic",
            });
        expect(res.status).toBe(409);
    });

    it("should create a concern with default category", async () => {
        const res = await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`)
            .send({
                title: "General Inquiry",
                description: "Just a general question",
            });
        expect(res.status).toBe(201);
        expect(res.body.category).toBe("general");
    });

    it("should record initial status history", async () => {
        const [rows] = await pool.query(
            "SELECT * FROM concern_status_history WHERE concern_id = ? AND new_status = 'pending'",
            [1]
        );
        expect(rows.length).toBeGreaterThanOrEqual(1);
    });
});

describe("GET /api/concerns", () => {
    it("student should see only their concerns", async () => {
        const res = await request
            .get("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        for (const c of res.body) {
            expect(c.userId).toBe(student.user.id);
        }
    });

    it("counselor should see all concerns", async () => {
        const res = await request
            .get("/api/concerns")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0].student).toBeDefined();
    });

    it("should filter by status", async () => {
        const res = await request
            .get("/api/concerns?status=pending")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        for (const c of res.body) {
            expect(c.status).toBe("pending");
        }
    });

    it("should filter by category", async () => {
        const res = await request
            .get("/api/concerns?category=academic")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        for (const c of res.body) {
            expect(c.category).toBe("academic");
        }
    });

    it("student should also filter by status correctly", async () => {
        const res = await request
            .get("/api/concerns?status=pending")
            .set("Authorization", `Bearer ${student.token}`);
        expect(res.status).toBe(200);
        for (const c of res.body) {
            expect(c.status).toBe("pending");
        }
    });
});

describe("PATCH /api/concerns/:id (status update)", () => {
    let concernId;

    beforeAll(async () => {
        const res = await request
            .get("/api/concerns")
            .set("Authorization", `Bearer ${counselor.token}`);
        concernId = res.body[0].id;
    });

    it("should reject non-counselor status updates", async () => {
        const res = await request
            .patch(`/api/concerns/${concernId}`)
            .set("Authorization", `Bearer ${student.token}`)
            .send({ status: "read" });
        expect(res.status).toBe(403);
    });

    it("should reject invalid status", async () => {
        const res = await request
            .patch(`/api/concerns/${concernId}`)
            .set("Authorization", `Bearer ${counselor.token}`)
            .send({ status: "invalid_status" });
        expect(res.status).toBe(400);
    });

    it("should update status to read", async () => {
        const res = await request
            .patch(`/api/concerns/${concernId}`)
            .set("Authorization", `Bearer ${counselor.token}`)
            .send({ status: "read" });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("read");
    });

    it("should record status change in history", async () => {
        const [rows] = await pool.query(
            `SELECT * FROM concern_status_history
             WHERE concern_id = ? AND old_status = 'pending' AND new_status = 'read'`,
            [concernId]
        );
        expect(rows.length).toBe(1);
        expect(rows[0].changed_by).toBe(counselor.user.id);
    });

    it("should create a notification for the student", async () => {
        const [rows] = await pool.query(
            "SELECT * FROM notifications WHERE concern_id = ? AND user_id = ?",
            [concernId, student.user.id]
        );
        expect(rows.length).toBeGreaterThanOrEqual(1);
        expect(rows[0].message).toContain("read");
    });

    it("should update status to in_review", async () => {
        const res = await request
            .patch(`/api/concerns/${concernId}`)
            .set("Authorization", `Bearer ${counselor.token}`)
            .send({ status: "in_review" });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("in_review");
    });

    it("should update status to resolved", async () => {
        const res = await request
            .patch(`/api/concerns/${concernId}`)
            .set("Authorization", `Bearer ${counselor.token}`)
            .send({ status: "resolved" });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("resolved");
    });

    it("should return 404 for non-existent concern", async () => {
        const res = await request
            .patch("/api/concerns/99999")
            .set("Authorization", `Bearer ${counselor.token}`)
            .send({ status: "read" });
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/concerns/:id", () => {
    let ownConcernId;

    beforeAll(async () => {
        const res = await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`)
            .send({
                title: "To Be Deleted",
                description: "This will be deleted",
                category: "other",
            });
        ownConcernId = res.body.id;
    });

    it("student can delete their own concern", async () => {
        const res = await request
            .delete(`/api/concerns/${ownConcernId}`)
            .set("Authorization", `Bearer ${student.token}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
    });

    it("should return 404 for already deleted concern", async () => {
        const res = await request
            .delete(`/api/concerns/${ownConcernId}`)
            .set("Authorization", `Bearer ${student.token}`);
        expect(res.status).toBe(404);
    });

    it("counselor can delete any concern", async () => {
        const createRes = await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`)
            .send({
                title: "Counselor Delete Target",
                description: "Counselor will delete this",
            });
        const id = createRes.body.id;

        const res = await request
            .delete(`/api/concerns/${id}`)
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
    });
});

describe("GET /api/concerns/report (overall)", () => {
    it("should reject non-counselor access", async () => {
        const res = await request
            .get("/api/concerns/report")
            .set("Authorization", `Bearer ${student.token}`);
        expect(res.status).toBe(403);
    });

    it("should return report summary for counselor", async () => {
        const res = await request
            .get("/api/concerns/report")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        expect(res.body.generatedAt).toBeDefined();
        expect(res.body.summary).toBeDefined();
        expect(res.body.summary.total).toBeGreaterThanOrEqual(0);
        expect(res.body.summary.byStatus).toBeDefined();
        expect(res.body.summary.byCategory).toBeDefined();
        expect(Array.isArray(res.body.concerns)).toBe(true);
    });
});
