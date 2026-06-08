import express from "express";
import {
    searchStudents,
    getStudentProfile,
    getStudentEnrollmentHistory,
} from "../controllers/studentController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/search", searchStudents);
router.get("/:id/enrollment-history", authorize(["guidance_counselor"]), getStudentEnrollmentHistory);
router.get("/:id/profile", authorize(["guidance_counselor"]), getStudentProfile);

export default router;
