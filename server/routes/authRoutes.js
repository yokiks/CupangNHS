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

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

router.post("/register", upload.single("schoolIdProof"), registerUser);
router.post("/login", loginUser);
router.get("/me", authenticate, getCurrentUser);
router.patch("/me/profile-photo", authenticate, authorize(["student"]), upload.single("profilePhoto"), uploadProfilePhoto);
router.delete("/me/profile-photo", authenticate, authorize(["student"]), removeProfilePhoto);
router.patch("/revalidate", authenticate, authorize(["student"]), upload.single("schoolIdProof"), revalidateRegistration);
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
