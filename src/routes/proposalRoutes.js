import { Router } from "express";
import {
  getMyProposals,
  getProposal,
  sendMessage,
  updateProposalStatus,
} from "../controllers/proposalController.js";
import { requireAuth, requireSeller } from "../middleware/auth.js";

const router = Router();

router.get("/mine", requireAuth, requireSeller, getMyProposals);
router.get("/:id", requireAuth, getProposal);
router.post("/:id/messages", requireAuth, sendMessage);
router.patch("/:id/status", requireAuth, updateProposalStatus);

export default router;