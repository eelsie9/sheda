import prisma from "../lib/prisma.js";
import { cleanList } from "../utils/helpers.js";

const personSelect = { select: { id: true, name: true, avatar: true } };

// A seller answers a request
export const createProposal = async (req, res) => {
  try {
    const ask = await prisma.ask.findUnique({ where: { id: req.params.id } });
    if (!ask) return res.status(404).json({ error: "Request not found" });
    if (ask.status !== "OPEN") return res.status(400).json({ error: "This request is closed" });
    if (ask.userId === req.userId) {
      return res.status(400).json({ error: "You can't respond to your own request" });
    }

    const { message, price, sampleLinks } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const existing = await prisma.proposal.findUnique({
      where: { askId_sellerId: { askId: ask.id, sellerId: req.userId } },
    });
    if (existing) {
      return res.status(409).json({ error: "You already responded to this request" });
    }

    const proposal = await prisma.proposal.create({
      data: {
        askId: ask.id,
        sellerId: req.userId,
        message: String(message).trim(),
        price: price != null && price !== "" ? Number(price) : null,
        sampleLinks: cleanList(sampleLinks),
      },
    });
    res.status(201).json({ proposal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Seller: every request I responded to
export const getMyProposals = async (req, res) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { sellerId: req.userId },
      include: {
        ask: { select: { id: true, title: true, status: true, user: personSelect } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ proposals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Only the buyer who posted the request and the seller who answered may use a thread
const loadForParticipant = async (req, res) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id: req.params.id },
    include: {
      ask: { include: { user: personSelect } },
      seller: {
        select: {
          id: true,
          name: true,
          avatar: true,
          sellerProfile: { select: { creativeType: true, portfolioLinks: true } },
        },
      },
    },
  });
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return null;
  }
  if (proposal.sellerId !== req.userId && proposal.ask.userId !== req.userId) {
    res.status(403).json({ error: "You are not part of this conversation" });
    return null;
  }
  return proposal;
};

// The proposal plus its messages (the negotiation chat)
export const getProposal = async (req, res) => {
  try {
    const proposal = await loadForParticipant(req, res);
    if (!proposal) return;

    const messages = await prisma.message.findMany({
      where: { proposalId: proposal.id },
      include: { sender: personSelect },
      orderBy: { createdAt: "asc" },
    });
    res.json({ proposal, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const proposal = await loadForParticipant(req, res);
    if (!proposal) return;

    const text = req.body.text ? String(req.body.text).trim() : "";
    if (!text) return res.status(400).json({ error: "text is required" });

    const message = await prisma.message.create({
      data: { proposalId: proposal.id, senderId: req.userId, text },
      include: { sender: personSelect },
    });
    res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// The buyer accepts or declines a proposal
export const updateProposalStatus = async (req, res) => {
  try {
    const proposal = await loadForParticipant(req, res);
    if (!proposal) return;
    if (proposal.ask.userId !== req.userId) {
      return res.status(403).json({ error: "Only the buyer can do this" });
    }

    const { status } = req.body;
    if (!["ACCEPTED", "DECLINED"].includes(status)) {
      return res.status(400).json({ error: "status must be ACCEPTED or DECLINED" });
    }

    const updated = await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status },
    });
    res.json({ proposal: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};