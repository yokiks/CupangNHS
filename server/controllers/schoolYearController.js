import pool from "../config/db.js";

const SCHOOL_YEAR_PATTERN = /^\d{4}-\d{4}$/;

const mapSchoolYear = (row) => ({
    id: row.id,
    label: row.label,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const extractGradeNumber = (gradeLevel) => {
    const match = String(gradeLevel || "").match(/\d{1,2}/);
    return match ? Number.parseInt(match[0], 10) : null;
};

const getSchoolYearStart = (label) => {
    const match = String(label || "").match(/^(\d{4})-(\d{4})$/);
    return match ? Number.parseInt(match[1], 10) : null;
};

const getSchoolYearDateRange = (label) => {
    const startYear = getSchoolYearStart(label);
    if (!Number.isInteger(startYear)) return null;

    return {
        start: `${startYear}-06-01 00:00:00`,
        end: `${startYear + 1}-06-01 00:00:00`,
    };
};

const countBy = (rows, key) =>
    rows.reduce((acc, row) => {
        const value = row[key] || "unknown";
        acc[value] = (acc[value] || 0) + Number(row.count || 0);
        return acc;
    }, {});

const triggerRevalidationForSchoolYear = async (conn, schoolYearId, schoolYearLabel) => {
    const [affectedStudents] = await conn.query(
        `SELECT u.id,
                (
                    SELECT evh.grade_level
                    FROM enrollment_validation_history evh
                    WHERE evh.student_id = u.id
                    ORDER BY evh.validated_at DESC, evh.id DESC
                    LIMIT 1
                ) AS history_grade_level,
                sr.grade_level AS record_grade_level
         FROM users u
         LEFT JOIN student_records sr ON u.lrn = sr.lrn
         WHERE u.role = 'student'
           AND u.account_status IN ('active', 'pending_revalidation')
           AND (u.last_validated_school_year_id IS NULL OR u.last_validated_school_year_id != ?)`,
        [schoolYearId]
    );

    if (!affectedStudents.length) {
        return { revalidationCount: 0, graduatedCount: 0 };
    }

    const graduatingStudentIds = affectedStudents
        .filter((student) => extractGradeNumber(student.history_grade_level || student.record_grade_level) === 10)
        .map((student) => student.id);
    const revalidationStudentIds = affectedStudents
        .filter((student) => !graduatingStudentIds.includes(student.id))
        .map((student) => student.id);

    if (revalidationStudentIds.length) {
        await conn.query(
            `UPDATE users
             SET account_status = 'pending_revalidation',
                 updated_at = NOW()
             WHERE id IN (?)`,
            [revalidationStudentIds]
        );

        const message = `A new school year (${schoolYearLabel}) has started. Please complete enrollment revalidation.`;
        const placeholders = revalidationStudentIds.map(() => "(?, ?, 'info')").join(", ");
        const values = revalidationStudentIds.flatMap((studentId) => [studentId, message]);

        await conn.query(
            `INSERT INTO notifications (user_id, message, type) VALUES ${placeholders}`,
            values
        );
    }

    if (graduatingStudentIds.length) {
        await conn.query(
            `UPDATE users
             SET account_status = 'graduated',
                 updated_at = NOW()
             WHERE id IN (?)`,
            [graduatingStudentIds]
        );

        const message = `A new school year (${schoolYearLabel}) has started. Your account has been marked as graduated.`;
        const placeholders = graduatingStudentIds.map(() => "(?, ?, 'info')").join(", ");
        const values = graduatingStudentIds.flatMap((studentId) => [studentId, message]);

        await conn.query(
            `INSERT INTO notifications (user_id, message, type) VALUES ${placeholders}`,
            values
        );
    }

    return {
        revalidationCount: revalidationStudentIds.length,
        graduatedCount: graduatingStudentIds.length,
    };
};

const validateLabel = (label) => {
    if (!label || typeof label !== "string") {
        return "School year label is required.";
    }

    const trimmed = label.trim();
    if (!SCHOOL_YEAR_PATTERN.test(trimmed)) {
        return "School year must be in YYYY-YYYY format (e.g. 2026-2027).";
    }

    const [startYear, endYear] = trimmed.split("-").map(Number);
    if (endYear !== startYear + 1) {
        return "The ending year must be exactly one year after the starting year.";
    }

    return null;
};

export const getSchoolYears = async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `SELECT id, label, status, created_at, updated_at
                 FROM school_years
                 ORDER BY label DESC`
            );
            return res.json(rows.map(mapSchoolYear));
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getSchoolYears error:", error);
        return res.status(500).json({ message: "Unable to fetch school years." });
    }
};

export const getActiveSchoolYear = async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `SELECT id, label, status, created_at, updated_at
                 FROM school_years
                 WHERE status = 'active'
                 LIMIT 1`
            );

            if (!rows.length) {
                return res.json({ schoolYear: null });
            }

            return res.json({ schoolYear: mapSchoolYear(rows[0]) });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getActiveSchoolYear error:", error);
        return res.status(500).json({ message: "Unable to fetch active school year." });
    }
};

export const createSchoolYear = async (req, res) => {
    const validationError = validateLabel(req.body?.label);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    const label = req.body.label.trim();

    try {
        const conn = await pool.getConnection();
        try {
            const [existing] = await conn.query(
                "SELECT id FROM school_years WHERE label = ? LIMIT 1",
                [label]
            );

            if (existing.length) {
                return res.status(409).json({ message: "This school year already exists." });
            }

            const [result] = await conn.query(
                `INSERT INTO school_years (label, status, created_at, updated_at)
                 VALUES (?, 'archived', NOW(), NOW())`,
                [label]
            );

            const [rows] = await conn.query(
                `SELECT id, label, status, created_at, updated_at
                 FROM school_years
                 WHERE id = ?`,
                [result.insertId]
            );

            return res.status(201).json({
                message: "School year created.",
                schoolYear: mapSchoolYear(rows[0]),
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "This school year already exists." });
        }
        console.error("createSchoolYear error:", error);
        return res.status(500).json({ message: "Unable to create school year." });
    }
};

export const activateSchoolYear = async (req, res) => {
    const { id } = req.params;

    try {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [targetRows] = await conn.query(
                "SELECT id, label, status FROM school_years WHERE id = ? FOR UPDATE",
                [id]
            );

            if (!targetRows.length) {
                await conn.rollback();
                return res.status(404).json({ message: "School year not found." });
            }

            const target = targetRows[0];
            if (target.status === "active") {
                await conn.rollback();
                return res.status(400).json({ message: "This school year is already active." });
            }

            const [allYears] = await conn.query("SELECT id, label, status FROM school_years");
            const targetStart = getSchoolYearStart(target.label);
            const maxStart = Math.max(...allYears.map((year) => getSchoolYearStart(year.label)).filter(Number.isInteger));
            const activeYear = allYears.find((year) => year.status === "active");
            const activeStart = getSchoolYearStart(activeYear?.label);

            if (targetStart < maxStart || (Number.isInteger(activeStart) && targetStart <= activeStart)) {
                await conn.rollback();
                return res.status(400).json({
                    message: "Past or archived school years cannot be reactivated. Create and activate the next school year instead.",
                });
            }

            await conn.query(
                `UPDATE school_years
                 SET status = 'archived', updated_at = NOW()
                 WHERE status = 'active'`
            );

            await conn.query(
                `UPDATE school_years
                 SET status = 'active', updated_at = NOW()
                 WHERE id = ?`,
                [id]
            );

            const { revalidationCount, graduatedCount } = await triggerRevalidationForSchoolYear(
                conn,
                target.id,
                target.label
            );

            await conn.commit();

            const [rows] = await conn.query(
                `SELECT id, label, status, created_at, updated_at
                 FROM school_years
                 WHERE id = ?`,
                [id]
            );

            return res.json({
                message: "School year activated.",
                schoolYear: mapSchoolYear(rows[0]),
                revalidationCount,
                graduatedCount,
            });
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("activateSchoolYear error:", error);
        return res.status(500).json({ message: "Unable to activate school year." });
    }
};

export const archiveSchoolYear = async (req, res) => {
    const { id } = req.params;

    try {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                "SELECT id, status FROM school_years WHERE id = ?",
                [id]
            );

            if (!rows.length) {
                return res.status(404).json({ message: "School year not found." });
            }

            if (rows[0].status === "archived") {
                return res.status(400).json({ message: "This school year is already archived." });
            }

            await conn.query(
                `UPDATE school_years
                 SET status = 'archived', updated_at = NOW()
                 WHERE id = ?`,
                [id]
            );

            const [updated] = await conn.query(
                `SELECT id, label, status, created_at, updated_at
                 FROM school_years
                 WHERE id = ?`,
                [id]
            );

            return res.json({
                message: "School year archived.",
                schoolYear: mapSchoolYear(updated[0]),
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("archiveSchoolYear error:", error);
        return res.status(500).json({ message: "Unable to archive school year." });
    }
};

export const getSchoolYearReport = async (req, res) => {
    const { id } = req.params;

    try {
        const conn = await pool.getConnection();
        try {
            const [years] = await conn.query(
                `SELECT id, label, status, created_at, updated_at
                 FROM school_years
                 WHERE id = ?
                 LIMIT 1`,
                [id]
            );

            if (!years.length) {
                return res.status(404).json({ message: "School year not found." });
            }

            const schoolYear = years[0];
            const dateRange = getSchoolYearDateRange(schoolYear.label);

            const [validationSummary] = await conn.query(
                `SELECT COUNT(*) AS total_validations,
                        COUNT(DISTINCT student_id) AS validated_students
                 FROM enrollment_validation_history
                 WHERE school_year_id = ? OR school_year_label = ?`,
                [id, schoolYear.label]
            );

            const [gradeRows] = await conn.query(
                `SELECT grade_level, COUNT(*) AS count
                 FROM enrollment_validation_history
                 WHERE school_year_id = ? OR school_year_label = ?
                 GROUP BY grade_level
                 ORDER BY grade_level`,
                [id, schoolYear.label]
            );

            const [sectionRows] = await conn.query(
                `SELECT grade_level, section, COUNT(*) AS count
                 FROM enrollment_validation_history
                 WHERE school_year_id = ? OR school_year_label = ?
                 GROUP BY grade_level, section
                 ORDER BY grade_level, section`,
                [id, schoolYear.label]
            );

            const [revalidationRows] = await conn.query(
                `SELECT status, COUNT(*) AS count
                 FROM revalidation_requests
                 WHERE school_year_id = ?
                 GROUP BY status`,
                [id]
            );

            const [currentStudentRows] = await conn.query(
                `SELECT account_status, COUNT(*) AS count
                 FROM users
                 WHERE role = 'student'
                   AND last_validated_school_year_id = ?
                 GROUP BY account_status`,
                [id]
            );

            const concernWhere = dateRange
                ? `(c.school_year_id = ? OR (c.school_year_id IS NULL AND c.created_at >= ? AND c.created_at < ?))`
                : `c.school_year_id = ?`;
            const concernParams = dateRange
                ? [id, dateRange.start, dateRange.end]
                : [id];

            const [concernRows] = await conn.query(
                `SELECT c.id,
                        c.title,
                        c.category,
                        c.status,
                        c.created_at,
                        c.school_year_id,
                        u.first_name,
                        u.last_name,
                        u.lrn
                 FROM concerns c
                 JOIN users u ON c.user_id = u.id
                 WHERE ${concernWhere}
                 ORDER BY c.created_at DESC`,
                concernParams
            );

            const [concernStatusRows] = await conn.query(
                `SELECT c.status, COUNT(*) AS count
                 FROM concerns c
                 WHERE ${concernWhere}
                 GROUP BY c.status`,
                concernParams
            );

            const [concernCategoryRows] = await conn.query(
                `SELECT c.category, COUNT(*) AS count
                 FROM concerns c
                 WHERE ${concernWhere}
                 GROUP BY c.category`,
                concernParams
            );

            const [validationRows] = await conn.query(
                `SELECT evh.id,
                        evh.grade_level,
                        evh.section,
                        evh.validated_at,
                        u.first_name,
                        u.last_name,
                        u.lrn,
                        approver.first_name AS approved_by_first_name,
                        approver.last_name AS approved_by_last_name
                 FROM enrollment_validation_history evh
                 JOIN users u ON evh.student_id = u.id
                 LEFT JOIN users approver ON evh.approved_by_id = approver.id
                 WHERE evh.school_year_id = ? OR evh.school_year_label = ?
                 ORDER BY evh.validated_at DESC, evh.id DESC`,
                [id, schoolYear.label]
            );

            return res.json({
                generatedAt: new Date().toISOString(),
                schoolYear: mapSchoolYear(schoolYear),
                dateRange,
                summary: {
                    totalValidations: Number(validationSummary[0]?.total_validations || 0),
                    validatedStudents: Number(validationSummary[0]?.validated_students || 0),
                    currentStudentsByStatus: countBy(currentStudentRows, "account_status"),
                    revalidationsByStatus: countBy(revalidationRows, "status"),
                    concerns: {
                        total: concernRows.length,
                        byStatus: countBy(concernStatusRows, "status"),
                        byCategory: countBy(concernCategoryRows, "category"),
                    },
                },
                gradeBreakdown: gradeRows.map((row) => ({
                    gradeLevel: row.grade_level,
                    count: Number(row.count || 0),
                })),
                sectionBreakdown: sectionRows.map((row) => ({
                    gradeLevel: row.grade_level,
                    section: row.section,
                    count: Number(row.count || 0),
                })),
                validations: validationRows.map((row) => ({
                    id: row.id,
                    studentName: `${row.first_name} ${row.last_name}`,
                    lrn: row.lrn,
                    gradeLevel: row.grade_level,
                    section: row.section,
                    validatedAt: row.validated_at,
                    approvedBy: row.approved_by_first_name
                        ? `${row.approved_by_first_name} ${row.approved_by_last_name}`
                        : "N/A",
                })),
                concerns: concernRows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    category: row.category,
                    status: row.status,
                    createdAt: row.created_at,
                    schoolYearLinked: Boolean(row.school_year_id),
                    studentName: `${row.first_name} ${row.last_name}`,
                    lrn: row.lrn,
                })),
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getSchoolYearReport error:", error);
        return res.status(500).json({ message: "Unable to generate school year report." });
    }
};

export const deleteSchoolYear = async (req, res) => {
    const { id } = req.params;

    try {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [rows] = await conn.query(
                "SELECT id, label, status FROM school_years WHERE id = ? FOR UPDATE",
                [id]
            );

            if (!rows.length) {
                await conn.rollback();
                return res.status(404).json({ message: "School year not found." });
            }

            await conn.query(
                `UPDATE users
                 SET last_validated_school_year_id = NULL,
                     updated_at = NOW()
                 WHERE last_validated_school_year_id = ?`,
                [id]
            );

            await conn.query(
                "UPDATE revalidation_requests SET school_year_id = NULL WHERE school_year_id = ?",
                [id]
            );

            await conn.query(
                "UPDATE enrollment_validation_history SET school_year_id = NULL WHERE school_year_id = ?",
                [id]
            );

            await conn.query("DELETE FROM school_years WHERE id = ?", [id]);
            await conn.commit();

            return res.json({ message: "School year deleted." });
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("deleteSchoolYear error:", error);
        return res.status(500).json({ message: "Unable to delete school year." });
    }
};
