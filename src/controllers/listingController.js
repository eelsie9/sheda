import prisma from "../lib/prisma.js";

const sellerSelect = {
  select: {
    id: true,
    name: true,
    avatar: true,
    sellerProfile: { select: { creativeType: true } },
  },
};

export const createListing = async (req, res) => {
  try {
    const { title, description, price, images, category, type } = req.body;
    if (!title || !description || price == null || Number.isNaN(Number(price)) || !category) {
      return res.status(400).json({ error: "title, description, price and category are required" });
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: Number(price),
        images: Array.isArray(images) ? images : [],
        category,
        type: type === "SERVICE" ? "SERVICE" : "PRODUCT",
        sellerId: req.userId,
      },
    });
    res.status(201).json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getListings = async (req, res) => {
  try {
    const { category, search, type, sellerId } = req.query;
    const upperType = type ? String(type).toUpperCase() : null;

    const where = {
      ...(category && { category: { equals: String(category), mode: "insensitive" } }),
      ...(["PRODUCT", "SERVICE"].includes(upperType) && { type: upperType }),
      ...(sellerId && { sellerId: String(sellerId) }),
      ...(search && {
        OR: [
          { title: { contains: String(search), mode: "insensitive" } },
          { description: { contains: String(search), mode: "insensitive" } },
        ],
      }),
    };

    // Remember searches for logged-in users (shown on their profile)
    if (search && req.user) {
      prisma.searchHistory
        .create({ data: { userId: req.userId, query: String(search).trim() } })
        .catch(() => {});
    }

    const listings = await prisma.listing.findMany({
      where,
      include: { seller: sellerSelect },
      orderBy: { createdAt: "desc" },
    });
    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getListing = async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            bio: true,
            avatar: true,
            sellerProfile: true,
          },
        },
      },
    });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Remember what a logged-in user looked at
    if (req.user && listing.sellerId !== req.userId) {
      prisma.listingView
        .upsert({
          where: { userId_listingId: { userId: req.userId, listingId: listing.id } },
          update: { viewedAt: new Date() },
          create: { userId: req.userId, listingId: listing.id },
        })
        .catch(() => {});
    }

    res.json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateListing = async (req, res) => {
  try {
    const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Listing not found" });
    if (existing.sellerId !== req.userId) {
      return res.status(403).json({ error: "Not your listing" });
    }

    const { title, description, price, images, category, type } = req.body;
    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price != null && { price: Number(price) }),
        ...(Array.isArray(images) && { images }),
        ...(category && { category }),
        ...(["PRODUCT", "SERVICE"].includes(type) && { type }),
      },
    });
    res.json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteListing = async (req, res) => {
  try {
    const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Listing not found" });
    if (existing.sellerId !== req.userId) {
      return res.status(403).json({ error: "Not your listing" });
    }

    await prisma.listing.delete({ where: { id: req.params.id } });
    res.json({ message: "Listing deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};