import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { broadcast, broadcastToRole, sendToUser } from "../services/sseManager.js";
import { sendParentConcernNotificationEmail, isMailConfigured } from "../services/mailService.js";

const STATUS_FLOW = ["pending", "read", "in_review", "resolved"];

const buildConcernResponse = (record) => {
    const resp = {
        id: record.id,
        title: record.title,
        description: record.description,
        category: record.category,
        status: record.status,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        userId: record.user_id,
        firstName: record.first_name,
        lastName: record.last_name,
        studentId: record.lrn,
        student: record.first_name
            ? {
                  id: record.user_id,
                  firstName: record.first_name,
                  lastName: record.last_name,
                  lrn: record.lrn,
              }
            : undefined,
    };
    if (record.concern_count !== undefined) {
        resp.concernCount = Number(record.concern_count);
    }
    return resp;
};

export const createConcern = async (req, res) => {
    try {
        const { title, description, category } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required." });
        }

        const conn = await pool.getConnection();
        try {
            const [existing] = await conn.query(
                `SELECT id FROM concerns 
                 WHERE user_id = ? AND title = ? AND status IN ('pending', 'read', 'in_review') LIMIT 1`,
                [req.user.id, title]
            );
            if (existing.length) {
                return res.status(409).json({
                    message:
                        "You already submitted this concern. Please wait for the counselor to respond or update the existing concern.",
                });
            }

            const [result] = await conn.query(
                `INSERT INTO concerns (user_id, title, description, category, status)
                 VALUES (?, ?, ?, ?, 'pending')`,
                [req.user.id, title, description, category || "general"]
            );

            // Record initial status in history
            await conn.query(
                `INSERT INTO concern_status_history (concern_id, changed_by, old_status, new_status)
                 VALUES (?, ?, NULL, 'pending')`,
                [result.insertId, req.user.id]
            );

            const files = Array.isArray(req.files) ? req.files : [];
            if (files.length > 0) {
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);
                const uploadDir = path.join(__dirname, "..", "uploads");
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                for (const f of files) {
                    const ext = f.originalname.includes(".") ? `.${f.originalname.split(".").pop()}` : "";
                    const stored = `concern_${result.insertId}_${Date.now()}_${Math.random()
                        .toString(36)
                        .slice(2)}${ext}`;
                    const filePath = path.join(uploadDir, stored);
                    fs.writeFileSync(filePath, f.buffer);
                    await conn.query(
                        `INSERT INTO concern_attachments (concern_id, original_name, stored_name, mime_type, size)
                         VALUES (?, ?, ?, ?, ?)`,
                        [result.insertId, f.originalname, stored, f.mimetype, f.size]
                    );
                }
            }

            const [rows] = await conn.query(
                `SELECT c.*, u.first_name, u.last_name, u.lrn
                 FROM concerns c JOIN users u ON c.user_id = u.id
                 WHERE c.id = ?`,
                [result.insertId]
            );
            const concern = buildConcernResponse(rows[0]);

            broadcast("concern:new", concern);

            return res.status(201).json(concern);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("createConcern error:", error);
        return res.status(500).json({ message: "Unable to submit concern." });
    }
};

export const getConcerns = async (req, res) => {
    try {
        const { status, category, sortBy = "created_at", sortOrder = "DESC" } = req.query;
        const conn = await pool.getConnection();
        try {
            const params = [];
            const isCounselor = req.user.role === "guidance_counselor";
            let query = isCounselor
                ? `SELECT c.*, u.first_name, u.last_name, u.lrn,
                          (SELECT COUNT(*) FROM concerns c2 WHERE c2.user_id = c.user_id) AS concern_count
                   FROM concerns c 
                   JOIN users u ON c.user_id = u.id 
                   WHERE 1=1`
                : `SELECT c.* FROM concerns c WHERE c.user_id = ?`;

            if (!isCounselor) {
                params.push(req.user.id);
            }

            if (status && STATUS_FLOW.includes(status)) {
                query += " AND c.status = ?";
                params.push(status);
            }

            if (category) {
                query += " AND c.category = ?";
                params.push(category);
            }

            const sortableColumns = ["created_at", "updated_at", "status", "category"];
            const column = sortableColumns.includes(sortBy) ? sortBy : "created_at";
            const order = sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";
            query += ` ORDER BY c.${column} ${order}`;

            const [rows] = await conn.query(query, params);
            return res.json(rows.map(buildConcernResponse));
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getConcerns error:", error);
        return res.status(500).json({ message: "Unable to fetch concerns." });
    }
};

const insertNotification = async (conn, userId, concernId, message) => {
    await conn.query(
        `INSERT INTO notifications (user_id, concern_id, message, type) VALUES (?, ?, ?, 'status_update')`,
        [userId, concernId, message]
    );
};

export const updateConcernStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!STATUS_FLOW.includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        const conn = await pool.getConnection();
        try {
            const [concerns] = await conn.query(
                `SELECT c.*, u.first_name, u.last_name, u.id as user_id 
                 FROM concerns c 
                 JOIN users u ON c.user_id = u.id 
                 WHERE c.id = ?`,
                [id]
            );

            if (!concerns.length) {
                return res.status(404).json({ message: "Concern not found." });
            }

            const concern = concerns[0];
            const oldStatus = concern.status;

            await conn.query(
                "UPDATE concerns SET status = ?, updated_at = NOW() WHERE id = ?",
                [status, id]
            );

            await conn.query(
                `INSERT INTO concern_status_history (concern_id, changed_by, old_status, new_status)
                 VALUES (?, ?, ?, ?)`,
                [id, req.user.id, oldStatus, status]
            );

            const statusMessages = {
                pending: "Your concern has been received and is pending review.",
                read: "Your concern has been read by the guidance counselor.",
                in_review: "Your concern is currently being reviewed.",
                resolved: "Your concern has been resolved. Thank you for reaching out.",
            };

            await insertNotification(
                conn,
                concern.user_id,
                concern.id,
                `${concern.title} — ${statusMessages[status]}`
            );

            const [updatedRows] = await conn.query("SELECT * FROM concerns WHERE id = ?", [id]);
            const updated = buildConcernResponse(updatedRows[0]);

            const ssePayload = { concernId: Number(id), newStatus: status, updatedAt: updated.updatedAt };
            sendToUser(concern.user_id, "concern:statusUpdate", ssePayload);
            broadcast("concern:statusUpdate", ssePayload);
            sendToUser(concern.user_id, "notification:new", {
                message: `${concern.title} — ${statusMessages[status]}`,
            });

            return res.json(updated);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("updateConcernStatus error:", error);
        return res.status(500).json({ message: "Unable to update concern status." });
    }
};

export const deleteConcern = async (req, res) => {
    try {
        const { id } = req.params;
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query("SELECT user_id FROM concerns WHERE id = ?", [id]);
            if (!rows.length) {
                return res.status(404).json({ message: "Concern not found." });
            }

            if (req.user.role !== "guidance_counselor" && rows[0].user_id !== req.user.id) {
                return res.status(403).json({ message: "You cannot delete this concern." });
            }

            const studentUserId = rows[0].user_id;
            await conn.query("DELETE FROM concerns WHERE id = ?", [id]);

            broadcast("concern:deleted", { concernId: Number(id) });

            return res.json({ message: "Concern deleted." });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("deleteConcern error:", error);
        return res.status(500).json({ message: "Unable to delete concern." });
    }
};

export const generateConcernReport = async (req, res) => {
    try {
        const { startDate, endDate, status, category } = req.query;
        const conn = await pool.getConnection();
        try {
            const params = [];
            let query = `SELECT c.*, u.first_name, u.last_name, u.lrn 
                         FROM concerns c 
                         JOIN users u ON c.user_id = u.id 
                         WHERE 1=1`;

            if (startDate) {
                query += " AND DATE(c.created_at) >= ?";
                params.push(startDate);
            }

            if (endDate) {
                query += " AND DATE(c.created_at) <= ?";
                params.push(endDate);
            }

            if (status && STATUS_FLOW.includes(status)) {
                query += " AND c.status = ?";
                params.push(status);
            }

            if (category) {
                query += " AND c.category = ?";
                params.push(category);
            }

            query += " ORDER BY c.created_at DESC";

            const [rows] = await conn.query(query, params);
            const summary = {
                total: rows.length,
                byStatus: STATUS_FLOW.reduce((acc, key) => {
                    acc[key] = rows.filter((row) => row.status === key).length;
                    return acc;
                }, {}),
                byCategory: rows.reduce((acc, row) => {
                    acc[row.category] = (acc[row.category] || 0) + 1;
                    return acc;
                }, {}),
            };

            return res.json({
                generatedAt: new Date().toISOString(),
                summary,
                concerns: rows.map(buildConcernResponse),
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("generateConcernReport error:", error);
        return res.status(500).json({ message: "Unable to generate report." });
    }
};

export const getFlaggedStudents = async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `SELECT u.id, u.first_name, u.last_name, u.lrn,
                        COUNT(c.id) AS concern_count
                 FROM concerns c
                 JOIN users u ON c.user_id = u.id
                 GROUP BY u.id
                 HAVING concern_count >= 1
                 ORDER BY concern_count DESC`
            );
            return res.json(
                rows.map((r) => ({
                    id: r.id,
                    firstName: r.first_name,
                    lastName: r.last_name,
                    lrn: r.lrn,
                    concernCount: Number(r.concern_count),
                }))
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getFlaggedStudents error:", error);
        return res.status(500).json({ message: "Unable to fetch flagged students." });
    }
};

export const notifyParent = async (req, res) => {
    try {
        const { id } = req.params;
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `SELECT c.title, c.category, c.status,
                        u.first_name, u.last_name, u.parent_email, u.parent_name
                 FROM concerns c
                 JOIN users u ON c.user_id = u.id
                 WHERE c.id = ?`,
                [id]
            );

            if (!rows.length) {
                return res.status(404).json({ message: "Concern not found." });
            }

            const concern = rows[0];

            if (!concern.parent_email) {
                return res.status(400).json({ message: "No parent email on file for this student." });
            }

            if (!isMailConfigured()) {
                return res.status(503).json({ message: "Email service is not configured. Please set up Gmail OAuth in .env." });
            }

            const counselorName = `${req.user.firstName} ${req.user.lastName}`;
            await sendParentConcernNotificationEmail({
                to: concern.parent_email,
                parentName: concern.parent_name || "Parent/Guardian",
                studentName: `${concern.first_name} ${concern.last_name}`,
                concernTitle: concern.title,
                concernCategory: concern.category,
                counselorName,
            });

            await conn.query(
                `INSERT INTO notifications (user_id, concern_id, message, type)
                 VALUES ((SELECT user_id FROM concerns WHERE id = ?), ?, ?, 'info')`,
                [id, id, `Parent/guardian has been notified about: ${concern.title}`]
            );

            return res.json({ message: "Parent notification email sent successfully." });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("notifyParent error:", error);
        return res.status(500).json({ message: "Unable to send parent notification." });
    }
};
