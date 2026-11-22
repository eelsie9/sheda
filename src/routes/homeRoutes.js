import { Router } from "express";
import { getHome, getCategories } from "../controllers/homeController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/home", optionalAuth, getHome);
router.get("/categories", getCategories);

export default router;