import prisma from "../lib/prisma.js";
import { cleanList, getRatings, isVerified, noRating } from "../utils/helpers.js";

const cleanTags = (tags) => cleanList(tags).map((t) => t.toLowerCase());

const listingPreview = {
  select: { id: true, title: true, images: true, price: true, category: true },
};
const ownerSelect = { select: { id: true, name: true, avatar: true } };

const canView = (board, user) => board.isPublic || (user && board.userId === user.id);

const STOP_WORDS = new Set([
  "with", "that", "this", "from", "your", "ideas", "idea", "board",
  "want", "need", "have", "like", "some", "more", "about",
]);

const wordsFrom = (text) =>
  String(text || "")
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

export const createBoard = async (req, res) => {
  try {
    const { name, description, isPublic, tags } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const board = await prisma.board.create({
      data: {
        name: String(name).trim(),
        description: description || null,
        isPublic: isPublic === true,
        tags: cleanTags(tags),
        userId: req.userId,
      },
    });
    res.status(201).json({ board });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getMyBoards = async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      where: { userId: req.userId },
      include: {
        items: {
          take: 4,
          orderBy: { createdAt: "desc" },
          include: { listing: listingPreview },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ boards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Sellers browse buyers' public boards (the "Idea Boards" tab)
export const discoverBoards = async (req, res) => {
  try {
    const { search, tag, matchMine } = req.query;
    const crafts = req.user.sellerProfile.creativeType.toLowerCase().split(",").map((c) => c.trim()).filter(Boolean);

    const conditions = [];
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: String(search), mode: "insensitive" } },
          { description: { contains: String(search), mode: "insensitive" } },
        ],
      });
    }
    if (tag) conditions.push({ tags: { has: String(tag).toLowerCase() } });
    if (matchMine === "true") {
      conditions.push({
        OR: crafts.flatMap((c) => [
          { tags: { has: c } },
          { name: { contains: c, mode: "insensitive" } },
          { description: { contains: c, mode: "insensitive" } },
        ]),
      });
    }

    const boards = await prisma.board.findMany({
      where: {
        isPublic: true,
        userId: { not: req.userId },
        ...(conditions.length && { AND: conditions }),
      },
      include: {
        user: ownerSelect,
        items: {
          take: 4,
          orderBy: { createdAt: "desc" },
          include: { listing: listingPreview },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ boards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getBoard = async (req, res) => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: {
        user: ownerSelect,
        items: {
          orderBy: { createdAt: "desc" },
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                images: true,
                price: true,
                category: true,
                seller: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!board) return res.status(404).json({ error: "Board not found" });
    if (!canView(board, req.user)) return res.status(403).json({ error: "This board is private" });

    res.json({ board, isOwner: !!req.user && board.userId === req.user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateBoard = async (req, res) => {
  try {
    const existing = await prisma.board.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Board not found" });
    if (existing.userId !== req.userId) return res.status(403).json({ error: "Not your board" });

    const { name, description, isPublic, tags } = req.body;
    const board = await prisma.board.update({
      where: { id: existing.id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(description !== undefined && { description }),
        ...(typeof isPublic === "boolean" && { isPublic }),
        ...(tags !== undefined && { tags: cleanTags(tags) }),
      },
    });
    res.json({ board });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteBoard = async (req, res) => {
  try {
    const existing = await prisma.board.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Board not found" });
    if (existing.userId !== req.userId) return res.status(403).json({ error: "Not your board" });

    await prisma.board.delete({ where: { id: existing.id } });
    res.json({ message: "Board deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const addItem = async (req, res) => {
  try {
    const board = await prisma.board.findUnique({ where: { id: req.params.id } });
    if (!board) return res.status(404).json({ error: "Board not found" });
    if (board.userId !== req.userId) return res.status(403).json({ error: "Not your board" });

    const { listingId, imageUrl, note } = req.body;
    if (!listingId && !imageUrl && !note) {
      return res.status(400).json({ error: "Send a listingId, an imageUrl or a note" });
    }
    if (listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) return res.status(404).json({ error: "Listing not found" });
    }

    const item = await prisma.boardItem.create({
      data: {
        boardId: board.id,
        listingId: listingId || null,
        imageUrl: imageUrl || null,
        note: note || null,
      },
    });
    res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const removeItem = async (req, res) => {
  try {
    const item = await prisma.boardItem.findUnique({
      where: { id: req.params.itemId },
      include: { board: true },
    });
    if (!item || item.boardId !== req.params.id) {
      return res.status(404).json({ error: "Item not found" });
    }
    if (item.board.userId !== req.userId) return res.status(403).json({ error: "Not your board" });

    await prisma.boardItem.delete({ where: { id: item.id } });
    res.json({ message: "Item removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// The side panel: suggest creators that match this board. Verified sellers come first.
export const getRecommendations = async (req, res) => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { listing: { select: { category: true } } } } },
    });
    if (!board) return res.status(404).json({ error: "Board not found" });
    if (!canView(board, req.user)) return res.status(403).json({ error: "This board is private" });

    const words = new Set(board.tags);
    wordsFrom(board.name).forEach((w) => words.add(w));
    wordsFrom(board.description).forEach((w) => words.add(w));
    board.items.forEach((item) => {
      if (item.listing?.category) words.add(item.listing.category.toLowerCase());
      wordsFrom(item.note).forEach((w) => words.add(w));
    });

    const keywords = [...words].slice(0, 15);
    if (!keywords.length) return res.json({ keywords: [], creators: [] });

    const found = await prisma.user.findMany({
      where: {
        id: { not: board.userId },
        sellerProfile: { isNot: null },
        OR: keywords.flatMap((k) => [
          { sellerProfile: { creativeType: { contains: k, mode: "insensitive" } } },
          { sellerProfile: { offerings: { contains: k, mode: "insensitive" } } },
          { listings: { some: { category: { contains: k, mode: "insensitive" } } } },
          { listings: { some: { title: { contains: k, mode: "insensitive" } } } },
        ]),
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        sellerProfile: true,
        listings: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, images: true, price: true, category: true },
        },
      },
      take: 40,
    });

    const ratings = await getRatings(found.map((c) => c.id));
    const creators = found
      .map((c) => {
        const text = [
          c.sellerProfile.creativeType,
          c.sellerProfile.offerings,
          ...c.listings.map((l) => `${l.category} ${l.title}`),
        ]
          .join(" ")
          .toLowerCase();
        return {
          id: c.id,
          name: c.name,
          avatar: c.avatar,
          sellerProfile: { creativeType: c.sellerProfile.creativeType },
          listings: c.listings,
          verified: isVerified(c),
          matchScore: keywords.filter((k) => text.includes(k)).length,
          ...(ratings[c.id] || noRating),
        };
      })
      .sort((a, b) => Number(b.verified) - Number(a.verified) || b.matchScore - a.matchScore)
      .slice(0, 10);

    res.json({ keywords, creators });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};