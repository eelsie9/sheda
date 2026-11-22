import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import homeRoutes from "./routes/homeRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import askRoutes from "./routes/askRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

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

export default app;