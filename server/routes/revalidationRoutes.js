import express from "express";
import multer from "multer";
import {
    submitRevalidationRequest,
    getRevalidationSummary,
    getRevalidationRequests,
    allowRevalidationSubmission,
    markStudentAsGraduated,
    approveRevalidationRequest,
    rejectRevalidationRequest,
} from "../controllers/revalidationController.js";
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
        const extension = file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase();
        if (PROOF_FILE_TYPES.get(extension) !== file.mimetype) {
            return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
        }
        callback(null, true);
    },
});

const uploadSchoolIdProof = (req, res, next) => {
    upload.single("schoolIdProof")(req, res, (error) => {
        if (!error) return next();
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "Uploaded file must not exceed 10 MB." });
        }
        if (error.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({ message: "School ID must be a JPG, JPEG, PNG, or PDF file." });
        }
        return next(error);
    });
};

const router = express.Router();

router.use(authenticate);

router.get("/summary", authorize(["student"]), getRevalidationSummary);
router.post("/", authorize(["student"]), uploadSchoolIdProof, submitRevalidationRequest);

router.use(authorize(["guidance_counselor"]));

router.get("/", getRevalidationRequests);
router.patch("/students/:studentId/allow-submission", allowRevalidationSubmission);
router.patch("/students/:studentId/mark-graduated", markStudentAsGraduated);
router.patch("/:id/approve", approveRevalidationRequest);
router.patch("/:id/reject", rejectRevalidationRequest);

export default router;
