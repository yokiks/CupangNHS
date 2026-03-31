import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";
import { sendPasswordResetEmail, isPasswordResetMailConfigured } from "../services/mailService.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";
const PASSWORD_RESET_MINUTES = parseInt(process.env.PASSWORD_RESET_MINUTES || "60", 10);
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || "http://localhost:3000").replace(
    /\/$/,
    ""
);

const issueToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            lrn: user.lrn,
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES_IN }
    );
};

const mapUser = (user) => ({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    lrn: user.lrn,
    role: user.role,
});

export const registerUser = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            username,
            password,
            role = "student",
            studentId,
            studentEmail,
            guidanceEmail,
        } = req.body;
        // Only students can self-register; guidance counselors will be provisioned by admins
        const allowedRoles = ["student"];

        if (!firstName || !lastName || !username || !password) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role selected." });
        }

        const lrn = studentId || req.body.lrn || null;
        // Get email based on role (only student supported for self-registration)
        const email = studentEmail;

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        // Basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({ message: "Invalid email format." });
        }

        if (role === "student") {
            if (!lrn) {
                return res.status(400).json({ message: "LRN is required for students." });
            }
            const lrnPattern = /^301420\d{6}$/;
            if (!lrnPattern.test(lrn)) {
                return res.status(400).json({
                    message: "LRN must be 12 digits and start with 301420.",
                });
            }
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters." });
        }

        const conn = await pool.getConnection();
        try {
            // Ensure email column exists, add if not
            try {
                await conn.query("ALTER TABLE users ADD COLUMN email VARCHAR(150)");
            } catch (err) {
                // Column already exists, ignore
                if (err.code !== "ER_DUP_FIELDNAME") {
                    console.warn("Could not add email column:", err.message);
                }
            }

            // Ensure username, LRN, or email is unique
            const [existingUsers] = await conn.query(
                "SELECT id FROM users WHERE username = ? OR lrn = ? OR email = ? LIMIT 1",
                [username, lrn, email]
            );
            if (existingUsers.length) {
                return res.status(400).json({ message: "Username, LRN, or email already exists." });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const [insertResult] = await conn.query(
                `INSERT INTO users (first_name, last_name, username, password_hash, role, lrn, email)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [firstName, lastName, username, passwordHash, role, lrn || null, email]
            );

            const user = {
                id: insertResult.insertId,
                first_name: firstName,
                last_name: lastName,
                username,
                lrn,
                role,
            };

            const token = issueToken(user);
            return res.status(201).json({
                message: "Registration successful.",
                token,
                user: mapUser(user),
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("registerUser error:", error);
        return res.status(500).json({ message: "Server error during registration." });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { identifier, username, lrn, password } = req.body;
        const loginIdentifier = identifier || username || lrn;

        if (!loginIdentifier || !password) {
            return res.status(400).json({ message: "LRN/username and password are required." });
        }

        const conn = await pool.getConnection();
        try {
            const [users] = await conn.query(
                "SELECT id, first_name, last_name, username, password_hash, role, lrn FROM users WHERE username = ? OR lrn = ? LIMIT 1",
                [loginIdentifier, loginIdentifier]
            );

            if (!users.length) {
                return res.status(401).json({ message: "Invalid credentials." });
            }

            const user = users[0];
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ message: "Invalid credentials." });
            }

            const token = issueToken(user);
            return res.json({
                message: "Login successful.",
                token,
                user: mapUser(user),
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("loginUser error:", error);
        return res.status(500).json({ message: "Server error during login." });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const [users] = await conn.query(
                "SELECT id, first_name, last_name, username, role, lrn FROM users WHERE id = ? LIMIT 1",
                [req.user.id]
            );

            if (!users.length) {
                return res.status(404).json({ message: "User not found." });
            }

            return res.json({ user: mapUser(users[0]) });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getCurrentUser error:", error);
        return res.status(500).json({ message: "Unable to fetch user profile." });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Please provide your email address." });
        }

        // Basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({ message: "Invalid email format." });
        }

        const conn = await pool.getConnection();
        try {
            // Check if email column exists, if not return error
            let [users] = [];
            try {
                [users] = await conn.query(
                    "SELECT id FROM users WHERE email = ? LIMIT 1",
                    [email]
                );
            } catch (err) {
                if (err.code === "ER_BAD_FIELD_ERROR") {
                    return res.status(500).json({
                        message: "Email functionality not available. Please contact support."
                    });
                }
                throw err;
            }

            if (!users.length) {
                // Do not reveal whether the account exists (no email sent — user must be in DB)
                console.info("[forgot-password] No user with this email; reset email not sent.");
                return res.json({
                    message: "If an account exists with that email, a password reset link has been sent.",
                });
            }

            const user = users[0];
            const token = crypto.randomBytes(32).toString("hex");

            await conn.query(
                `INSERT INTO password_resets (user_id, token, expires_at, used)
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), 0)
                 ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE), used = 0`,
                [user.id, token, PASSWORD_RESET_MINUTES, PASSWORD_RESET_MINUTES]
            );

            const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
            let mailSent = false;
            try {
                const mailResult = await sendPasswordResetEmail({ to: email, resetUrl });
                mailSent = mailResult.sent;
            } catch (mailErr) {
                const detail =
                    mailErr?.response?.data ||
                    mailErr?.response ||
                    mailErr?.message ||
                    mailErr;
                console.error("sendPasswordResetEmail error:", detail);
            }

            const response = {
                message: "If an account exists with that email, a password reset link has been sent. Please check your email inbox and spam folder.",
            };
            const isDev = (process.env.NODE_ENV || "development") !== "production";
            if (isDev && (!mailSent || !isPasswordResetMailConfigured())) {
                response.token = token;
                response.resetUrl = resetUrl;
                if (!mailSent) {
                    response.message =
                        "Email is not fully configured (Gmail OAuth). For development, use the reset link or token below.";
                }
            }
            return res.json(response);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("forgotPassword error:", error);
        return res.status(500).json({ message: "Unable to process password reset." });
    }
};

export const validateResetToken = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ valid: false, message: "No token provided." });
        }

        const conn = await pool.getConnection();
        try {
            const [records] = await conn.query(
                "SELECT user_id FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1",
                [token]
            );
            if (!records.length) {
                return res.status(400).json({ valid: false, message: "This reset link is invalid or has expired. Please request a new one." });
            }
            return res.json({ valid: true });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("validateResetToken error:", error);
        return res.status(500).json({ valid: false, message: "Unable to validate token." });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required." });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters." });
        }

        const conn = await pool.getConnection();
        try {
            const [records] = await conn.query(
                "SELECT user_id FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1",
                [token]
            );

            if (!records.length) {
                return res.status(400).json({ message: "Invalid or expired token." });
            }

            const userId = records[0].user_id;
            const passwordHash = await bcrypt.hash(newPassword, 10);

            await conn.query("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
            await conn.query("UPDATE password_resets SET used = 1 WHERE token = ?", [token]);

            return res.json({ message: "Password reset successful. You may now log in." });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("resetPassword error:", error);
        return res.status(500).json({ message: "Unable to reset password." });
    }
};
