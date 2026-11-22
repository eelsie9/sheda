import prisma from "../lib/prisma.js";

export const publicUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

// Tells the frontend which details to ask the user for
export const getMissingInfo = (user) => {
  const missing = [];
  if (user.activeRole === "SELLER") {
    const sp = user.sellerProfile;
    if (!sp?.creativeType) missing.push("creativeType");
    if (!sp?.offerings) missing.push("offerings");
    if (!sp?.portfolioLinks?.length) missing.push("portfolioLinks");
  } else if (!user.interests?.length) {
    missing.push("interests");
  }
  return missing;
};

export const cleanList = (value) =>
  Array.isArray(value)
    ? value.map((v) => String(v).trim()).filter(Boolean)
    : [];

export const getRatings = async (sellerIds) => {
  if (!sellerIds.length) return {};
  const rows = await prisma.review.groupBy({
    by: ["sellerId"],
    where: { sellerId: { in: sellerIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const map = {};
  rows.forEach((r) => {
    map[r.sellerId] = {
      averageRating: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : null,
      reviewCount: r._count.rating,
    };
  });
  return map;
};

export const noRating = { averageRating: null, reviewCount: 0 };