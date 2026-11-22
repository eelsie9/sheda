import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { getMissingInfo } from "../utils/helpers.js";

const getTokenUser = async (req) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return prisma.user.findUnique({
    where: { id: payload.id },
    include: { sellerProfile: true },
  });
};

// Must be logged in
export const requireAuth = async (req, res, next) => {
  try {
    const user = await getTokenUser(req);
    if (!user) return res.status(401).json({ error: "Please log in first" });
    req.user = user;
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Visitors allowed, but logged-in users get personalised results
export const optionalAuth = async (req, res, next) => {
  try {
    const user = await getTokenUser(req);
    if (user) {
      req.user = user;
      req.userId = user.id;
    }
  } catch {
    // ignore bad tokens for public pages
  }
  next();
};

export const requireSeller = (req, res, next) => {
  const user = req.user;
  if (user.activeRole !== "SELLER") {
    return res.status(403).json({ error: "Switch to your seller account to do this" });
  }
  if (!user.sellerProfile?.creativeType || !user.sellerProfile?.offerings) {
    return res.status(403).json({
      error: "Complete your seller profile first",
      missingInfo: getMissingInfo(user),
    });
  }
  next();
};

export const requireBuyer = (req, res, next) => {
  if (req.user.activeRole !== "BUYER") {
    return res.status(403).json({ error: "Switch to your buyer account to do this" });
  }
  next();
};