import express from "express";
import multer from "multer";
import {
    createConcern,
    getConcerns,
    updateConcernStatus,
    deleteConcern,
    generateConcernReport,
    // new details handler added below
} from "../controllers/concernController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

// Configure multer to parse multipart forms (fields + optional files)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

const router = express.Router();

router.use(authenticate);

router
    .route("/")
    .get(getConcerns) // students see their concerns, counselors see all
    // Accept multipart so req.body has fields when files are attached
    .post(authorize(["student", "guidance_counselor"]), upload.array("files"), createConcern);

// Provide concern details with attachments for report view
router.get("/:id/details", async (req, res) => {
    try {
        const { id } = req.params;
        const conn = await (await import("../config/db.js")).default.getConnection();
        try {
            const [rows] = await conn.query("SELECT * FROM concerns WHERE id = ?", [id]);
            if (!rows.length) {
                return res.status(404).json({ message: "Concern not found." });
            }
            const concern = rows[0];
            const [files] = await conn.query(
                "SELECT id, original_name, stored_name, mime_type, size, created_at FROM concern_attachments WHERE concern_id = ? ORDER BY id DESC",
                [id]
            );
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            const response = {
                id: concern.id,
                title: concern.title,
                description: concern.description,
                category: concern.category,
                status: concern.status,
                createdAt: concern.created_at,
                updatedAt: concern.updated_at,
                files: files.map((f) => ({
                    id: f.id,
                    name: f.original_name,
                    url: `${baseUrl}/uploads/${f.stored_name}`,
                    mimeType: f.mime_type,
                    size: f.size,
                    createdAt: f.created_at,
                })),
            };
            return res.json(response);
        } finally {
            conn.release();
        }
    } catch (e) {
        console.error("concern details error:", e);
        return res.status(500).json({ message: "Unable to fetch concern details." });
    }
});

router.get("/report", authorize(["guidance_counselor"]), generateConcernReport);

router
    .route("/:id")
    .patch(authorize(["guidance_counselor"]), updateConcernStatus)
    .delete(deleteConcern);

export default router;

