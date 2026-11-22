import prisma from "../lib/prisma.js";
import { cleanList } from "../utils/helpers.js";

const askInclude = {
  user: { select: { id: true, name: true, avatar: true } },
  _count: { select: { proposals: true } },
};

export const createAsk = async (req, res) => {
  try {
    const { title, description, budget, category, referenceImages } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }

    const ask = await prisma.ask.create({
      data: {
        title,
        description,
        budget: budget != null && budget !== "" ? Number(budget) : null,
        category: category || null,
        referenceImages: cleanList(referenceImages),
        userId: req.userId,
      },
    });
    res.status(201).json({ ask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAsks = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const where = {
      status: status === "CLOSED" ? "CLOSED" : "OPEN",
      ...(category && { category: { equals: String(category), mode: "insensitive" } }),
      ...(search && {
        OR: [
          { title: { contains: String(search), mode: "insensitive" } },
          { description: { contains: String(search), mode: "insensitive" } },
        ],
      }),
    };

    const asks = await prisma.ask.findMany({
      where,
      include: askInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json({ asks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Buyer: all my own requests
export const getMyAsks = async (req, res) => {
  try {
    const asks = await prisma.ask.findMany({
      where: { userId: req.userId },
      include: askInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json({ asks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAsk = async (req, res) => {
  try {
    const ask = await prisma.ask.findUnique({
      where: { id: req.params.id },
      include: askInclude,
    });
    if (!ask) return res.status(404).json({ error: "Request not found" });

    let proposals;
    let myProposal = null;

    if (req.user && req.user.id === ask.userId) {
      // The buyer who posted it sees every proposal
      proposals = await prisma.proposal.findMany({
        where: { askId: ask.id },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              avatar: true,
              sellerProfile: { select: { creativeType: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (req.user) {
      // A seller only sees their own proposal
      myProposal = await prisma.proposal.findUnique({
        where: { askId_sellerId: { askId: ask.id, sellerId: req.userId } },
      });
    }

    res.json({ ask, ...(proposals && { proposals }), myProposal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateAsk = async (req, res) => {
  try {
    const existing = await prisma.ask.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Request not found" });
    if (existing.userId !== req.userId) {
      return res.status(403).json({ error: "Not your request" });
    }

    const { title, description, budget, category, referenceImages, status } = req.body;
    const ask = await prisma.ask.update({
      where: { id: existing.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(budget != null && { budget: Number(budget) }),
        ...(category && { category }),
        ...(Array.isArray(referenceImages) && { referenceImages: cleanList(referenceImages) }),
        ...(["OPEN", "CLOSED"].includes(status) && { status }),
      },
    });
    res.json({ ask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteAsk = async (req, res) => {
  try {
    const existing = await prisma.ask.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Request not found" });
    if (existing.userId !== req.userId) {
      return res.status(403).json({ error: "Not your request" });
    }

    await prisma.ask.delete({ where: { id: existing.id } });
    res.json({ message: "Request deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};