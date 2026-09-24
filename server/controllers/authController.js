import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";
import { sendPasswordResetEmail, isPasswordResetMailConfigured } from "../services/mailService.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";
const PASSWORD_RESET_MINUTES = parseInt(process.env.PASSWORD_RESET_MINUTES || "60", 10);
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || "http://localhost:3000").replace(
    /\/$/,
    ""
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NAME_PATTERN = /^(?=.{1,100}$)\p{L}+(?:['’-]\p{L}+)*(?:\.(?=\s|$))?(?: \p{L}+(?:['’-]\p{L}+)*(?:\.(?=\s|$))?)*$/u;
const GMAIL_PATTERN = /^(?=.{1,64}@)(?![^@]*\.\.)[a-z0-9](?:[a-z0-9.]{0,62}[a-z0-9])?(?:\+[a-z0-9._-]+)?@gmail\.com$/i;
const SECTION_PATTERN = /^(?=.{1,50}$)\p{L}+(?:[ .'-]\p{L}+)*$/u;

const formatProperName = (value) => String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase()
    .replace(/(^|[\s'’-])(\p{L})/gu, (_, separator, letter) => `${separator}${letter.toLocaleUpperCase()}`);

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

const normalizeAccountStatus = (status) => {
    if (!status) return "active";
    if (status === "approved") return "active";
    return status;
};

const buildUploadUrl = (req, storedName) => {
    if (!storedName) return null;
    return `${req.protocol}://${req.get("host")}/uploads/${storedName}`;
};

const mapUser = (req, user) => ({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    lrn: user.lrn,
    role: user.role,
    email: user.email || null,
    parentName: user.parent_name || null,
    parentEmail: user.parent_email || null,
    parentContact: user.parent_contact || null,
    gradeLevel: user.grade_level || null,
    section: user.section || null,
    lastValidatedSchoolYear: user.last_validated_school_year_id
        ? {
            id: user.last_validated_school_year_id,
            label: user.last_validated_school_year_label,
        }
        : null,
    accountStatus: normalizeAccountStatus(user.account_status),
    profilePhotoUrl: buildUploadUrl(req, user.profile_photo_stored_name),
});

const applyEnrollmentHistoryFallback = async (conn, user) => {
    if (!user || user.role !== "student") return user;

    const hasProfileEnrollment = user.grade_level && user.section && user.last_validated_school_year_label;
    if (hasProfileEnrollment) return user;

    const [historyRows] = await conn.query(
        `SELECT school_year_id,
                school_year_label,
                grade_level,
                section
         FROM enrollment_validation_history
         WHERE student_id = ?
         ORDER BY validated_at DESC, id DESC
         LIMIT 1`,
        [user.id]
    );

    if (!historyRows.length) return user;

    const latest = historyRows[0];
    return {
        ...user,
        grade_level: user.grade_level || latest.grade_level,
        section: user.section || latest.section,
        last_validated_school_year_id: user.last_validated_school_year_id || latest.school_year_id,
        last_validated_school_year_label: user.last_validated_school_year_label || latest.school_year_label,
    };
};

const parseGradeAndSection = (value) => {
    const match = String(value || "").trim().match(/^Grade\s+(7|8|9|10)\s+-\s+(.+)$/i);
    if (!match) return null;

    const section = formatProperName(match[2]);
    if (!SECTION_PATTERN.test(section)) return null;

    return { gradeLevel: match[1], section };
};

const getExpectedNextGrade = (gradeLevel) => {
    const gradeMatch = String(gradeLevel || "").match(/\d{1,2}/);
    const grade = gradeMatch ? Number.parseInt(gradeMatch[0], 10) : NaN;
    if (!Number.isInteger(grade)) return null;
    if (grade >= 7 && grade < 10) return String(grade + 1);
    return null;
};

const formatGradeSection = (gradeLevel, section) => {
    const gradeMatch = String(gradeLevel || "").match(/\d{1,2}/);
    const grade = gradeMatch ? gradeMatch[0] : gradeLevel;
    if (grade && section) return `Grade ${grade} - ${section}`;
    if (grade) return `Grade ${grade}`;
    return section || "N/A";
};

const getLatestEnrollment = async (conn, studentId) => {
    const [historyRows] = await conn.query(
        `SELECT grade_level, section
         FROM enrollment_validation_history
         WHERE student_id = ?
         ORDER BY validated_at DESC, id DESC
         LIMIT 1`,
        [studentId]
    );

    if (historyRows.length) {
        return historyRows[0];
    }

    const [recordRows] = await conn.query(
        `SELECT sr.grade_level, sr.section
         FROM users u
         LEFT JOIN student_records sr ON u.lrn = sr.lrn
         WHERE u.id = ? AND u.role = 'student'
         LIMIT 1`,
        [studentId]
    );

    return recordRows[0] || null;
};

const upsertStudentRecord = async (conn, { lrn, firstName, lastName, gradeLevel, section }) => {
    const [records] = await conn.query(
        "SELECT id FROM student_records WHERE lrn = ? LIMIT 1",
        [lrn]
    );

    if (records.length) {
        await conn.query(
            `UPDATE student_records
             SET first_name = ?,
                 last_name = ?,
                 grade_level = ?,
                 section = ?
             WHERE lrn = ?`,
            [firstName, lastName, gradeLevel, section, lrn]
        );
        return;
    }

    await conn.query(
        `INSERT INTO student_records (lrn, first_name, last_name, grade_level, section)
         VALUES (?, ?, ?, ?, ?)`,
        [lrn, firstName, lastName, gradeLevel, section]
    );
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

const saveProfilePhoto = (file) => {
    if (!file) return null;

    if (!file.mimetype?.startsWith("image/")) {
        return { error: "Please upload an image file." };
    }

    const uploadDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const extension = file.originalname.includes(".")
        ? `.${file.originalname.split(".").pop()}`
        : "";
    const storedName = `profile_${Date.now()}_${Math.random().toString(36).slice(2)}${extension}`;
    const filePath = path.join(uploadDir, storedName);
    fs.writeFileSync(filePath, file.buffer);

    return {
        originalName: file.originalname,
        storedName,
        mimeType: file.mimetype,
        size: file.size,
    };
};

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
            email: emailFallback,
            parentName,
            parentEmail,
            parentContact,
            gradeLevel,
        } = req.body;

        const allowedRoles = ["student"];
        const email = String(studentEmail || emailFallback || "").trim().toLowerCase();

        if (!firstName || !lastName || !username || !password || !email) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        if (!parentName || !parentEmail || !parentContact) {
            return res.status(400).json({ message: "Parent/guardian name, email, and contact number are required." });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role selected." });
        }

        const lrn = String(studentId || req.body.lrn || "").trim();
        const normalizedFirstName = formatProperName(firstName);
        const normalizedLastName = formatProperName(lastName);
        const normalizedParentName = formatProperName(parentName);

        if (!NAME_PATTERN.test(normalizedFirstName) || !NAME_PATTERN.test(normalizedLastName)) {
            return res.status(400).json({ message: "Names may contain letters, spaces, hyphens, periods, and apostrophes only." });
        }

        if (!NAME_PATTERN.test(normalizedParentName)) {
            return res.status(400).json({ message: "Parent/guardian name contains invalid characters." });
        }

        if (!GMAIL_PATTERN.test(email)) {
            return res.status(400).json({ message: "Student email must be a valid @gmail.com address." });
        }

        const normalizedParentEmail = String(parentEmail).trim().toLowerCase();
        if (!GMAIL_PATTERN.test(normalizedParentEmail)) {
            return res.status(400).json({ message: "Parent/guardian email must be a valid @gmail.com address." });
        }

        const normalizedParentContact = String(parentContact).trim();
        if (!/^09\d{9}$/.test(normalizedParentContact)) {
            return res.status(400).json({ message: "Parent contact must be 11 digits and start with 09." });
        }

        if (role === "student") {
            if (!lrn) {
                return res.status(400).json({ message: "LRN is required for students." });
            }
            const lrnPattern = /^109323\d{6}$/;
            if (!lrnPattern.test(lrn)) {
                return res.status(400).json({
                    message: "LRN must be 12 digits and start with 109323.",
                });
            }
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters." });
        }

        const enrollment = parseGradeAndSection(gradeLevel);
        if (!enrollment) {
            return res.status(400).json({ message: "Grade and section are required. Use a format like Grade 10 - Rizal." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Proof of enrollment (School ID) is required." });
        }

        const proofFile = saveSchoolIdProof(req.file);
        if (!proofFile) {
            return res.status(500).json({ message: "Unable to store uploaded document." });
        }

        const conn = await pool.getConnection();
        try {
            try {
                await conn.query("ALTER TABLE users ADD COLUMN email VARCHAR(150)");
            } catch (err) {
                if (err.code !== "ER_DUP_FIELDNAME") {
                    console.warn("Could not add email column:", err.message);
                }
            }

            const [existingUsers] = await conn.query(
                "SELECT id, account_status FROM users WHERE username = ? OR lrn = ? OR email = ? LIMIT 1",
                [username, lrn, email]
            );

            const passwordHash = await bcrypt.hash(password, 10);
            if (existingUsers.length) {
                const existing = existingUsers[0];
                if (existing.account_status === "pending_revalidation") {
                    return res.status(409).json({
                        message: "This student account is already marked for enrollment revalidation. Please log in and submit the revalidation form instead of creating a new registration.",
                    });
                }
                if (existing.account_status === "rejected") {
                    return res.status(409).json({
                        message: "This student registration was rejected. Please contact the guidance office before submitting another registration.",
                    });
                }

                return res.status(400).json({ message: "Username, LRN, or email already exists." });
            }

            await conn.query(
                `INSERT INTO users (
                     first_name,
                     last_name,
                     username,
                     password_hash,
                     role,
                     lrn,
                     email,
                     parent_name,
                     parent_email,
                     parent_contact,
                     account_status,
                     school_id_proof_original_name,
                     school_id_proof_stored_name,
                     school_id_proof_mime,
                     school_id_proof_size
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?, ?, ?)`,
                [
                    normalizedFirstName,
                    normalizedLastName,
                    username,
                    passwordHash,
                    role,
                    lrn || null,
                    email,
                    normalizedParentName,
                    normalizedParentEmail,
                    normalizedParentContact,
                    proofFile.originalName,
                    proofFile.storedName,
                    proofFile.mimeType,
                    proofFile.size,
                ]
            );

            await upsertStudentRecord(conn, {
                lrn,
                firstName: normalizedFirstName,
                lastName: normalizedLastName,
                gradeLevel: enrollment.gradeLevel,
                section: enrollment.section,
            });

            return res.status(201).json({
                message: "Registration submitted and pending approval by the guidance counselor.",
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
                `SELECT u.id, u.first_name, u.last_name, u.username, u.password_hash, u.role, u.lrn,
                        u.email, u.parent_name, u.parent_email, u.parent_contact,
                        u.account_status, u.rejection_reason, u.profile_photo_stored_name,
                        u.last_validated_school_year_id, sy.label AS last_validated_school_year_label,
                        sr.grade_level, sr.section
                 FROM users u
                 LEFT JOIN school_years sy ON u.last_validated_school_year_id = sy.id
                 LEFT JOIN student_records sr ON u.lrn = sr.lrn
                 WHERE u.username = ? OR u.lrn = ?
                 LIMIT 1`,
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

            const normalizedStatus = normalizeAccountStatus(user.account_status);
            if (user.role !== "guidance_counselor") {
                switch (normalizedStatus) {
                    case "active":
                    case "pending_revalidation":
                    case "inactive":
                        break;
                    case "pending_approval":
                        return res.status(403).json({ message: "Your account is pending approval by the guidance counselor." });
                    case "rejected":
                        return res.status(403).json({ message: "Your student registration was rejected. Please contact the guidance office." });
                    case "graduated":
                        return res.status(403).json({ message: "Your student account has been marked as graduated. Please contact the guidance office if you need assistance." });
                    case "transferred":
                        return res.status(403).json({ message: "Transferred student accounts cannot access the system." });
                    case "deleted":
                        return res.status(403).json({ message: "Your student account has been archived by the guidance office. Please contact the guidance office if you need assistance." });
                    default:
                        return res.status(403).json({ message: "Your account is not permitted to access the system." });
                }
            }

            const token = issueToken(user);
            const profileUser = await applyEnrollmentHistoryFallback(conn, user);
            return res.json({
                message: "Login successful.",
                token,
                user: mapUser(req, profileUser),
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
                `SELECT u.id, u.first_name, u.last_name, u.username, u.role, u.lrn,
                        u.email, u.parent_name, u.parent_email, u.parent_contact,
                        u.account_status, u.profile_photo_stored_name,
                        u.last_validated_school_year_id, sy.label AS last_validated_school_year_label,
                        sr.grade_level, sr.section
                 FROM users u
                 LEFT JOIN school_years sy ON u.last_validated_school_year_id = sy.id
                 LEFT JOIN student_records sr ON u.lrn = sr.lrn
                 WHERE u.id = ?
                 LIMIT 1`,
                [req.user.id]
            );

            if (!users.length) {
                return res.status(404).json({ message: "User not found." });
            }

            const profileUser = await applyEnrollmentHistoryFallback(conn, users[0]);
            return res.json({ user: mapUser(req, profileUser) });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getCurrentUser error:", error);
        return res.status(500).json({ message: "Unable to fetch user profile." });
    }
};

export const uploadProfilePhoto = async (req, res) => {
    if (req.user.role !== "student") {
        return res.status(403).json({ message: "Only students can upload a profile photo." });
    }

    if (!req.file) {
        return res.status(400).json({ message: "Please select a profile photo to upload." });
    }

    const photo = saveProfilePhoto(req.file);
    if (photo?.error) {
        return res.status(400).json({ message: photo.error });
    }
    if (!photo) {
        return res.status(500).json({ message: "Unable to store profile photo." });
    }

    try {
        const conn = await pool.getConnection();
        try {
            const [users] = await conn.query(
                "SELECT profile_photo_stored_name FROM users WHERE id = ? AND role = 'student' LIMIT 1",
                [req.user.id]
            );

            if (!users.length) {
                return res.status(404).json({ message: "Student account not found." });
            }

            await conn.query(
                `UPDATE users
                 SET profile_photo_original_name = ?,
                     profile_photo_stored_name = ?,
                     profile_photo_mime = ?,
                     profile_photo_size = ?,
                     updated_at = NOW()
                 WHERE id = ?`,
                [photo.originalName, photo.storedName, photo.mimeType, photo.size, req.user.id]
            );

            const oldStoredName = users[0].profile_photo_stored_name;
            if (oldStoredName && oldStoredName !== photo.storedName) {
                const oldPath = path.join(__dirname, "..", "uploads", oldStoredName);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            const [updated] = await conn.query(
                `SELECT u.id, u.first_name, u.last_name, u.username, u.role, u.lrn,
                        u.email, u.parent_name, u.parent_email, u.parent_contact,
                        u.account_status, u.profile_photo_stored_name,
                        u.last_validated_school_year_id, sy.label AS last_validated_school_year_label,
                        sr.grade_level, sr.section
                 FROM users u
                 LEFT JOIN school_years sy ON u.last_validated_school_year_id = sy.id
                 LEFT JOIN student_records sr ON u.lrn = sr.lrn
                 WHERE u.id = ?
                 LIMIT 1`,
                [req.user.id]
            );

            const profileUser = await applyEnrollmentHistoryFallback(conn, updated[0]);
            return res.json({
                message: "Profile photo updated.",
                user: mapUser(req, profileUser),
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("uploadProfilePhoto error:", error);
        return res.status(500).json({ message: "Unable to upload profile photo." });
    }
};

export const removeProfilePhoto = async (req, res) => {
    if (req.user.role !== "student") {
        return res.status(403).json({ message: "Only students can remove a profile photo." });
    }

    try {
        const conn = await pool.getConnection();
        try {
            const [users] = await conn.query(
                "SELECT profile_photo_stored_name FROM users WHERE id = ? AND role = 'student' LIMIT 1",
                [req.user.id]
            );

            if (!users.length) {
                return res.status(404).json({ message: "Student account not found." });
            }

            await conn.query(
                `UPDATE users
                 SET profile_photo_original_name = NULL,
                     profile_photo_stored_name = NULL,
                     profile_photo_mime = NULL,
                     profile_photo_size = NULL,
                     updated_at = NOW()
                 WHERE id = ?`,
                [req.user.id]
            );

            const oldStoredName = users[0].profile_photo_stored_name;
            if (oldStoredName) {
                const oldPath = path.join(__dirname, "..", "uploads", oldStoredName);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            const [updated] = await conn.query(
                `SELECT u.id, u.first_name, u.last_name, u.username, u.role, u.lrn,
                        u.email, u.parent_name, u.parent_email, u.parent_contact,
                        u.account_status, u.profile_photo_stored_name,
                        u.last_validated_school_year_id, sy.label AS last_validated_school_year_label,
                        sr.grade_level, sr.section
                 FROM users u
                 LEFT JOIN school_years sy ON u.last_validated_school_year_id = sy.id
                 LEFT JOIN student_records sr ON u.lrn = sr.lrn
                 WHERE u.id = ?
                 LIMIT 1`,
                [req.user.id]
            );

            const profileUser = await applyEnrollmentHistoryFallback(conn, updated[0]);
            return res.json({
                message: "Profile photo removed.",
                user: mapUser(req, profileUser),
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("removeProfilePhoto error:", error);
        return res.status(500).json({ message: "Unable to remove profile photo." });
    }
};

export const getPendingRegistrations = async (req, res) => {
    try {
        const status = req.query.status || "pending_approval";
        if (status !== "pending_approval") {
            return res.status(400).json({ message: "Only pending registrations are available from this endpoint." });
        }

        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `SELECT u.id, u.first_name, u.last_name, u.username, u.lrn, u.email, u.parent_name, u.parent_email, u.parent_contact,
                        account_status, rejection_reason, school_id_proof_original_name, school_id_proof_stored_name,
                        u.profile_photo_stored_name, u.created_at, u.updated_at, sr.grade_level, sr.section
                 FROM users u
                 LEFT JOIN student_records sr ON u.lrn = sr.lrn
                 WHERE u.role = 'student' AND u.account_status = ?
                 ORDER BY u.created_at DESC`,
                [status]
            );

            return res.json(
                rows.map((row) => ({
                    id: row.id,
                    firstName: row.first_name,
                    lastName: row.last_name,
                    username: row.username,
                    lrn: row.lrn,
                    email: row.email,
                    parentName: row.parent_name,
                    parentEmail: row.parent_email,
                    parentContact: row.parent_contact,
                    profilePhotoUrl: buildUploadUrl(req, row.profile_photo_stored_name),
                    gradeLevel: row.grade_level,
                    section: row.section,
                    accountStatus: row.account_status,
                    rejectionReason: row.rejection_reason,
                    schoolIdProofName: row.school_id_proof_original_name,
                    schoolIdProofUrl: row.school_id_proof_stored_name
                        ? `${req.protocol}://${req.get("host")}/uploads/${row.school_id_proof_stored_name}`
                        : null,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                }))
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getPendingRegistrations error:", error);
        return res.status(500).json({ message: "Unable to fetch pending registrations." });
    }
};

export const getStudentAccounts = async (req, res) => {
    try {
        const status = req.query.status || null;
        const conn = await pool.getConnection();
        try {
            let query = `SELECT id, first_name, last_name, username, lrn, email, parent_name, parent_email, parent_contact, account_status, rejection_reason, profile_photo_stored_name, created_at, updated_at FROM users WHERE role = 'student'`;
            const params = [];
            if (status && status !== 'all') {
                query += ' AND account_status = ?';
                params.push(status);
            } else {
                query += " AND account_status NOT IN ('deleted', 'pending_approval', 'rejected')";
            }
            query += ' ORDER BY created_at DESC';

            const [rows] = await conn.query(query, params);
            return res.json(
                rows.map((row) => ({
                    id: row.id,
                    firstName: row.first_name,
                    lastName: row.last_name,
                    username: row.username,
                    lrn: row.lrn,
                    email: row.email,
                    parentName: row.parent_name,
                    parentEmail: row.parent_email,
                    parentContact: row.parent_contact,
                    profilePhotoUrl: buildUploadUrl(req, row.profile_photo_stored_name),
                    accountStatus: row.account_status,
                    rejectionReason: row.rejection_reason,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                }))
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getStudentAccounts error:", error);
        return res.status(500).json({ message: "Unable to fetch student accounts." });
    }
};

export const updateStudentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        const validStatuses = ['active', 'inactive', 'graduated', 'transferred', 'pending_revalidation', 'rejected', 'deleted'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid account status.' });
        }

        const archiveReason = reason?.trim() || null;
        if (status === 'deleted' && !archiveReason) {
            return res.status(400).json({ message: 'Archive reason is required.' });
        }

        const conn = await pool.getConnection();
        try {
            const [users] = await conn.query("SELECT id, account_status FROM users WHERE id = ? AND role = 'student' LIMIT 1", [id]);
            if (!users.length) {
                return res.status(404).json({ message: 'Student account not found.' });
            }

            if (users[0].account_status === 'deleted' && status !== 'inactive') {
                return res.status(400).json({ message: 'Archived accounts can only be restored to inactive.' });
            }

            await conn.query(
                `UPDATE users
                 SET account_status = ?,
                     rejection_reason = CASE
                         WHEN ? = 'active' THEN NULL
                         WHEN ? = 'inactive' AND account_status = 'deleted' THEN NULL
                         WHEN ? = 'deleted' THEN ?
                         ELSE rejection_reason
                     END,
                     updated_at = NOW()
                 WHERE id = ?`,
                [status, status, status, status, archiveReason, id]
            );

            const statusMessage = status === 'deleted'
                ? `Your account has been archived by the guidance office. Reason: ${archiveReason}`
                : users[0].account_status === 'deleted' && status === 'inactive'
                ? "Your archived student account has been restored to inactive. Please contact the guidance office for the next steps."
                : `Your account status was updated to ${status.replace('_', ' ')}.`;

            await conn.query(
                `INSERT INTO notifications (user_id, message, type)
                 VALUES (?, ?, 'info')`,
                [id, statusMessage]
            );

            return res.json({
                message: status === 'deleted'
                    ? 'Account archived.'
                    : users[0].account_status === 'deleted' && status === 'inactive'
                    ? 'Archived account restored to inactive.'
                    : 'Account status updated.',
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("updateStudentStatus error:", error);
        return res.status(500).json({ message: 'Unable to update student status.' });
    }
};

export const approveRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            try {
                const [users] = await conn.query(
                    `SELECT id,
                            lrn,
                            account_status,
                            school_id_proof_original_name,
                            school_id_proof_stored_name,
                            school_id_proof_mime,
                            school_id_proof_size
                     FROM users
                     WHERE id = ? AND role = 'student'
                     LIMIT 1
                     FOR UPDATE`,
                    [id]
                );
                if (!users.length) {
                    await conn.rollback();
                    return res.status(404).json({ message: "Student registration not found." });
                }

                const student = users[0];
                if (student.account_status !== "pending_approval") {
                    await conn.rollback();
                    return res.status(400).json({ message: "Only pending registrations can be approved." });
                }

                if (!student.lrn) {
                    await conn.rollback();
                    return res.status(400).json({ message: "Student LRN is required to approve registration." });
                }

                if (
                    !student.school_id_proof_original_name ||
                    !student.school_id_proof_stored_name ||
                    !student.school_id_proof_mime ||
                    !student.school_id_proof_size
                ) {
                    await conn.rollback();
                    return res.status(400).json({ message: "Stored school ID proof is required before approval." });
                }

                const [records] = await conn.query(
                    "SELECT grade_level, section FROM student_records WHERE lrn = ? LIMIT 1",
                    [student.lrn]
                );

                if (!records.length || !records[0].grade_level || !records[0].section) {
                    await conn.rollback();
                    return res.status(400).json({ message: "Student record with grade level and section is required before approval." });
                }

                const [activeYears] = await conn.query(
                    "SELECT id, label FROM school_years WHERE status = 'active' LIMIT 1"
                );

                if (!activeYears.length) {
                    await conn.rollback();
                    return res.status(400).json({ message: "An active school year is required before approving registrations." });
                }

                const activeSchoolYear = activeYears[0];

                await conn.query(
                    `UPDATE users
                     SET account_status = 'active',
                         last_validated_school_year_id = ?,
                         rejection_reason = NULL,
                         approved_at = NOW(),
                         rejected_at = NULL,
                         updated_at = NOW()
                     WHERE id = ?`,
                    [activeSchoolYear.id, id]
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
                        id,
                        activeSchoolYear.id,
                        activeSchoolYear.label,
                        records[0].grade_level,
                        records[0].section,
                        student.school_id_proof_original_name,
                        student.school_id_proof_stored_name,
                        student.school_id_proof_mime,
                        student.school_id_proof_size,
                        req.user.id,
                    ]
                );

                await conn.query(
                    `INSERT INTO notifications (user_id, message, type)
                     VALUES (?, ?, 'info')`,
                    [id, `Your student account has been approved for ${activeSchoolYear.label}. You may now log in.`]
                );

                await conn.commit();

                return res.json({
                    message: "Registration approved.",
                    schoolYear: {
                        id: activeSchoolYear.id,
                        label: activeSchoolYear.label,
                    },
                });
            } catch (error) {
                await conn.rollback();
                throw error;
            }
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("approveRegistration error:", error);
        return res.status(500).json({ message: "Unable to approve registration." });
    }
};

export const rejectRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const conn = await pool.getConnection();
        try {
            const [users] = await conn.query("SELECT id, account_status FROM users WHERE id = ? AND role = 'student' LIMIT 1", [id]);
            if (!users.length) {
                return res.status(404).json({ message: "Student registration not found." });
            }
            if (users[0].account_status !== "pending_approval") {
                return res.status(400).json({ message: "Only pending registrations can be rejected." });
            }

            await conn.query(
                `UPDATE users
                 SET account_status = 'rejected',
                     rejection_reason = ?,
                     rejected_at = NOW(),
                     approved_at = NULL,
                     updated_at = NOW()
                 WHERE id = ?`,
                [reason || null, id]
            );

            await conn.query(
                `INSERT INTO notifications (user_id, message, type)
                 VALUES (?, ?, 'info')`,
                [id, `Your student registration was rejected.${reason ? ` Reason: ${reason}` : ""}`]
            );

            return res.json({ message: "Registration rejected." });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("rejectRegistration error:", error);
        return res.status(500).json({ message: "Unable to reject registration." });
    }
};

export const allowResubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const conn = await pool.getConnection();
        try {
            const [users] = await conn.query("SELECT id, account_status FROM users WHERE id = ? AND role = 'student' LIMIT 1", [id]);
            if (!users.length) {
                return res.status(404).json({ message: "Student registration not found." });
            }

            const user = users[0];
            if (user.account_status !== "pending_revalidation") {
                return res.status(400).json({ message: "Only pending revalidation registrations can be reset for resubmission." });
            }

            await conn.query(
                `UPDATE users
                 SET account_status = 'pending_revalidation',
                     rejection_reason = NULL,
                     rejected_at = NULL,
                     updated_at = NOW()
                 WHERE id = ?`,
                [id]
            );

            await conn.query(
                `INSERT INTO notifications (user_id, message, type)
                 VALUES (?, ?, 'info')`,
                [id, "Your account has been reset for revalidation. Please update your enrollment information."]
            );

            return res.json({ message: "Registration reset for resubmission." });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("allowResubmission error:", error);
        return res.status(500).json({ message: "Unable to reset registration." });
    }
};

export const revalidateRegistration = async (req, res) => {
    try {
        const userId = req.user.id;
        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Only students can revalidate their registration." });
        }

        const gradeLevel = req.body?.gradeLevel?.trim();
        const section = req.body?.section?.trim();

        if (!gradeLevel || !section) {
            return res.status(400).json({ message: "Grade level and section are required." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Please upload your updated school ID or enrollment proof." });
        }

        const proofFile = saveSchoolIdProof(req.file);
        if (!proofFile) {
            return res.status(500).json({ message: "Unable to store uploaded document." });
        }

        const conn = await pool.getConnection();
        try {
            const [users] = await conn.query(
                "SELECT id, account_status FROM users WHERE id = ? AND role = 'student' LIMIT 1",
                [userId]
            );
            if (!users.length) {
                return res.status(404).json({ message: "Student account not found." });
            }

            const currentStatus = normalizeAccountStatus(users[0].account_status);
            if (currentStatus !== "pending_revalidation") {
                return res.status(400).json({ message: "Your account is not in a revalidation state." });
            }

            const [activeYears] = await conn.query(
                "SELECT id, label FROM school_years WHERE status = 'active' LIMIT 1"
            );

            if (!activeYears.length) {
                return res.status(400).json({ message: "No active school year is available for revalidation." });
            }

            const activeSchoolYear = activeYears[0];
            const previousEnrollment = await getLatestEnrollment(conn, userId);
            const expectedNextGrade = getExpectedNextGrade(previousEnrollment?.grade_level);

            if (!expectedNextGrade) {
                return res.status(400).json({
                    message: "Your next grade level cannot be determined automatically. Please contact the guidance office before submitting.",
                });
            }

            if (gradeLevel !== expectedNextGrade) {
                return res.status(400).json({
                    message: `Based on your last approved enrollment (${formatGradeSection(previousEnrollment?.grade_level, previousEnrollment?.section)}), your updated grade level should be Grade ${expectedNextGrade}. Please correct your grade level or contact the guidance office.`,
                });
            }

            const [existingPending] = await conn.query(
                `SELECT id FROM revalidation_requests
                 WHERE user_id = ?
                   AND status = 'pending_review'
                 LIMIT 1`,
                [userId]
            );

            if (existingPending.length) {
                return res.status(409).json({ message: "You already have a pending revalidation request." });
            }

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
                    userId,
                    activeSchoolYear.id,
                    gradeLevel,
                    section,
                    proofFile.originalName,
                    proofFile.storedName,
                    proofFile.mimeType,
                    proofFile.size,
                ]
            );

            await conn.query(
                `UPDATE users
                 SET rejection_reason = NULL,
                     rejected_at = NULL,
                     updated_at = NOW()
                 WHERE id = ?`,
                [userId]
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
                },
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("revalidateRegistration error:", error);
        return res.status(500).json({ message: "Unable to submit revalidation documents." });
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
