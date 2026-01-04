import express from "express";
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getNotifications);
router.get("/unread/count", getUnreadCount);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;

