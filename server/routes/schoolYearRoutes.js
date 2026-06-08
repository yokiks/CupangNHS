import express from "express";
import {
    getSchoolYears,
    getActiveSchoolYear,
    createSchoolYear,
    getSchoolYearReport,
    activateSchoolYear,
    archiveSchoolYear,
    deleteSchoolYear,
} from "../controllers/schoolYearController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(["guidance_counselor"]));

router.get("/", getSchoolYears);
router.get("/active", getActiveSchoolYear);
router.get("/:id/report", getSchoolYearReport);
router.post("/", createSchoolYear);
router.patch("/:id/activate", activateSchoolYear);
router.patch("/:id/archive", archiveSchoolYear);
router.delete("/:id", deleteSchoolYear);

export default router;
