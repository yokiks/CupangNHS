import pool from "../config/db.js";

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

export const getStudentProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const conn = await pool.getConnection();
        try {
            const [users] = await conn.query(
                `SELECT u.id, u.first_name, u.last_name, u.lrn, u.email,
                        u.parent_name, u.parent_email, u.parent_contact,
                        sr.grade_level, sr.section
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
