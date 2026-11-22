import prisma from "../lib/prisma.js";
import { publicUser, getMissingInfo, cleanList, getRatings, noRating } from "../utils/helpers.js";

// Edit my profile (buyer interests, seller details, name, bio, avatar)
export const updateMe = async (req, res) => {
  try {
    const { name, bio, avatar, interests, sellerProfile } = req.body;

    const data = {
      ...(name && { name: String(name).trim() }),
      ...(bio !== undefined && { bio }),
      ...(avatar !== undefined && { avatar }),
      ...(interests !== undefined && { interests: cleanList(interests) }),
    };

    if (sellerProfile) {
      const sp = {
        ...(sellerProfile.creativeType && { creativeType: String(sellerProfile.creativeType).trim() }),
        ...(sellerProfile.offerings && { offerings: String(sellerProfile.offerings).trim() }),
        ...(sellerProfile.portfolioLinks !== undefined && {
          portfolioLinks: cleanList(sellerProfile.portfolioLinks),
        }),
        ...(sellerProfile.socialLinks !== undefined && {
          socialLinks: cleanList(sellerProfile.socialLinks),
        }),
      };

      if (req.user.sellerProfile) {
        data.sellerProfile = { update: sp };
      } else {
        if (!sp.creativeType || !sp.offerings) {
          return res
            .status(400)
            .json({ error: "creativeType and offerings are required to become a seller" });
        }
        data.sellerProfile = { create: sp };
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      include: { sellerProfile: true },
    });
    res.json({ user: publicUser(user), missingInfo: getMissingInfo(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Switch between buyer and seller
export const switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["BUYER", "SELLER"].includes(role)) {
      return res.status(400).json({ error: "role must be BUYER or SELLER" });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { activeRole: role },
      include: { sellerProfile: true },
    });

    // missingInfo lists the details the frontend must now ask for
    res.json({ user: publicUser(user), missingInfo: getMissingInfo(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Search history, things I looked at, purchase history
export const getMyHistory = async (req, res) => {
  try {
    const [searches, views, purchases] = await Promise.all([
      prisma.searchHistory.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.listingView.findMany({
        where: { userId: req.userId },
        orderBy: { viewedAt: "desc" },
        take: 30,
        include: {
          listing: { include: { seller: { select: { id: true, name: true } } } },
        },
      }),
      prisma.order.findMany({
        where: { buyerId: req.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { seller: { select: { id: true, name: true } } },
      }),
    ]);

    res.json({
      searches,
      viewedListings: views.map((v) => ({ ...v.listing, viewedAt: v.viewedAt })),
      purchases,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const clearSearchHistory = async (req, res) => {
  try {
    await prisma.searchHistory.deleteMany({ where: { userId: req.userId } });
    res.json({ message: "Search history cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Anyone's public profile (seller portfolio, reviews, posts)
export const getPublicProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        bio: true,
        avatar: true,
        activeRole: true,
        createdAt: true,
        sellerProfile: true,
        listings: { orderBy: { createdAt: "desc" }, take: 50 },
        reviewsReceived: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { reviewer: { select: { id: true, name: true, avatar: true } } },
        },
        posts: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const ratings = await getRatings([user.id]);
    const { reviewsReceived, ...rest } = user;
    res.json({
      user: { ...rest, reviews: reviewsReceived, ...(ratings[user.id] || noRating) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Leave (or change) a review for a seller
export const addReview = async (req, res) => {
  try {
    const sellerId = req.params.id;
    if (sellerId === req.userId) {
      return res.status(400).json({ error: "You can't review yourself" });
    }

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be a whole number from 1 to 5" });
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      include: { sellerProfile: true },
    });
    if (!seller?.sellerProfile) return res.status(404).json({ error: "Seller not found" });

    const comment = req.body.comment ? String(req.body.comment).trim() : null;
    const review = await prisma.review.upsert({
      where: { sellerId_reviewerId: { sellerId, reviewerId: req.userId } },
      update: { rating, comment },
      create: { sellerId, reviewerId: req.userId, rating, comment },
    });
    res.status(201).json({ review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};