import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../../app.js";
import {
    getPool,
    destroyPool,
    createTestStudent,
    cleanAllTables,
} from "../helpers.js";

const request = supertest(app);

let pool;
let student;

beforeAll(async () => {
    pool = getPool();
    await cleanAllTables(pool);
    student = await createTestStudent(pool);
});

afterAll(async () => {
    await cleanAllTables(pool);
    await destroyPool();
});

describe("Student profile photo", () => {
    it("lets a student upload a profile photo and returns the photo URL", async () => {
        const res = await request
            .patch("/api/auth/me/profile-photo")
            .set("Authorization", `Bearer ${student.token}`)
            .attach("profilePhoto", Buffer.from("fake image"), {
                filename: "profile.png",
                contentType: "image/png",
            });

        expect(res.status).toBe(200);
        expect(res.body.user.profilePhotoUrl).toContain("/uploads/profile_");
    });

    it("lets a student remove their profile photo", async () => {
        const res = await request
            .delete("/api/auth/me/profile-photo")
            .set("Authorization", `Bearer ${student.token}`);

        expect(res.status).toBe(200);
        expect(res.body.user.profilePhotoUrl).toBeNull();
    });
});
