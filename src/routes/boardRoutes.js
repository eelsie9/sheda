import { Router } from "express";
import {
  createBoard,
  getMyBoards,
  discoverBoards,
  getBoard,
  getRecommendations,
  updateBoard,
  deleteBoard,
  addItem,
  removeItem,
} from "../controllers/boardController.js";
import { requireAuth, optionalAuth, requireBuyer, requireSeller } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, requireBuyer, createBoard);
router.get("/mine", requireAuth, getMyBoards);
router.get("/discover", requireAuth, requireSeller, discoverBoards);
router.get("/:id", optionalAuth, getBoard);
router.get("/:id/recommendations", optionalAuth, getRecommendations);
router.patch("/:id", requireAuth, updateBoard);
router.delete("/:id", requireAuth, deleteBoard);
router.post("/:id/items", requireAuth, addItem);
router.delete("/:id/items/:itemId", requireAuth, removeItem);

export default router;