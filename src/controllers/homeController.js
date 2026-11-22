import prisma from "../lib/prisma.js";
import { CATEGORIES } from "../utils/categories.js";
import { getRatings, isVerified, noRating } from "../utils/helpers.js";

const person = { select: { id: true, name: true, avatar: true } };

export const getCategories = (req, res) => {
  res.json({ categories: CATEGORIES });
};

export const getHome = async (req, res) => {
  try {
    const counts = await prisma.listing.groupBy({ by: ["category"], _count: { _all: true } });
    const countMap = {};
    counts.forEach((c) => {
      countMap[c.category.toLowerCase()] = c._count._all;
    });
    const categories = CATEGORIES.map((name) => ({ name, count: countMap[name.toLowerCase()] || 0 }));

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
        include: { seller: person },
        orderBy: { createdAt: "desc" },
        take: 12,
      });
    }
    if (!recommended.length) {
      recommended = await prisma.listing.findMany({
        include: { seller: person },
        orderBy: { createdAt: "desc" },
        take: 12,
      });
    }

    // Creators: verified sellers come first
    const rows = await prisma.user.findMany({
      where: { sellerProfile: { isNot: null } },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        sellerProfile: true,
        listings: { take: 1, orderBy: { createdAt: "desc" }, select: { images: true } },
        _count: { select: { listings: true } },
      },
      take: 40,
    });
    const ratings = await getRatings(rows.map((c) => c.id));
    const featuredCreators = rows
      .map((c) => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        creativeType: c.sellerProfile.creativeType,
        cover: c.listings[0]?.images?.[0] || null,
        listingCount: c._count.listings,
        verified: isVerified(c),
        ...(ratings[c.id] || noRating),
      }))
      .sort((a, b) => Number(b.verified) - Number(a.verified) || b.reviewCount - a.reviewCount)
      .slice(0, 8);

    const latestRequests = await prisma.ask.findMany({
      where: { status: "OPEN" },
      include: { user: person },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const testimonials = await prisma.review.findMany({
      where: { comment: { not: null }, rating: { gte: 5 } },
      include: {
        reviewer: person,
        seller: { select: { id: true, name: true, sellerProfile: { select: { creativeType: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    const [creators, listings, requests] = await Promise.all([
      prisma.sellerProfile.count(),
      prisma.listing.count(),
      prisma.ask.count({ where: { status: "OPEN" } }),
    ]);

    res.json({
      categories,
      recommended,
      featuredCreators,
      latestRequests,
      testimonials,
      stats: { creators, listings, requests },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};