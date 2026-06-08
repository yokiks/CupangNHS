import supertest from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

let _pool;

export function getPool() {
    if (!_pool) {
        _pool = mysql.createPool({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "cupangnhs_test",
            port: Number(process.env.DB_PORT) || 3306,
            waitForConnections: true,
            connectionLimit: 5,
            timezone: "Z",
        });
    }
    return _pool;
}

export async function destroyPool() {
    if (_pool) {
        await _pool.end();
        _pool = null;
    }
}

export function makeToken(user) {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,
            firstName: user.first_name || user.firstName,
            lastName: user.last_name || user.lastName,
            lrn: user.lrn || null,
        },
        JWT_SECRET,
        { expiresIn: "2h" }
    );
}

export async function createTestStudent(pool) {
    const hash = await bcrypt.hash("Test1234!", 10);
    const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const baseValues = ["Test", "Student", `student_${unique}`, hash, `301420${unique.slice(-6)}`, `student${unique}@test.com`];
    let result;
    try {
        [result] = await pool.query(
            `INSERT INTO users (first_name, last_name, username, password_hash, role, lrn, email, account_status)
             VALUES (?, ?, ?, ?, 'student', ?, ?, 'active')`,
            baseValues
        );
    } catch {
        [result] = await pool.query(
            `INSERT INTO users (first_name, last_name, username, password_hash, role, lrn, email)
             VALUES (?, ?, ?, ?, 'student', ?, ?)`,
            baseValues
        );
    }
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    const user = rows[0];
    return { user, token: makeToken(user) };
}

export async function createTestCounselor(pool) {
    const hash = await bcrypt.hash("Counsel1234!", 10);
    const [result] = await pool.query(
        `INSERT INTO users (first_name, last_name, username, password_hash, role, lrn, email)
         VALUES (?, ?, ?, ?, 'guidance_counselor', NULL, ?)`,
        ["Test", "Counselor", `counselor_${Date.now()}`, hash, `counselor${Date.now()}@test.com`]
    );
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    const user = rows[0];
    return { user, token: makeToken(user) };
}

export async function cleanTable(pool, table) {
    await pool.query(`DELETE FROM \`${table}\``);
}

export async function cleanAllTables(pool) {
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    const tables = [
        "enrollment_validation_history",
        "revalidation_requests",
        "concern_involved_students",
        "concern_status_history",
        "concern_reports",
        "concern_attachments",
        "notifications",
        "concerns",
        "password_resets",
        "school_years",
        "student_records",
        "users",
    ];
    for (const t of tables) {
        await pool.query(`TRUNCATE TABLE \`${t}\``);
    }
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");
}
