import prisma from "../lib/prisma.js";
import { CATEGORIES } from "../utils/categories.js";
import { getRatings, noRating } from "../utils/helpers.js";

const sellerSelect = { select: { id: true, name: true, avatar: true } };

export const getCategories = (req, res) => {
  res.json({ categories: CATEGORIES });
};

export const getHome = async (req, res) => {
  try {
    // Categories with how many listings each has
    const counts = await prisma.listing.groupBy({
      by: ["category"],
      _count: { _all: true },
    });
    const countMap = {};
    counts.forEach((c) => {
      countMap[c.category.toLowerCase()] = c._count._all;
    });
    const categories = CATEGORIES.map((name) => ({
      name,
      count: countMap[name.toLowerCase()] || 0,
    }));

    // Recommended: based on the buyer's interests, otherwise newest
    const interests = req.user?.interests || [];
    let recommended = [];
    if (interests.length) {
      recommended = await prisma.listing.findMany({
        where: {
          sellerId: { not: req.user.id },
          OR: interests.flatMap((i) => [
            { category: { equals: i, mode: "insensitive" } },
            { title: { contains: i, mode: "insensitive" } },
          ]),
        },
        include: { seller: sellerSelect },
        orderBy: { createdAt: "desc" },
        take: 12,
      });
    }
    if (!recommended.length) {
      recommended = await prisma.listing.findMany({
        include: { seller: sellerSelect },
        orderBy: { createdAt: "desc" },
        take: 12,
      });
    }

    // Creators to check out
    const creators = await prisma.user.findMany({
      where: { sellerProfile: { isNot: null } },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        sellerProfile: { select: { creativeType: true, offerings: true } },
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    const ratings = await getRatings(creators.map((c) => c.id));
    const featuredCreators = creators.map((c) => ({
      ...c,
      ...(ratings[c.id] || noRating),
    }));

    // Newest public requests
    const latestRequests = await prisma.ask.findMany({
      where: { status: "OPEN" },
      include: { user: sellerSelect },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    res.json({ categories, recommended, featuredCreators, latestRequests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};