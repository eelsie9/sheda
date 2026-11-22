import { Router } from "express";
import {
  updateMe,
  switchRole,
  getMyHistory,
  clearSearchHistory,
  getPublicProfile,
  addReview,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.patch("/me", requireAuth, updateMe);
router.post("/me/switch-role", requireAuth, switchRole);
router.get("/me/history", requireAuth, getMyHistory);
router.delete("/me/history/searches", requireAuth, clearSearchHistory);
router.get("/:id", getPublicProfile);
router.post("/:id/reviews", requireAuth, addReview);

export default router;