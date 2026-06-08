import express from "express";
import multer from "multer";
import {
    submitRevalidationRequest,
    getRevalidationSummary,
    getRevalidationRequests,
    allowRevalidationSubmission,
    approveRevalidationRequest,
    rejectRevalidationRequest,
} from "../controllers/revalidationController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

router.use(authenticate);

router.get("/summary", authorize(["student"]), getRevalidationSummary);
router.post("/", authorize(["student"]), upload.single("schoolIdProof"), submitRevalidationRequest);

router.use(authorize(["guidance_counselor"]));

router.get("/", getRevalidationRequests);
router.patch("/students/:studentId/allow-submission", allowRevalidationSubmission);
router.patch("/:id/approve", approveRevalidationRequest);
router.patch("/:id/reject", rejectRevalidationRequest);

export default router;
