import express from "express";
import {
    createConcern,
    getConcerns,
    updateConcernStatus,
    deleteConcern,
    generateConcernReport,
} from "../controllers/concernController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router
    .route("/")
    .get(getConcerns) // students see their concerns, counselors see all
    .post(authorize(["student", "guidance_counselor"]), createConcern);

router.get("/report", authorize(["guidance_counselor"]), generateConcernReport);

router
    .route("/:id")
    .patch(authorize(["guidance_counselor"]), updateConcernStatus)
    .delete(deleteConcern);

export default router;

