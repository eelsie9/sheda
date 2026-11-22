import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { publicUser, getMissingInfo, cleanList } from "../utils/helpers.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const register = async (req, res) => {
  try {
    const { name, email, password, role, interests, sellerProfile } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const activeRole = role === "SELLER" ? "SELLER" : "BUYER";
    if (activeRole === "SELLER" && (!sellerProfile?.creativeType || !sellerProfile?.offerings)) {
      return res.status(400).json({
        error: "Sellers must give sellerProfile.creativeType and sellerProfile.offerings",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: cleanEmail,
        password: hashed,
        activeRole,
        interests: cleanList(interests),
        ...(activeRole === "SELLER" && {
          sellerProfile: {
            create: {
              creativeType: String(sellerProfile.creativeType).trim(),
              offerings: String(sellerProfile.offerings).trim(),
              portfolioLinks: cleanList(sellerProfile.portfolioLinks),
              socialLinks: cleanList(sellerProfile.socialLinks),
            },
          },
        }),
      },
      include: { sellerProfile: true },
    });

    res.status(201).json({
      token: signToken(user.id),
      user: publicUser(user),
      missingInfo: getMissingInfo(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      include: { sellerProfile: true },
    });
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      token: signToken(user.id),
      user: publicUser(user),
      missingInfo: getMissingInfo(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const me = async (req, res) => {
  res.json({ user: publicUser(req.user), missingInfo: getMissingInfo(req.user) });
};