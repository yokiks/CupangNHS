import express from "express";
import { searchStudents, getStudentProfile } from "../controllers/studentController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/search", searchStudents);
router.get("/:id/profile", authorize(["guidance_counselor"]), getStudentProfile);

export default router;
