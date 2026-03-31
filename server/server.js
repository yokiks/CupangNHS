import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import concernRoutes from "./routes/concernRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import bcrypt from "bcryptjs";
import pool from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(
    cors({
        origin: CLIENT_ORIGIN,
        credentials: true,
    })
);
app.use(express.json());

// Serve uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/concerns", concernRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "Internal server error." });
});

async function ensureGuidanceCounselorAdmin() {
    const username = process.env.GUIDANCE_ADMIN_USERNAME || "CuNHSadmin";
    const password = process.env.GUIDANCE_ADMIN_PASSWORD || "Guidance@CuNHS!";
    const firstName = process.env.GUIDANCE_ADMIN_FIRST_NAME || "Guidance";
    const lastName = process.env.GUIDANCE_ADMIN_LAST_NAME || "Counselor";
    const email = process.env.GUIDANCE_ADMIN_EMAIL || "guidance@cupangnhs.com";

    try {
        const conn = await pool.getConnection();
        try {
            // Ensure required columns exist (idempotent)
            try {
                await conn.query("ALTER TABLE users ADD COLUMN email VARCHAR(150)");
            } catch (err) {
                if (err.code !== "ER_DUP_FIELDNAME") {
                    console.warn("Could not ensure email column exists:", err.message);
                }
            }

            // Check if admin user exists
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Seed guidance counselor admin account if missing
    ensureGuidanceCounselorAdmin();
});