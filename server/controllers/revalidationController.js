import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildProofUrl = (req, storedName) => {
    if (!storedName) return null;
    return `${req.protocol}://${req.get("host")}/uploads/${storedName}`;
};

const getExpectedNextGrade = (gradeLevel) => {
    const gradeMatch = String(gradeLevel || "").match(/\d{1,2}/);
    const grade = gradeMatch ? Number.parseInt(gradeMatch[0], 10) : NaN;
    if (!Number.isInteger(grade)) return null;
    if (grade >= 7 && grade < 10) return String(grade + 1);
    return null;
};

const getGradeNumber = (gradeLevel) => {
    const gradeMatch = String(gradeLevel || "").match(/\d{1,2}/);
    return gradeMatch ? Number.parseInt(gradeMatch[0], 10) : null;
};

const formatGradeSection = (gradeLevel, section) => {
    const gradeMatch = String(gradeLevel || "").match(/\d{1,2}/);
    const grade = gradeMatch ? gradeMatch[0] : gradeLevel;
    if (grade && section) return `Grade ${grade} - ${section}`;
    if (grade) return `Grade ${grade}`;
    return section || "N/A";
};

const getSchoolYearStart = (label) => {
    const match = String(label || "").match(/^(\d{4})-(\d{4})$/);
    return match ? Number.parseInt(match[1], 10) : null;
};

const getMissedCycleCount = (previousLabel, activeLabel) => {
    const previousStart = getSchoolYearStart(previousLabel);
    const activeStart = getSchoolYearStart(activeLabel);
    if (!Number.isInteger(previousStart) || !Number.isInteger(activeStart)) return 1;
    return Math.max(1, activeStart - previousStart);
};

const derivePreviousSchoolYearLabel = (activeLabel) => {
    const match = String(activeLabel || "").match(/^(\d{4})-(\d{4})$/);
    if (!match) return null;

    const startYear = Number.parseInt(match[1], 10);
    const endYear = Number.parseInt(match[2], 10);
    if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) return null;

    return `${startYear - 1}-${endYear - 1}`;
};

const getPreviousSchoolYearFallback = async (conn, activeSchoolYear) => {
    const previousLabel = derivePreviousSchoolYearLabel(activeSchoolYear?.label);

    if (previousLabel) {
        const [matchingYears] = await conn.query(
            `SELECT id, label
             FROM school_years
             WHERE label = ?
             LIMIT 1`,
            [previousLabel]
        );

        if (matchingYears.length) {
            return matchingYears[0];
        }

        return { id: null, label: previousLabel };
    }

    const [fallbackYears] = await conn.query(
        `SELECT id, label
         FROM school_years
         WHERE status <> 'active'
         ORDER BY label DESC, created_at DESC, id DESC
         LIMIT 1`
    );

    return fallbackYears[0] || null;
};

const getLatestEnrollment = async (conn, studentId, activeSchoolYear = null) => {
    const [historyRows] = await conn.query(
        `SELECT evh.school_year_id,
                evh.school_year_label,
                evh.grade_level,
                evh.section,
                evh.validated_at
         FROM enrollment_validation_history evh
         WHERE evh.student_id = ?
         ORDER BY evh.validated_at DESC, evh.id DESC
         LIMIT 1`,
        [studentId]
    );

    if (historyRows.length) {
        const history = historyRows[0];
        if (history.school_year_id && history.school_year_label) {
            return history;
        }

        const fallbackYear = await getPreviousSchoolYearFallback(conn, activeSchoolYear);

        return {
            ...history,
            school_year_id: history.school_year_id || fallbackYear?.id || null,
            school_year_label: history.school_year_label || fallbackYear?.label || null,
        };
    }

    const [recordRows] = await conn.query(
        `SELECT sr.grade_level,
                sr.section,
                sy.id AS school_year_id,
                sy.label AS school_year_label
         FROM users u
         LEFT JOIN student_records sr ON u.lrn = sr.lrn
         LEFT JOIN school_years sy ON u.last_validated_school_year_id = sy.id
         WHERE u.id = ? AND u.role = 'student'
         LIMIT 1`,
        [studentId]
    );

    if (!recordRows.length) {
        return null;
    }

    const record = recordRows[0];
    if (record.school_year_id && record.school_year_label) {
        return record;
    }

    const fallbackYear = await getPreviousSchoolYearFallback(conn, activeSchoolYear);

    return {
        ...record,
        school_year_id: record.school_year_id || fallbackYear?.id || null,
        school_year_label: record.school_year_label || fallbackYear?.label || null,
    };
};

export const getRevalidationSummary = async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const [users] = await conn.query(
                `SELECT id, account_status, revalidation_submission_unlocked
                 FROM users
                 WHERE id = ? AND role = 'student'
                 LIMIT 1`,
                [req.user.id]
            );

            if (!users.length) {
                return res.status(404).json({ message: "Student account not found." });
            }

            if (users[0].account_status !== "pending_revalidation") {
                return res.status(400).json({ message: "Your account is not in a revalidation state." });
            }

            const [activeYears] = await conn.query(
                "SELECT id, label FROM school_years WHERE status = 'active' LIMIT 1"
            );
            const activeSchoolYear = activeYears[0] || null;
            const previousEnrollment = await getLatestEnrollment(conn, req.user.id, activeSchoolYear);
            const expectedNextGrade = getExpectedNextGrade(previousEnrollment?.grade_level);
            const manualGuidanceReview = Boolean(users[0].revalidation_submission_unlocked && !expectedNextGrade);
            const previousSchoolYearLabel = previousEnrollment?.school_year_label || null;
            const missedCycleCount = getMissedCycleCount(previousSchoolYearLabel, activeSchoolYear?.label);
            const catchUpAllowed = Boolean(manualGuidanceReview || (expectedNextGrade && missedCycleCount >= 2));
            const previousGradeNumber = getGradeNumber(previousEnrollment?.grade_level);
            const maxSelectableGrade = previousGradeNumber ? Math.min(10, previousGradeNumber + missedCycleCount) : null;

            return res.json({
                activeSchoolYear: activeSchoolYear
                    ? { id: activeSchoolYear.id, label: activeSchoolYear.label }
                    : null,
                previousEnrollment: previousEnrollment?.grade_level || previousEnrollment?.section
                    ? {
                        schoolYear: previousEnrollment.school_year_id || previousEnrollment.school_year_label
                            ? {
                                id: previousEnrollment.school_year_id || null,
                                label: previousEnrollment.school_year_label,
                            }
                            : null,
                        gradeLevel: previousEnrollment.grade_level || null,
                        section: previousEnrollment.section || null,
                        label: formatGradeSection(previousEnrollment.grade_level, previousEnrollment.section),
                    }
                    : null,
                expectedNextGrade,
                missedCycleCount,
                catchUpAllowed,
                manualGuidanceReview,
                minSelectableGrade: manualGuidanceReview ? "7" : expectedNextGrade,
                maxSelectableGrade: manualGuidanceReview ? "10" : catchUpAllowed ? maxSelectableGrade : expectedNextGrade,
                canSubmit: Boolean(expectedNextGrade || manualGuidanceReview),
                note: manualGuidanceReview
                    ? "Guidance has enabled manual revalidation for your account. Select your current grade level and section based on your enrollment proof. Guidance will verify the submitted details."
                    : catchUpAllowed
                    ? `You missed ${missedCycleCount} revalidation cycles. Select your current grade level based on your enrollment proof. Guidance will manually verify it.`
                    : expectedNextGrade
                    ? `Based on your last approved enrollment, your updated grade level should be Grade ${expectedNextGrade}.`
                    : "Your next grade level cannot be determined automatically. Please contact the guidance office before submitting.",
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getRevalidationSummary error:", error);
        return res.status(500).json({ message: "Unable to fetch revalidation summary." });
    }
};

const saveSchoolIdProof = (file) => {
    if (!file) return null;

    const uploadDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const extension = file.originalname.includes(".")
        ? `.${file.originalname.split(".").pop()}`
        : "";
    const storedName = `school_id_${Date.now()}_${Math.random().toString(36).slice(2)}${extension}`;
    const filePath = path.join(uploadDir, storedName);
    fs.writeFileSync(filePath, file.buffer);

    return {
        originalName: file.originalname,
        storedName,
        mimeType: file.mimetype,
        size: file.size,
    };
};

export const submitRevalidationRequest = async (req, res) => {
    const gradeLevel = req.body?.gradeLevel?.trim();
    const section = req.body?.section?.trim();

    if (!gradeLevel || !section) {
        return res.status(400).json({ message: "Grade level and section are required." });
    }

    if (!req.file) {
        return res.status(400).json({ message: "Please upload your updated school ID or enrollment proof." });
    }

    try {
        const conn = await pool.getConnection();
        try {
            const [users] = await conn.query(
                `SELECT id, account_status, revalidation_submission_unlocked
                 FROM users
                 WHERE id = ? AND role = 'student'
                 LIMIT 1`,
                [req.user.id]
            );

            if (!users.length) {
                return res.status(404).json({ message: "Student account not found." });
            }

            if (users[0].account_status !== "pending_revalidation") {
                return res.status(400).json({ message: "Your account is not in a revalidation state." });
            }

            const [activeYears] = await conn.query(
                "SELECT id, label FROM school_years WHERE status = 'active' LIMIT 1"
            );

            if (!activeYears.length) {
                return res.status(400).json({ message: "No active school year is available for revalidation." });
            }

            const activeSchoolYear = activeYears[0];
            const schoolYearId = activeSchoolYear.id;
            const previousEnrollment = await getLatestEnrollment(conn, req.user.id, activeSchoolYear);
            const expectedNextGrade = getExpectedNextGrade(previousEnrollment?.grade_level);
            const manualGuidanceReview = Boolean(users[0].revalidation_submission_unlocked && !expectedNextGrade);
            const missedCycleCount = getMissedCycleCount(previousEnrollment?.school_year_label, activeSchoolYear.label);
            const catchUpAllowed = Boolean(manualGuidanceReview || (expectedNextGrade && missedCycleCount >= 2));
            const submittedGrade = getGradeNumber(gradeLevel);
            const minGrade = manualGuidanceReview ? 7 : getGradeNumber(expectedNextGrade);
            const previousGrade = getGradeNumber(previousEnrollment?.grade_level);
            const maxGrade = manualGuidanceReview
                ? 10
                : catchUpAllowed && previousGrade
                ? Math.min(10, previousGrade + missedCycleCount)
                : minGrade;

            if (!expectedNextGrade && !manualGuidanceReview) {
                return res.status(400).json({
                    message: "Your next grade level cannot be determined automatically. Please contact the guidance office before submitting.",
                });
            }

            if (!manualGuidanceReview && !catchUpAllowed && String(submittedGrade) !== expectedNextGrade) {
                return res.status(400).json({
                    message: `Based on your last approved enrollment (${formatGradeSection(previousEnrollment?.grade_level, previousEnrollment?.section)}), your updated grade level should be Grade ${expectedNextGrade}. Please correct your grade level or contact the guidance office.`,
                });
            }

            if (
                catchUpAllowed &&
                (!submittedGrade || submittedGrade < minGrade || submittedGrade > maxGrade)
            ) {
                return res.status(400).json({
                    message: `For catch-up revalidation, choose a grade from Grade ${minGrade} to Grade ${maxGrade} based on your enrollment proof.`,
                });
            }

            const [existingPending] = await conn.query(
                `SELECT id FROM revalidation_requests
                 WHERE user_id = ?
                   AND status = 'pending_review'
                 LIMIT 1`,
                [req.user.id]
            );

            if (existingPending.length) {
                return res.status(409).json({ message: "You already have a pending revalidation request." });
            }

            const proofFile = saveSchoolIdProof(req.file);
            if (!proofFile) {
                return res.status(500).json({ message: "Unable to store uploaded document." });
            }

            await conn.query(
                `UPDATE users
                 SET rejection_reason = NULL,
                     rejected_at = NULL,
                     updated_at = NOW()
                 WHERE id = ?`,
                [req.user.id]
            );

            const [result] = await conn.query(
                `INSERT INTO revalidation_requests (
                     user_id,
                     school_year_id,
                     grade_level,
                     section,
                     school_id_proof_original_name,
                     school_id_proof_stored_name,
                     school_id_proof_mime,
                     school_id_proof_size,
                     status,
                     submitted_at,
                     created_at,
                     updated_at
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', NOW(), NOW(), NOW())`,
                [
                    req.user.id,
                    schoolYearId,
                    gradeLevel,
                    section,
                    proofFile.originalName,
                    proofFile.storedName,
                    proofFile.mimeType,
                    proofFile.size,
                ]
            );

            return res.status(201).json({
                message: "Your revalidation request was submitted for guidance counselor review.",
                request: {
                    id: result.insertId,
                    schoolYear: {
                        id: activeSchoolYear.id,
                        label: activeSchoolYear.label,
                    },
                    gradeLevel,
                    section,
                    reviewType: manualGuidanceReview ? "guidance_manual" : catchUpAllowed && submittedGrade > minGrade ? "catch_up" : "standard",
                },
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("submitRevalidationRequest error:", error);
        return res.status(500).json({ message: "Unable to submit revalidation request." });
    }
};

const mapRequestRow = (req, row) => ({
    id: row.request_id,
    submittedAt: row.submitted_at,
    schoolYear: row.school_year_id
        ? { id: row.school_year_id, label: row.school_year_label }
        : null,
    student: {
        id: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
        lrn: row.lrn,
        email: row.email,
    },
    previousGradeLevel: row.previous_grade_level || null,
    previousSection: row.previous_section || null,
    newGradeLevel: row.grade_level,
    newSection: row.section,
    expectedNextGrade: getExpectedNextGrade(row.previous_grade_level),
    reviewType: (() => {
        const expectedGrade = getGradeNumber(getExpectedNextGrade(row.previous_grade_level));
        const submittedGrade = getGradeNumber(row.grade_level);
        if (!expectedGrade) return "guidance_manual";
        return expectedGrade && submittedGrade > expectedGrade ? "catch_up" : "standard";
    })(),
    schoolIdProofName: row.school_id_proof_original_name,
    schoolIdProofUrl: buildProofUrl(req, row.school_id_proof_stored_name),
});

export const getRevalidationRequests = async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `SELECT rr.id AS request_id,
                        rr.user_id,
                        rr.school_year_id,
                        rr.grade_level,
                        rr.section,
                        rr.school_id_proof_original_name,
                        rr.school_id_proof_stored_name,
                        rr.submitted_at,
                        sy.label AS school_year_label,
                        u.first_name,
                        u.last_name,
                        u.username,
                        u.lrn,
                        u.email,
                        sr.grade_level AS previous_grade_level,
                        sr.section AS previous_section
                 FROM revalidation_requests rr
                 JOIN users u ON rr.user_id = u.id
                 LEFT JOIN school_years sy ON rr.school_year_id = sy.id
                 LEFT JOIN student_records sr ON u.lrn = sr.lrn
                 WHERE rr.status = 'pending_review'
                   AND u.role = 'student'
                   AND u.account_status = 'pending_revalidation'
                 ORDER BY rr.submitted_at DESC`
            );

            return res.json(rows.map((row) => mapRequestRow(req, row)));
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getRevalidationRequests error:", error);
        return res.status(500).json({ message: "Unable to fetch revalidation requests." });
    }
};

export const allowRevalidationSubmission = async (req, res) => {
    const { studentId } = req.params;

    try {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [students] = await conn.query(
                `SELECT u.id,
                        u.lrn,
                        u.first_name,
                        u.last_name,
                        u.account_status,
                        u.last_validated_school_year_id,
                        sr.grade_level,
                        sr.section
                 FROM users u
                 LEFT JOIN student_records sr ON u.lrn = sr.lrn
                 WHERE u.id = ? AND u.role = 'student'
                 LIMIT 1
                 FOR UPDATE`,
                [studentId]
            );

            if (!students.length) {
                await conn.rollback();
                return res.status(404).json({ message: "Student account not found." });
            }

            const student = students[0];
            if (student.account_status !== "pending_revalidation") {
                await conn.rollback();
                return res.status(400).json({ message: "Only students awaiting revalidation can be enabled for submission." });
            }

            if (!student.lrn) {
                await conn.rollback();
                return res.status(400).json({ message: "Student LRN is required before enabling revalidation submission." });
            }

            const [activeYears] = await conn.query(
                "SELECT id, label FROM school_years WHERE status = 'active' LIMIT 1"
            );

            if (!activeYears.length) {
                await conn.rollback();
                return res.status(400).json({ message: "An active school year is required before enabling revalidation submission." });
            }

            const gradeNumber = getGradeNumber(student.grade_level);
            if (gradeNumber >= 10) {
                await conn.rollback();
                return res.status(400).json({
                    message: "This student is already Grade 10 based on the latest record. Mark as graduated instead of enabling revalidation.",
                });
            }

            await conn.query(
                `UPDATE users
                 SET revalidation_submission_unlocked = TRUE,
                     rejection_reason = NULL,
                     rejected_at = NULL,
                     updated_at = NOW()
                 WHERE id = ?`,
                [student.id]
            );

            await conn.query(
                `INSERT INTO notifications (user_id, message, type)
                 VALUES (?, ?, 'info')`,
                [
                    student.id,
                    "Guidance has enabled your enrollment revalidation form. Please update your grade level, section, and enrollment proof, then submit for review.",
                ]
            );

            await conn.commit();

            return res.json({
                message: "Student can now proceed with enrollment revalidation submission.",
            });
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("allowRevalidationSubmission error:", error);
        return res.status(500).json({ message: "Unable to enable revalidation submission." });
    }
};

export const markStudentAsGraduated = async (req, res) => {
    const { studentId } = req.params;

    try {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [students] = await conn.query(
                `SELECT u.id,
                        u.account_status,
                        sr.grade_level
                 FROM users u
                 LEFT JOIN student_records sr ON u.lrn = sr.lrn
                 WHERE u.id = ? AND u.role = 'student'
                 LIMIT 1
                 FOR UPDATE`,
                [studentId]
            );

            if (!students.length) {
                await conn.rollback();
                return res.status(404).json({ message: "Student account not found." });
            }

            const student = students[0];
            if (student.account_status === "deleted") {
                await conn.rollback();
                return res.status(400).json({ message: "Archived accounts cannot be marked as graduated." });
            }

            if (student.account_status === "graduated") {
                await conn.rollback();
                return res.status(400).json({ message: "This student is already marked as graduated." });
            }

            const gradeNumber = getGradeNumber(student.grade_level);
            if (gradeNumber && gradeNumber < 10) {
                await conn.rollback();
                return res.status(400).json({
                    message: "Only Grade 10 students can be marked as graduated from this revalidation action.",
                });
            }

            await conn.query(
                `UPDATE users
                 SET account_status = 'graduated',
                     revalidation_submission_unlocked = FALSE,
                     rejection_reason = NULL,
                     rejected_at = NULL,
                     updated_at = NOW()
                 WHERE id = ?`,
                [student.id]
            );

            await conn.query(
                `UPDATE revalidation_requests
                 SET status = 'rejected',
                     rejection_reason = 'Student marked as graduated by guidance.',
                     updated_at = NOW()
                 WHERE user_id = ? AND status = 'pending_review'`,
                [student.id]
            );

            await conn.query(
                `INSERT INTO notifications (user_id, message, type)
                 VALUES (?, ?, 'info')`,
                [
                    student.id,
                    "Your student account has been marked as graduated by the guidance office.",
                ]
            );

            await conn.commit();

            return res.json({
                message: "Student marked as graduated.",
                studentStatus: "graduated",
            });
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("markStudentAsGraduated error:", error);
        return res.status(500).json({ message: "Unable to mark student as graduated." });
    }
};

export const approveRevalidationRequest = async (req, res) => {
    const { id } = req.params;

    try {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [requests] = await conn.query(
                `SELECT rr.*, u.lrn, u.first_name, u.last_name, u.account_status
                 FROM revalidation_requests rr
                 JOIN users u ON rr.user_id = u.id
                 WHERE rr.id = ? AND rr.status = 'pending_review'
                 LIMIT 1
                 FOR UPDATE`,
                [id]
            );

            if (!requests.length) {
                await conn.rollback();
                return res.status(404).json({ message: "Pending revalidation request not found." });
            }

            const request = requests[0];
            if (request.account_status !== "pending_revalidation") {
                await conn.rollback();
                return res.status(400).json({ message: "Student is not awaiting revalidation approval." });
            }

            let schoolYearId = request.school_year_id;
            if (!schoolYearId) {
                const [activeYears] = await conn.query(
                    "SELECT id FROM school_years WHERE status = 'active' LIMIT 1"
                );
                schoolYearId = activeYears[0]?.id || null;
            }

            if (!schoolYearId) {
                await conn.rollback();
                return res.status(400).json({ message: "Revalidation request is not linked to a school year." });
            }

            const [schoolYearRows] = await conn.query(
                "SELECT id, label FROM school_years WHERE id = ? LIMIT 1",
                [schoolYearId]
            );

            if (!schoolYearRows.length) {
                await conn.rollback();
                return res.status(400).json({ message: "Linked school year no longer exists." });
            }

            const schoolYearLabel = schoolYearRows[0].label;

            if (!request.lrn) {
                await conn.rollback();
                return res.status(400).json({ message: "Student LRN is required to update enrollment records." });
            }

            if (request.lrn) {
                const [records] = await conn.query(
                    "SELECT id FROM student_records WHERE lrn = ? LIMIT 1",
                    [request.lrn]
                );

                if (records.length) {
                    await conn.query(
                        `UPDATE student_records
                         SET grade_level = ?, section = ?
                         WHERE lrn = ?`,
                        [request.grade_level, request.section, request.lrn]
                    );
                } else {
                    await conn.query(
                        `INSERT INTO student_records (lrn, first_name, last_name, grade_level, section)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            request.lrn,
                            request.first_name,
                            request.last_name,
                            request.grade_level,
                            request.section,
                        ]
                    );
                }
            }

            await conn.query(
                `UPDATE users
                 SET account_status = 'active',
                     last_validated_school_year_id = ?,
                     revalidation_submission_unlocked = FALSE,
                     rejection_reason = NULL,
                     rejected_at = NULL,
                     school_id_proof_original_name = ?,
                     school_id_proof_stored_name = ?,
                     school_id_proof_mime = ?,
                     school_id_proof_size = ?,
                     updated_at = NOW()
                 WHERE id = ?`,
                [
                    schoolYearId,
                    request.school_id_proof_original_name,
                    request.school_id_proof_stored_name,
                    request.school_id_proof_mime,
                    request.school_id_proof_size,
                    request.user_id,
                ]
            );

            await conn.query(
                `UPDATE revalidation_requests
                 SET status = 'approved',
                     rejection_reason = NULL,
                     updated_at = NOW()
                 WHERE id = ?`,
                [id]
            );

            await conn.query(
                `INSERT INTO enrollment_validation_history (
                     student_id,
                     school_year_id,
                     school_year_label,
                     grade_level,
                     section,
                     school_id_proof_original_name,
                     school_id_proof_stored_name,
                     school_id_proof_mime,
                     school_id_proof_size,
                     validated_at,
                     approved_by_id
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [
                    request.user_id,
                    schoolYearId,
                    schoolYearLabel,
                    request.grade_level,
                    request.section,
                    request.school_id_proof_original_name,
                    request.school_id_proof_stored_name,
                    request.school_id_proof_mime,
                    request.school_id_proof_size,
                    req.user.id,
                ]
            );

            await conn.query(
                `INSERT INTO notifications (user_id, message, type)
                 VALUES (?, ?, 'info')`,
                [
                    request.user_id,
                    schoolYearLabel
                        ? `Your enrollment revalidation for ${schoolYearLabel} has been approved. You may now submit concerns.`
                        : "Your enrollment revalidation has been approved. You may now submit concerns.",
                ]
            );

            await conn.commit();

            return res.json({
                message: "Revalidation request approved.",
                schoolYear: {
                    id: schoolYearId,
                    label: schoolYearLabel,
                },
            });
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("approveRevalidationRequest error:", error);
        return res.status(500).json({ message: "Unable to approve revalidation request." });
    }
};

export const rejectRevalidationRequest = async (req, res) => {
    const { id } = req.params;
    const reason = req.body?.reason?.trim() || null;

    try {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [requests] = await conn.query(
                `SELECT rr.id, rr.user_id, u.account_status
                 FROM revalidation_requests rr
                 JOIN users u ON rr.user_id = u.id
                 WHERE rr.id = ? AND rr.status = 'pending_review'
                 LIMIT 1
                 FOR UPDATE`,
                [id]
            );

            if (!requests.length) {
                await conn.rollback();
                return res.status(404).json({ message: "Pending revalidation request not found." });
            }

            const request = requests[0];
            if (request.account_status !== "pending_revalidation") {
                await conn.rollback();
                return res.status(400).json({ message: "Student is not awaiting revalidation approval." });
            }

            await conn.query(
                `UPDATE revalidation_requests
                 SET status = 'rejected',
                     rejection_reason = ?,
                     updated_at = NOW()
                 WHERE id = ?`,
                [reason, id]
            );

            await conn.query(
                `UPDATE users
                 SET account_status = 'pending_revalidation',
                     rejection_reason = ?,
                     rejected_at = NOW(),
                     updated_at = NOW()
                 WHERE id = ?`,
                [reason, request.user_id]
            );

            const message = reason
                ? `Your enrollment revalidation was rejected. Reason: ${reason} You may update your information and resubmit.`
                : "Your enrollment revalidation was rejected. Please update your information and resubmit.";

            await conn.query(
                `INSERT INTO notifications (user_id, message, type)
                 VALUES (?, ?, 'info')`,
                [request.user_id, message]
            );

            await conn.commit();

            return res.json({
                message: "Revalidation request rejected.",
                studentStatus: "pending_revalidation",
                rejectionReason: reason,
            });
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("rejectRevalidationRequest error:", error);
        return res.status(500).json({ message: "Unable to reject revalidation request." });
    }
};
