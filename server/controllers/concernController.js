import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { broadcast, broadcastToRole, sendToUser } from "../services/sseManager.js";
import { sendParentConcernNotificationEmail, isMailConfigured } from "../services/mailService.js";

const STATUS_FLOW = ["pending", "read", "in_review", "resolved"];
const VALID_STATUS_FILTERS = [...STATUS_FLOW, "deleted"];

const normalizeAccountStatus = (status) => {
    if (!status) return "active";
    if (status === "approved") return "active";
    if (status === "rejected") return "pending_revalidation";
    return status;
};

const buildConcernResponse = (record) => {
    const resp = {
        id: record.id,
        title: record.title,
        description: record.description,
        category: record.category,
        status: record.status,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        schoolYear: record.school_year_id
            ? {
                  id: record.school_year_id,
                  label: record.school_year_label || null,
              }
            : null,
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

        const connStatus = await pool.getConnection();
        let accountStatus;
        try {
            const [rows] = await connStatus.query(
                `SELECT account_status FROM users WHERE id = ? LIMIT 1`,
                [req.user.id]
            );
            accountStatus = normalizeAccountStatus(rows[0]?.account_status);
        } finally {
            connStatus.release();
        }
        if (accountStatus === "pending_revalidation") {
            return res.status(403).json({ message: "Your account requires enrollment revalidation before submitting concerns." });
        }
        if (accountStatus === "inactive") {
            return res.status(403).json({ message: "Inactive students cannot submit concerns." });
        }
        if (accountStatus === "graduated") {
            return res.status(403).json({ message: "Graduated students cannot submit new concerns." });
        }
        if (accountStatus === "pending_approval" || accountStatus === "transferred") {
            return res.status(403).json({ message: "You cannot submit concerns while your account is not active." });
        }

        let involvedStudentIds = [];
        if (req.body.involvedStudentIds) {
            try {
                involvedStudentIds = typeof req.body.involvedStudentIds === "string"
                    ? JSON.parse(req.body.involvedStudentIds)
                    : req.body.involvedStudentIds;
            } catch {
                return res.status(400).json({ message: "The involved-student selection is invalid." });
            }

            if (!Array.isArray(involvedStudentIds)) {
                return res.status(400).json({ message: "The involved-student selection is invalid." });
            }

            const normalizedIds = involvedStudentIds.map(Number);
            if (normalizedIds.some((id) => !Number.isInteger(id) || id <= 0)) {
                return res.status(400).json({ message: "The involved-student selection is invalid." });
            }
            involvedStudentIds = [...new Set(normalizedIds)];

            if (involvedStudentIds.includes(Number(req.user.id))) {
                return res.status(400).json({ message: "You cannot add yourself as an involved student." });
            }
        }

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required." });
        }

        const conn = await pool.getConnection();
        try {
            const [activeYears] = await conn.query(
                "SELECT id FROM school_years WHERE status = 'active' LIMIT 1"
            );
            const activeSchoolYearId = activeYears[0]?.id || null;

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

            if (involvedStudentIds.length > 0) {
                const [eligibleStudents] = await conn.query(
                    `SELECT id
                     FROM users
                     WHERE role = 'student'
                       AND account_status = 'active'
                       AND id IN (?)`,
                    [involvedStudentIds]
                );
                const eligibleIds = new Set(eligibleStudents.map((student) => Number(student.id)));
                const hasUnavailableStudent = involvedStudentIds.some((id) => !eligibleIds.has(id));

                if (hasUnavailableStudent) {
                    return res.status(400).json({
                        message: "One or more involved students are unavailable or no longer active. Remove them and try again.",
                    });
                }
            }

            const [result] = await conn.query(
                `INSERT INTO concerns (user_id, school_year_id, title, description, category, status)
                 VALUES (?, ?, ?, ?, ?, 'pending')`,
                [req.user.id, activeSchoolYearId, title, description, category || "general"]
            );

            await conn.query(
                `INSERT INTO concern_status_history (concern_id, changed_by, old_status, new_status)
                 VALUES (?, ?, NULL, 'pending')`,
                [result.insertId, req.user.id]
            );

            if (involvedStudentIds.length > 0) {
                const values = involvedStudentIds.map((uid) => [result.insertId, uid]);
                await conn.query(
                    `INSERT IGNORE INTO concern_involved_students (concern_id, user_id) VALUES ?`,
                    [values]
                );
            }

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
                `SELECT c.*, sy.label AS school_year_label, u.first_name, u.last_name, u.lrn
                 FROM concerns c
                 LEFT JOIN school_years sy ON c.school_year_id = sy.id
                 JOIN users u ON c.user_id = u.id
                 WHERE c.id = ?`,
                [result.insertId]
            );
            const concern = buildConcernResponse(rows[0]);

            const [counselors] = await conn.query(
                `SELECT id FROM users WHERE role = 'guidance_counselor'`
            );
            const notifMsg = `New concern submitted: ${title}`;
            for (const c of counselors) {
                await conn.query(
                    `INSERT INTO notifications (user_id, concern_id, message, type) VALUES (?, ?, ?, 'info')`,
                    [c.id, result.insertId, notifMsg]
                );
                sendToUser(c.id, "notification:new", { message: notifMsg });
            }

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
                          sy.label AS school_year_label,
                          (SELECT COUNT(*) FROM concerns c2 WHERE c2.user_id = c.user_id) AS concern_count
                   FROM concerns c 
                   LEFT JOIN school_years sy ON c.school_year_id = sy.id
                   JOIN users u ON c.user_id = u.id 
                   WHERE 1=1`
                : `SELECT c.*, sy.label AS school_year_label
                   FROM concerns c
                   LEFT JOIN school_years sy ON c.school_year_id = sy.id
                   WHERE c.user_id = ?`;

            if (!isCounselor) {
                params.push(req.user.id);
            }

            if (status && VALID_STATUS_FILTERS.includes(status)) {
                query += " AND c.status = ?";
                params.push(status);
            } else {
                query += " AND c.status != 'deleted'";
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
            const concerns = rows.map(buildConcernResponse);

            if (isCounselor && concerns.length > 0) {
                const concernIds = concerns.map((c) => c.id);
                const [involvedRows] = await conn.query(
                    `SELECT cis.concern_id, u.id, u.first_name, u.last_name, u.lrn
                     FROM concern_involved_students cis
                     JOIN users u ON cis.user_id = u.id
                     WHERE cis.concern_id IN (?)`,
                    [concernIds]
                );
                const involvedMap = {};
                for (const r of involvedRows) {
                    if (!involvedMap[r.concern_id]) involvedMap[r.concern_id] = [];
                    involvedMap[r.concern_id].push({
                        id: r.id,
                        firstName: r.first_name,
                        lastName: r.last_name,
                        lrn: r.lrn,
                    });
                }
                for (const c of concerns) {
                    c.involvedStudents = involvedMap[c.id] || [];
                }
            }

            return res.json(concerns);
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
                in_review: "Your concern is currently in progress.",
                resolved: "Your concern has been resolved. Thank you for reaching out.",
            };

            await insertNotification(
                conn,
                concern.user_id,
                concern.id,
                `${concern.title} — ${statusMessages[status]}`
            );

            const [involvedRows] = await conn.query(
                `SELECT user_id FROM concern_involved_students WHERE concern_id = ?`,
                [id]
            );

            for (const row of involvedRows) {
                await conn.query(
                    `INSERT INTO notifications (user_id, concern_id, message, type) VALUES (?, ?, ?, 'status_update')`,
                    [row.user_id, id, `You are involved in: ${concern.title} — ${statusMessages[status]}`]
                );
            }

            const [updatedRows] = await conn.query(
                `SELECT c.*, sy.label AS school_year_label
                 FROM concerns c
                 LEFT JOIN school_years sy ON c.school_year_id = sy.id
                 WHERE c.id = ?`,
                [id]
            );
            const updated = buildConcernResponse(updatedRows[0]);

            const ssePayload = { concernId: Number(id), newStatus: status, updatedAt: updated.updatedAt };
            sendToUser(concern.user_id, "concern:statusUpdate", ssePayload);
            broadcast("concern:statusUpdate", ssePayload);
            sendToUser(concern.user_id, "notification:new", {
                message: `${concern.title} — ${statusMessages[status]}`,
            });

            for (const row of involvedRows) {
                sendToUser(row.user_id, "concern:statusUpdate", ssePayload);
                sendToUser(row.user_id, "notification:new", {
                    message: `You are involved in: ${concern.title} — ${statusMessages[status]}`,
                });
            }

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
            const [rows] = await conn.query("SELECT user_id, status FROM concerns WHERE id = ?", [id]);
            if (!rows.length) {
                return res.status(404).json({ message: "Concern not found." });
            }

            if (req.user.role !== "guidance_counselor" && rows[0].user_id !== req.user.id) {
                return res.status(403).json({ message: "You cannot delete this concern." });
            }

            if (rows[0].status === "deleted") {
                return res.status(404).json({ message: "Concern not found." });
            }

            await conn.query("UPDATE concerns SET status = 'deleted', updated_at = NOW() WHERE id = ?", [id]);
            await conn.query(
                `INSERT INTO concern_status_history (concern_id, changed_by, old_status, new_status)
                 VALUES (?, ?, ?, 'deleted')`,
                [id, req.user.id, rows[0].status]
            );

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

export const restoreConcern = async (req, res) => {
    try {
        const { id } = req.params;
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                "SELECT id, user_id, title, status FROM concerns WHERE id = ?",
                [id]
            );

            if (!rows.length) {
                return res.status(404).json({ message: "Concern not found." });
            }

            const concern = rows[0];
            if (concern.status !== "deleted") {
                return res.status(400).json({ message: "Only archived concerns can be restored." });
            }

            const [historyRows] = await conn.query(
                `SELECT old_status
                 FROM concern_status_history
                 WHERE concern_id = ?
                   AND new_status = 'deleted'
                 ORDER BY created_at DESC, id DESC
                 LIMIT 1`,
                [id]
            );
            const restoreStatus = STATUS_FLOW.includes(historyRows[0]?.old_status)
                ? historyRows[0].old_status
                : "in_review";
            const restoreLabel = restoreStatus === "in_review" ? "in review" : restoreStatus.replace("_", " ");

            await conn.query(
                "UPDATE concerns SET status = ?, updated_at = NOW() WHERE id = ?",
                [restoreStatus, id]
            );

            await conn.query(
                `INSERT INTO concern_status_history (concern_id, changed_by, old_status, new_status)
                 VALUES (?, ?, 'deleted', ?)`,
                [id, req.user.id, restoreStatus]
            );

            await insertNotification(
                conn,
                concern.user_id,
                concern.id,
                `${concern.title} — Your archived concern has been restored to ${restoreLabel}.`
            );

            const [updatedRows] = await conn.query(
                `SELECT c.*, sy.label AS school_year_label, u.first_name, u.last_name, u.lrn
                 FROM concerns c
                 LEFT JOIN school_years sy ON c.school_year_id = sy.id
                 JOIN users u ON c.user_id = u.id
                 WHERE c.id = ?`,
                [id]
            );
            const updated = buildConcernResponse(updatedRows[0]);

            const ssePayload = { concernId: Number(id), newStatus: restoreStatus, updatedAt: updated.updatedAt };
            sendToUser(concern.user_id, "concern:statusUpdate", ssePayload);
            sendToUser(concern.user_id, "notification:new", {
                message: `${concern.title} — Your archived concern has been restored to ${restoreLabel}.`,
            });
            broadcast("concern:statusUpdate", ssePayload);

            return res.json({
                message: `Concern restored to ${restoreLabel}.`,
                concern: updated,
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("restoreConcern error:", error);
        return res.status(500).json({ message: "Unable to restore concern." });
    }
};

export const generateConcernReport = async (req, res) => {
    try {
        const { startDate, endDate, status, category } = req.query;
        const conn = await pool.getConnection();
        try {
            const params = [];
            let query = `SELECT c.*, sy.label AS school_year_label, u.first_name, u.last_name, u.lrn 
                         FROM concerns c 
                         LEFT JOIN school_years sy ON c.school_year_id = sy.id
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

            if (status && VALID_STATUS_FILTERS.includes(status)) {
                query += " AND c.status = ?";
                params.push(status);
            }

            if (category) {
                query += " AND c.category = ?";
                params.push(category);
            }

            query += " ORDER BY c.created_at DESC";

            const [rows] = await conn.query(query, params);
            const concerns = rows.map(buildConcernResponse);

            if (concerns.length > 0) {
                const concernIds = concerns.map((c) => c.id);
                const [involvedRows] = await conn.query(
                    `SELECT cis.concern_id, u.id, u.first_name, u.last_name, u.lrn
                     FROM concern_involved_students cis
                     JOIN users u ON cis.user_id = u.id
                     WHERE cis.concern_id IN (?)`,
                    [concernIds]
                );
                const involvedMap = {};
                for (const r of involvedRows) {
                    if (!involvedMap[r.concern_id]) involvedMap[r.concern_id] = [];
                    involvedMap[r.concern_id].push({
                        id: r.id,
                        firstName: r.first_name,
                        lastName: r.last_name,
                        lrn: r.lrn,
                    });
                }
                for (const c of concerns) {
                    c.involvedStudents = involvedMap[c.id] || [];
                }
            }

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
                concerns,
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
            let schoolYearId = Number(req.query.schoolYearId);
            let schoolYear;

            if (req.query.schoolYearId !== undefined && (!Number.isInteger(schoolYearId) || schoolYearId <= 0)) {
                return res.status(400).json({ message: "A valid school year is required." });
            }

            if (req.query.schoolYearId !== undefined) {
                const [years] = await conn.query(
                    "SELECT id, label, status FROM school_years WHERE id = ? LIMIT 1",
                    [schoolYearId]
                );
                schoolYear = years[0];
            } else {
                const [years] = await conn.query(
                    "SELECT id, label, status FROM school_years WHERE status = 'active' LIMIT 1"
                );
                schoolYear = years[0];
                schoolYearId = Number(schoolYear?.id);
            }

            if (!schoolYear) {
                return res.status(404).json({ message: "School year not found." });
            }

            const [reporterRows] = await conn.query(
                `SELECT u.id, u.first_name, u.last_name, u.lrn, u.account_status,
                        COUNT(DISTINCT c.id) AS activity_count,
                        COUNT(DISTINCT CASE WHEN c.status = 'deleted' THEN c.id END) AS archived_count,
                        COUNT(DISTINCT CASE WHEN c.status <> 'deleted' THEN c.id END) AS current_count
                 FROM concerns c
                 JOIN users u ON c.user_id = u.id
                 WHERE c.school_year_id = ?
                 GROUP BY u.id, u.first_name, u.last_name, u.lrn, u.account_status
                 HAVING activity_count >= 2
                 ORDER BY activity_count DESC, u.last_name, u.first_name`,
                [schoolYearId]
            );
            const [involvedRows] = await conn.query(
                `SELECT u.id, u.first_name, u.last_name, u.lrn, u.account_status,
                        COUNT(DISTINCT c.id) AS activity_count,
                        COUNT(DISTINCT CASE WHEN c.status = 'deleted' THEN c.id END) AS archived_count,
                        COUNT(DISTINCT CASE WHEN c.status <> 'deleted' THEN c.id END) AS current_count
                 FROM concern_involved_students cis
                 JOIN concerns c ON c.id = cis.concern_id
                 JOIN users u ON u.id = cis.user_id
                 WHERE c.school_year_id = ?
                 GROUP BY u.id, u.first_name, u.last_name, u.lrn, u.account_status
                 HAVING activity_count >= 2
                 ORDER BY activity_count DESC, u.last_name, u.first_name`,
                [schoolYearId]
            );

            const mapStudent = (r, countKey) => ({
                    id: r.id,
                    firstName: r.first_name,
                    lastName: r.last_name,
                    lrn: r.lrn,
                    accountStatus: r.account_status,
                    [countKey]: Number(r.activity_count),
                    currentCount: Number(r.current_count),
                    archivedCount: Number(r.archived_count),
                });

            return res.json({
                schoolYear: {
                    id: schoolYear.id,
                    label: schoolYear.label,
                    status: schoolYear.status,
                },
                frequentReporters: reporterRows.map((row) => mapStudent(row, "reportCount")),
                frequentlyInvolved: involvedRows.map((row) => mapStudent(row, "involvedCount")),
            });
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

            const notifiedParents = [{ studentName: `${concern.first_name} ${concern.last_name}`, email: concern.parent_email }];
            const skippedInvolved = [];

            const [involvedRows] = await conn.query(
                `SELECT u.id, u.first_name, u.last_name, u.parent_email, u.parent_name
                 FROM concern_involved_students cis
                 JOIN users u ON cis.user_id = u.id
                 WHERE cis.concern_id = ?`,
                [id]
            );

            for (const inv of involvedRows) {
                if (!inv.parent_email) {
                    skippedInvolved.push(`${inv.first_name} ${inv.last_name}`);
                    continue;
                }
                try {
                    await sendParentConcernNotificationEmail({
                        to: inv.parent_email,
                        parentName: inv.parent_name || "Parent/Guardian",
                        studentName: `${inv.first_name} ${inv.last_name}`,
                        concernTitle: concern.title,
                        concernCategory: concern.category,
                        counselorName,
                    });
                    notifiedParents.push({ studentName: `${inv.first_name} ${inv.last_name}`, email: inv.parent_email });

                    await conn.query(
                        `INSERT INTO notifications (user_id, concern_id, message, type)
                         VALUES (?, ?, ?, 'info')`,
                        [inv.id, id, `Your parent/guardian has been notified about: ${concern.title}`]
                    );
                } catch (emailErr) {
                    console.error(`Failed to notify parent of involved student ${inv.id}:`, emailErr);
                    skippedInvolved.push(`${inv.first_name} ${inv.last_name}`);
                }
            }

            let message = `Parent notification email sent to ${notifiedParents.length} parent(s).`;
            if (skippedInvolved.length > 0) {
                message += ` Skipped (no parent email): ${skippedInvolved.join(", ")}.`;
            }

            return res.json({
                message,
                notifiedCount: notifiedParents.length,
                skippedStudents: skippedInvolved,
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("notifyParent error:", error);
        return res.status(500).json({ message: "Unable to send parent notification." });
    }
};
