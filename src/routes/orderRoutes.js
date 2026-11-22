import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getMySales,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { requireAuth, requireBuyer, requireSeller } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, requireBuyer, createOrder);
router.get("/mine", requireAuth, getMyOrders);
router.get("/sales", requireAuth, requireSeller, getMySales);
router.patch("/:id/status", requireAuth, updateOrderStatus);

export default router;