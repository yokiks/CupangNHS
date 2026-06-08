import "./config/env.js";
import app from "./app.js";
import bcrypt from "bcryptjs";
import pool from "./config/db.js";
import knex from "./db/knex.js";

const PORT = process.env.PORT || 5000;

async function ensureGuidanceCounselorAdmin() {
    const username = process.env.GUIDANCE_ADMIN_USERNAME || "CuNHSadmin";
    const password = process.env.GUIDANCE_ADMIN_PASSWORD || "Guidance@CuNHS!";
    const firstName = process.env.GUIDANCE_ADMIN_FIRST_NAME || "Guidance";
    const lastName = process.env.GUIDANCE_ADMIN_LAST_NAME || "Counselor";
    const email = process.env.GUIDANCE_ADMIN_EMAIL || "guidance@cupangnhs.com";

    try {
        const conn = await pool.getConnection();
        try {
            try {
                await conn.query("ALTER TABLE users ADD COLUMN email VARCHAR(150)");
            } catch (err) {
                if (err.code !== "ER_DUP_FIELDNAME") {
                    console.warn("Could not ensure email column exists:", err.message);
                }
            }

            const [rows] = await conn.query(
                "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
                [username, email]
            );
            if (rows.length) {
                console.log("Guidance counselor admin already exists.");
                return;
            }

            const passwordHash = await bcrypt.hash(password, 10);
            await conn.query(
                `INSERT INTO users (first_name, last_name, username, password_hash, role, lrn, email)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [firstName, lastName, username, passwordHash, "guidance_counselor", null, email]
            );

            console.log("Guidance counselor admin created:");
            console.log(`  username: ${username}`);
            console.log(`  password: ${password}`);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("Failed to ensure guidance counselor admin:", error);
    }
}

async function startServer() {
    try {
        console.log("Running database migrations...");
        await knex.migrate.latest();
        console.log("Migrations complete.");
    } catch (error) {
        console.error("Migration failed:", error);
        console.log("Server will start anyway — tables may already exist.");
    }

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        ensureGuidanceCounselorAdmin();
    });
}

startServer();
