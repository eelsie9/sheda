import { Router } from "express";
import {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
} from "../controllers/listingController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", getListings);
router.get("/:id", getListing);
router.post("/", requireAuth, createListing);
router.put("/:id", requireAuth, updateListing);
router.delete("/:id", requireAuth, deleteListing);

export default router;