import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";

const dir = path.join(process.cwd(), "uploads");
fs.mkdirSync(dir, { recursive: true });

const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };

const upload = multer({
  storage: multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + EXT[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, !!EXT[file.mimetype]),
});

const router = Router();

router.post("/", requireAuth, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) {
      return res.status(400).json({ error: "Please choose a JPG, PNG, WebP or GIF image under 5 MB" });
    }
    res.status(201).json({ url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` });
  });
});

export default router;