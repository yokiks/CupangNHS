import pool from "../config/db.js";

export const saveConcernReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes, findings, recommendations, closingRemarks, followUpRequired } = req.body;

        const conn = await pool.getConnection();
        try {
            const [concerns] = await conn.query("SELECT id FROM concerns WHERE id = ?", [id]);
            if (!concerns.length) {
                return res.status(404).json({ message: "Concern not found." });
            }

            const [existing] = await conn.query(
                "SELECT id FROM concern_reports WHERE concern_id = ?",
                [id]
            );

            if (existing.length) {
                await conn.query(
                    `UPDATE concern_reports
                     SET admin_notes = ?, findings = ?, recommendations = ?,
                         closing_remarks = ?, follow_up_required = ?, updated_at = NOW()
                     WHERE concern_id = ?`,
                    [
                        adminNotes || null,
                        findings || null,
                        recommendations || null,
                        closingRemarks || null,
                        followUpRequired ? 1 : 0,
                        id,
                    ]
                );
            } else {
                await conn.query(
                    `INSERT INTO concern_reports
                     (concern_id, counselor_id, admin_notes, findings, recommendations, closing_remarks, follow_up_required)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        req.user.id,
                        adminNotes || null,
                        findings || null,
                        recommendations || null,
                        closingRemarks || null,
                        followUpRequired ? 1 : 0,
                    ]
                );
            }

            const [rows] = await conn.query(
                "SELECT * FROM concern_reports WHERE concern_id = ?",
                [id]
            );

            const report = rows[0];
            return res.json({
                id: report.id,
                concernId: report.concern_id,
                counselorId: report.counselor_id,
                adminNotes: report.admin_notes,
                findings: report.findings,
                recommendations: report.recommendations,
                closingRemarks: report.closing_remarks,
                followUpRequired: Boolean(report.follow_up_required),
                createdAt: report.created_at,
                updatedAt: report.updated_at,
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("saveConcernReport error:", error);
        return res.status(500).json({ message: "Unable to save report." });
    }
};

export const getConcernReport = async (req, res) => {
    try {
        const { id } = req.params;

        const conn = await pool.getConnection();
        try {
            const [concerns] = await conn.query(
                `SELECT c.*, u.first_name, u.last_name, u.lrn,
                        sr.grade_level, sr.section
                 FROM concerns c
                 JOIN users u ON c.user_id = u.id
                 LEFT JOIN student_records sr ON u.lrn = sr.lrn
                 WHERE c.id = ?`,
                [id]
            );

            if (!concerns.length) {
                return res.status(404).json({ message: "Concern not found." });
            }

            const concern = concerns[0];

            const [reportRows] = await conn.query(
                "SELECT * FROM concern_reports WHERE concern_id = ?",
                [id]
            );

            const [historyRows] = await conn.query(
                `SELECT csh.*, u.first_name AS changed_by_first, u.last_name AS changed_by_last
                 FROM concern_status_history csh
                 JOIN users u ON csh.changed_by = u.id
                 WHERE csh.concern_id = ?
                 ORDER BY csh.created_at ASC`,
                [id]
            );

            const [files] = await conn.query(
                `SELECT id, original_name, stored_name, mime_type, size, created_at
                 FROM concern_attachments WHERE concern_id = ? ORDER BY id DESC`,
                [id]
            );

            const baseUrl = `${req.protocol}://${req.get("host")}`;
            const report = reportRows[0] || null;

            return res.json({
                concern: {
                    id: concern.id,
                    title: concern.title,
                    description: concern.description,
                    category: concern.category,
                    status: concern.status,
                    createdAt: concern.created_at,
                    updatedAt: concern.updated_at,
                },
                student: {
                    id: concern.user_id,
                    firstName: concern.first_name,
                    lastName: concern.last_name,
                    lrn: concern.lrn,
                    gradeLevel: concern.grade_level || null,
                    section: concern.section || null,
                },
                report: report
                    ? {
                          id: report.id,
                          counselorId: report.counselor_id,
                          adminNotes: report.admin_notes,
                          findings: report.findings,
                          recommendations: report.recommendations,
                          closingRemarks: report.closing_remarks,
                          followUpRequired: Boolean(report.follow_up_required),
                          createdAt: report.created_at,
                          updatedAt: report.updated_at,
                      }
                    : null,
                statusHistory: historyRows.map((h) => ({
                    id: h.id,
                    oldStatus: h.old_status,
                    newStatus: h.new_status,
                    changedBy: `${h.changed_by_first} ${h.changed_by_last}`,
                    timestamp: h.created_at,
                })),
                files: files.map((f) => ({
                    id: f.id,
                    name: f.original_name,
                    url: `${baseUrl}/uploads/${f.stored_name}`,
                    mimeType: f.mime_type,
                    size: f.size,
                    createdAt: f.created_at,
                })),
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getConcernReport error:", error);
        return res.status(500).json({ message: "Unable to fetch report." });
    }
};
