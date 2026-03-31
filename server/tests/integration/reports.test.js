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
let concernId;

beforeAll(async () => {
    pool = getPool();
    await cleanAllTables(pool);
    student = await createTestStudent(pool);
    counselor = await createTestCounselor(pool);

    const res = await request
        .post("/api/concerns")
        .set("Authorization", `Bearer ${student.token}`)
        .send({
            title: "Report Test Concern",
            description: "This concern is for testing reports",
            category: "behavioral",
        });
    concernId = res.body.id;

    await request
        .patch(`/api/concerns/${concernId}`)
        .set("Authorization", `Bearer ${counselor.token}`)
        .send({ status: "read" });

    await request
        .patch(`/api/concerns/${concernId}`)
        .set("Authorization", `Bearer ${counselor.token}`)
        .send({ status: "in_review" });
});

afterAll(async () => {
    await cleanAllTables(pool);
    await destroyPool();
});

describe("PUT /api/concerns/:id/report", () => {
    it("should reject non-counselor access", async () => {
        const res = await request
            .put(`/api/concerns/${concernId}/report`)
            .set("Authorization", `Bearer ${student.token}`)
            .send({ adminNotes: "test" });
        expect(res.status).toBe(403);
    });

    it("should save a new report", async () => {
        const res = await request
            .put(`/api/concerns/${concernId}/report`)
            .set("Authorization", `Bearer ${counselor.token}`)
            .send({
                adminNotes: "Student seems stressed about behavior issues.",
                findings: "Peer conflict identified during interview.",
                recommendations: "Schedule follow-up counseling session.",
                closingRemarks: "Will monitor progress over next 2 weeks.",
                followUpRequired: true,
            });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            concernId: concernId,
            adminNotes: "Student seems stressed about behavior issues.",
            findings: "Peer conflict identified during interview.",
            recommendations: "Schedule follow-up counseling session.",
            closingRemarks: "Will monitor progress over next 2 weeks.",
            followUpRequired: true,
        });
    });

    it("should update an existing report", async () => {
        const res = await request
            .put(`/api/concerns/${concernId}/report`)
            .set("Authorization", `Bearer ${counselor.token}`)
            .send({
                adminNotes: "Updated notes after second session.",
                findings: "Peer conflict identified during interview.",
                recommendations: "Continue weekly counseling.",
                closingRemarks: "Good progress observed.",
                followUpRequired: false,
            });
        expect(res.status).toBe(200);
        expect(res.body.adminNotes).toBe("Updated notes after second session.");
        expect(res.body.followUpRequired).toBe(false);
    });

    it("should return 404 for non-existent concern", async () => {
        const res = await request
            .put("/api/concerns/99999/report")
            .set("Authorization", `Bearer ${counselor.token}`)
            .send({ adminNotes: "test" });
        expect(res.status).toBe(404);
    });
});

describe("GET /api/concerns/:id/report", () => {
    it("should return full report data with status history", async () => {
        const res = await request
            .get(`/api/concerns/${concernId}/report`)
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);

        expect(res.body.concern).toBeDefined();
        expect(res.body.concern.id).toBe(concernId);
        expect(res.body.concern.title).toBe("Report Test Concern");

        expect(res.body.student).toBeDefined();
        expect(res.body.student.firstName).toBe("Test");

        expect(res.body.report).toBeDefined();
        expect(res.body.report.adminNotes).toBe("Updated notes after second session.");
        expect(res.body.report.followUpRequired).toBe(false);

        expect(Array.isArray(res.body.statusHistory)).toBe(true);
        expect(res.body.statusHistory.length).toBeGreaterThanOrEqual(3);

        const statuses = res.body.statusHistory.map((h) => h.newStatus);
        expect(statuses).toContain("pending");
        expect(statuses).toContain("read");
        expect(statuses).toContain("in_review");

        expect(Array.isArray(res.body.files)).toBe(true);
    });

    it("should return null report for concern without saved report", async () => {
        const createRes = await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`)
            .send({
                title: "No Report Concern",
                description: "No report saved for this one",
            });
        const newId = createRes.body.id;

        const res = await request
            .get(`/api/concerns/${newId}/report`)
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(200);
        expect(res.body.report).toBeNull();
    });

    it("student should also be able to view report data", async () => {
        const res = await request
            .get(`/api/concerns/${concernId}/report`)
            .set("Authorization", `Bearer ${student.token}`);
        expect(res.status).toBe(200);
        expect(res.body.concern).toBeDefined();
    });

    it("should return 404 for non-existent concern", async () => {
        const res = await request
            .get("/api/concerns/99999/report")
            .set("Authorization", `Bearer ${counselor.token}`);
        expect(res.status).toBe(404);
    });
});
