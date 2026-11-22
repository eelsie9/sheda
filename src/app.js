import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import homeRoutes from "./routes/homeRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import askRoutes from "./routes/askRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", homeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/asks", askRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

export default app;