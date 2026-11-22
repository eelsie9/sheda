import { Router } from "express";
import {
  createAsk,
  getAsks,
  getMyAsks,
  getAsk,
  updateAsk,
  deleteAsk,
} from "../controllers/askController.js";
import { createProposal } from "../controllers/proposalController.js";
import { requireAuth, optionalAuth, requireBuyer, requireSeller } from "../middleware/auth.js";

const router = Router();

router.get("/", getAsks);
router.get("/mine", requireAuth, getMyAsks);
router.get("/:id", optionalAuth, getAsk);
router.post("/", requireAuth, requireBuyer, createAsk);
router.post("/:id/proposals", requireAuth, requireSeller, createProposal);
router.patch("/:id", requireAuth, updateAsk);
router.delete("/:id", requireAuth, deleteAsk);

export default router;