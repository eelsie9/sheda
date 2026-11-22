import { Router } from "express";
import {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
} from "../controllers/listingController.js";
import { requireAuth, optionalAuth, requireSeller } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, getListings);
router.get("/:id", optionalAuth, getListing);
router.post("/", requireAuth, requireSeller, createListing);
router.put("/:id", requireAuth, updateListing);
router.delete("/:id", requireAuth, deleteListing);

export default router;