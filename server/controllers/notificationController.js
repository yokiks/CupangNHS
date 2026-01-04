import pool from "../config/db.js";

export const getNotifications = async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                `SELECT id, concern_id, message, type, read_flag, created_at 
                 FROM notifications 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 50`,
                [req.user.id]
            );
            return res.json(
                rows.map((row) => ({
                    id: row.id,
                    concernId: row.concern_id,
                    message: row.message,
                    type: row.type,
                    read: Boolean(row.read_flag),
                    createdAt: row.created_at,
                }))
            );
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getNotifications error:", error);
        return res.status(500).json({ message: "Unable to fetch notifications." });
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const conn = await pool.getConnection();
        try {
            await conn.query(
                "UPDATE notifications SET read_flag = 1 WHERE id = ? AND user_id = ?",
                [id, req.user.id]
            );
            return res.json({ message: "Notification marked as read." });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("markNotificationRead error:", error);
        return res.status(500).json({ message: "Unable to update notification." });
    }
};

export const markAllNotificationsRead = async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            await conn.query("UPDATE notifications SET read_flag = 1 WHERE user_id = ?", [req.user.id]);
            return res.json({ message: "All notifications marked as read." });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("markAllNotificationsRead error:", error);
        return res.status(500).json({ message: "Unable to update notifications." });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const [rows] = await conn.query(
                "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_flag = 0",
                [req.user.id]
            );
            return res.json({ count: rows[0]?.count || 0 });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("getUnreadCount error:", error);
        return res.status(500).json({ message: "Unable to fetch unread count." });
    }
};

