import { Router } from "express";
import { createPost, getPosts, deletePost } from "../controllers/postController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", getPosts);
router.post("/", requireAuth, createPost);
router.delete("/:id", requireAuth, deletePost);

export default router;