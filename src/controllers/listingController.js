import prisma from "../lib/prisma.js";

export const createListing = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user?.isSeller) {
      return res.status(403).json({ error: "Only sellers can create listings" });
    }

    const { title, description, price, images, category } = req.body;
    if (!title || !description || price == null || !category) {
      return res.status(400).json({ error: "title, description, price and category are required" });
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: Number(price),
        images: images || [],
        category,
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
    const { category, search } = req.query;
    const listings = await prisma.listing.findMany({
      where: {
        ...(category && { category }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: { seller: { select: { id: true, name: true } } },
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
      include: { seller: { select: { id: true, name: true, bio: true } } },
    });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
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

    const { title, description, price, images, category } = req.body;
    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price != null && { price: Number(price) }),
        ...(images && { images }),
        ...(category && { category }),
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