import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import concernRoutes from "./routes/concernRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(
    cors({
        origin: CLIENT_ORIGIN,
        credentials: true,
    })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/concerns", concernRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "Internal server error." });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});