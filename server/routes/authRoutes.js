import express from "express";
import multer from "multer";
import {
    registerUser,
    loginUser,
    getCurrentUser,
    uploadProfilePhoto,
    removeProfilePhoto,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getPendingRegistrations,
    getStudentAccounts,
    updateStudentStatus,
    approveRegistration,
    rejectRegistration,
    allowResubmission,
    revalidateRegistration,
} from "../controllers/authController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const PROOF_FILE_TYPES = new Map([
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".png", "image/png"],
    [".pdf", "application/pdf"],
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (file.fieldname === "schoolIdProof") {
            const extension = file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase();
            if (PROOF_FILE_TYPES.get(extension) !== file.mimetype) {
                return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
            }
        }
        callback(null, true);
    },
});

const uploadSingle = (fieldName) => (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
        if (!error) return next();
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "Uploaded file must not exceed 10 MB." });
        }
        if (error.code === "LIMIT_UNEXPECTED_FILE" && fieldName === "schoolIdProof") {
            return res.status(400).json({ message: "School ID must be a JPG, JPEG, PNG, or PDF file." });
        }
        return next(error);
    });
};

const router = express.Router();

router.post("/register", uploadSingle("schoolIdProof"), registerUser);
router.post("/login", loginUser);
router.get("/me", authenticate, getCurrentUser);
router.patch("/me/profile-photo", authenticate, authorize(["student"]), uploadSingle("profilePhoto"), uploadProfilePhoto);
router.delete("/me/profile-photo", authenticate, authorize(["student"]), removeProfilePhoto);
router.patch("/revalidate", authenticate, authorize(["student"]), uploadSingle("schoolIdProof"), revalidateRegistration);
router.post("/forgot-password", forgotPassword);
router.get("/validate-reset-token", validateResetToken);
router.post("/reset-password", resetPassword);

router.get(
    "/pending-registrations",
    authenticate,
    authorize(["guidance_counselor"]),
    getPendingRegistrations
);
router.get(
    "/students",
    authenticate,
    authorize(["guidance_counselor"]),
    getStudentAccounts
);
router.patch(
    "/students/:id/status",
    authenticate,
    authorize(["guidance_counselor"]),
    updateStudentStatus
);
router.patch(
    "/registrations/:id/approve",
    authenticate,
    authorize(["guidance_counselor"]),
    approveRegistration
);
router.patch(
    "/registrations/:id/reject",
    authenticate,
    authorize(["guidance_counselor"]),
    rejectRegistration
);
router.patch(
    "/registrations/:id/resubmit",
    authenticate,
    authorize(["guidance_counselor"]),
    allowResubmission
);

export default router;
