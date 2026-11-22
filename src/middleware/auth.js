import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { getMissingInfo } from "../utils/helpers.js";

class AuthError extends Error {}

// The database can hiccup, so try the lookup twice before giving up
const findUser = async (id) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.user.findUnique({ where: { id }, include: { sellerProfile: true } });
    } catch (err) {
      if (attempt === 2) throw err;
    }
  }
};

const getTokenUser = async (req) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AuthError("Your session has ended. Please log in again.");
  }
  return findUser(payload.id);
};

// Must be logged in
export const requireAuth = async (req, res, next) => {
  try {
    const user = await getTokenUser(req);
    if (!user) return res.status(401).json({ error: "Please log in to continue." });
    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: err.message });
    console.error(err);
    res.status(503).json({ error: "Something went wrong on our side. Please try again in a moment." });
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
  } catch (err) {
    if (!(err instanceof AuthError)) console.error(err);
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