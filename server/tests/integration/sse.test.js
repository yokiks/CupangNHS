import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import http from "http";
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
let server;
let baseUrl;

beforeAll(async () => {
    pool = getPool();
    await cleanAllTables(pool);
    student = await createTestStudent(pool);
    counselor = await createTestCounselor(pool);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
    await cleanAllTables(pool);
    await destroyPool();
    await new Promise((resolve) => server.close(resolve));
});

describe("SSE /api/concerns/events", () => {
    it("should reject unauthenticated requests", async () => {
        const res = await request.get("/api/concerns/events");
        expect(res.status).toBe(401);
    });

    it("should accept authenticated SSE connection via query token", async () => {
        const url = `${baseUrl}/api/concerns/events?token=${encodeURIComponent(student.token)}`;

        const { body, statusCode } = await new Promise((resolve, reject) => {
            const req = http.get(url, (res) => {
                let body = "";
                res.on("data", (chunk) => {
                    body += chunk.toString();
                    if (body.includes(":\n\n")) {
                        res.destroy();
                        resolve({ body, statusCode: res.statusCode });
                    }
                });
                setTimeout(() => {
                    res.destroy();
                    resolve({ body, statusCode: res.statusCode });
                }, 2000);
            });
            req.on("error", (err) => {
                if (err.code !== "ECONNRESET") reject(err);
            });
        });

        expect(statusCode).toBe(200);
    });

    it("should receive concern:statusUpdate when counselor changes status", async () => {
        const createRes = await request
            .post("/api/concerns")
            .set("Authorization", `Bearer ${student.token}`)
            .send({ title: `SSE Test ${Date.now()}`, description: "SSE test", category: "general" });
        const concernId = createRes.body.id;

        const events = [];
        const url = `${baseUrl}/api/concerns/events?token=${encodeURIComponent(student.token)}`;

        const clientRes = await new Promise((resolve) => {
            http.get(url, (res) => {
                let buffer = "";
                res.on("data", (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split("\n");
                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                events.push(JSON.parse(line.slice(6)));
                            } catch { /* partial data */ }
                        }
                    }
                });
                resolve(res);
            });
        });

        await new Promise((r) => setTimeout(r, 500));

        await request
            .patch(`/api/concerns/${concernId}`)
            .set("Authorization", `Bearer ${counselor.token}`)
            .send({ status: "read" });

        await new Promise((r) => setTimeout(r, 1000));
        clientRes.destroy();

        const statusEvent = events.find((e) => e.concernId === concernId && e.newStatus === "read");
        expect(statusEvent).toBeDefined();
    });
});
