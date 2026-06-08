import express from "express";
import multer from "multer";
import {
    createConcern,
    getConcerns,
    updateConcernStatus,
    deleteConcern,
    restoreConcern,
    generateConcernReport,
    getFlaggedStudents,
    notifyParent,
} from "../controllers/concernController.js";
import {
    saveConcernReport,
    getConcernReport,
} from "../controllers/reportController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { addClient, removeClient } from "../services/sseManager.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

const router = express.Router();

router.get("/events", authenticate, (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });
    res.write(":\n\n");

    res._sseRole = req.user.role;
    addClient(req.user.id, res);

    const heartbeat = setInterval(() => {
        res.write(":\n\n");
    }, 30000);

    req.on("close", () => {
        clearInterval(heartbeat);
        removeClient(req.user.id, res);
    });
});

router.use(authenticate);

router
    .route("/")
    .get(getConcerns)
    .post(authorize(["student", "guidance_counselor"]), upload.array("files"), createConcern);

router.get("/report", authorize(["guidance_counselor"]), generateConcernReport);
router.get("/flagged-students", authorize(["guidance_counselor"]), getFlaggedStudents);

router
    .route("/:id/report")
    .get(getConcernReport)
    .put(authorize(["guidance_counselor"]), saveConcernReport);

router.post("/:id/notify-parent", authorize(["guidance_counselor"]), notifyParent);
router.patch("/:id/restore", authorize(["guidance_counselor"]), restoreConcern);

router
    .route("/:id")
    .patch(authorize(["guidance_counselor"]), updateConcernStatus)
    .delete(deleteConcern);

export default router;
