import pool from "../config/db.js";

const buildProofUrl = (req, storedName) => {
    if (!storedName) return null;
    return `${req.protocol}://${req.get("host")}/uploads/${storedName}`;
};

export const searchStudents = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.json([]);
        }

        const term = `%${q.trim()}%`;
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `SELECT id, first_name, last_name, lrn
                 FROM users
                 WHERE role = 'student'
                   AND (first_name LIKE ? OR last_name LIKE ? OR lrn LIKE ?
                        OR CONCAT(first_name, ' ', last_name) LIKE ?)
                 ORDER BY last_name, first_name
                 LIMIT 20`,
                [term, term, term, term]
            );
            return res.json(
                rows.map((r) => ({
                    id: r.id,
                    firstName: r.first_name,
                    lastName: r.last_name,
                    lrn: r.lrn,
                }))
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("searchStudents error:", error);
        return res.status(500).json({ message: "Unable to search students." });
    }
};

export const getStudentEnrollmentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const conn = await pool.getConnection();
        try {
            const [students] = await conn.query(
                "SELECT id FROM users WHERE id = ? AND role = 'student' LIMIT 1",
                [id]
            );

            if (!students.length) {
                return res.status(404).json({ message: "Student not found." });
            }

            const [rows] = await conn.query(
                `SELECT evh.id,
                        evh.school_year_id,
                        evh.school_year_label,
                        evh.grade_level,
                        evh.section,
                        evh.school_id_proof_original_name,
                        evh.school_id_proof_stored_name,
                        evh.validated_at,
                        approver.id AS approved_by_id,
                        approver.first_name AS approved_by_first_name,
                        approver.last_name AS approved_by_last_name
                 FROM enrollment_validation_history evh
                 JOIN users approver ON evh.approved_by_id = approver.id
                 WHERE evh.student_id = ?
                 ORDER BY evh.validated_at DESC, evh.id DESC`,
                [id]
            );

            return res.json(
                rows.map((row) => ({
                    id: row.id,
                    schoolYear: row.school_year_id
                        ? {
                            id: row.school_year_id,
                            label: row.school_year_label,
                        }
                        : null,
                    gradeLevel: row.grade_level,
                    section: row.section,
                    schoolIdProofName: row.school_id_proof_original_name,
                    schoolIdProofUrl: buildProofUrl(req, row.school_id_proof_stored_name),
                    validatedAt: row.validated_at,
                    approvedBy: {
                        id: row.approved_by_id,
                        firstName: row.approved_by_first_name,
                        lastName: row.approved_by_last_name,
                    },
                }))
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getStudentEnrollmentHistory error:", error);
        return res.status(500).json({ message: "Unable to fetch enrollment validation history." });
    }
};

export const getStudentProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const conn = await pool.getConnection();
        try {
            const [users] = await conn.query(
                `SELECT u.id, u.first_name, u.last_name, u.lrn, u.email,
                        u.parent_name, u.parent_email, u.parent_contact,
                        u.account_status, u.profile_photo_stored_name, sr.grade_level, sr.section
                 FROM users u
                 LEFT JOIN student_records sr ON u.lrn = sr.lrn
                 WHERE u.id = ? AND u.role = 'student'`,
                [id]
            );

            if (!users.length) {
                return res.status(404).json({ message: "Student not found." });
            }

            const user = users[0];

            const [reported] = await conn.query(
                `SELECT c.id, c.title, c.category, c.status, c.created_at, c.updated_at
                 FROM concerns c
                 WHERE c.user_id = ?
                 ORDER BY c.created_at DESC`,
                [id]
            );

            const [involved] = await conn.query(
                `SELECT c.id, c.title, c.category, c.status, c.created_at, c.updated_at,
                        u.first_name AS reporter_first, u.last_name AS reporter_last
                 FROM concern_involved_students cis
                 JOIN concerns c ON cis.concern_id = c.id
                 JOIN users u ON c.user_id = u.id
                 WHERE cis.user_id = ?
                 ORDER BY c.created_at DESC`,
                [id]
            );

            return res.json({
                student: {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    lrn: user.lrn,
                    email: user.email,
                    gradeLevel: user.grade_level || null,
                    section: user.section || null,
                    parentName: user.parent_name || null,
                    parentEmail: user.parent_email || null,
                    parentContact: user.parent_contact || null,
                    accountStatus: user.account_status,
                    profilePhotoUrl: buildProofUrl(req, user.profile_photo_stored_name),
                },
                stats: {
                    reportedCount: reported.length,
                    involvedCount: involved.length,
                },
                reportedConcerns: reported.map((c) => ({
                    id: c.id,
                    title: c.title,
                    category: c.category,
                    status: c.status,
                    createdAt: c.created_at,
                    updatedAt: c.updated_at,
                })),
                involvedConcerns: involved.map((c) => ({
                    id: c.id,
                    title: c.title,
                    category: c.category,
                    status: c.status,
                    createdAt: c.created_at,
                    updatedAt: c.updated_at,
                    reportedBy: `${c.reporter_first} ${c.reporter_last}`,
                })),
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getStudentProfile error:", error);
        return res.status(500).json({ message: "Unable to fetch student profile." });
    }
};
