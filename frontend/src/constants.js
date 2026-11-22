
export const PHOTOS = {
  team: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900",
  friends: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=900",
  potter: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900",
  fashion: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900",
  laughing: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300",
  celebrate: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=300",
};

export const CATEGORIES = [
  "Art", "Illustration", "Graphic Design", "Fashion", "Jewelry", "Crafts",
  "Photography", "Videography", "Music", "Writing", "Web Design", "Beauty", "Other",
];

export const money = (n) => "₦" + Number(n || 0).toLocaleString();
export const initial = (name) => (name || "?").trim().charAt(0).toUpperCase();
export const lines = (t) => t.split("\n").map((s) => s.trim()).filter(Boolean);

const TINTS = ["bg-brand-100", "bg-sand", "bg-brand-200", "bg-brand-300/60"];
export const tint = (id = "") =>
  TINTS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];

export const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const href = (u) => (/^https?:\/\//.test(u) ? u : `https://${u}`);
export const host = (u) => {
  try {
    return new URL(href(u)).hostname.replace("www.", "");
  } catch {
    return u;
  }
};

export const isVerified = (user) =>
  Boolean(user?.isVerified || user?.sellerProfile?.isVerified);


export const verifyChecks = (user) => {
  const sp = user?.sellerProfile || {};

  return [
    ["Profile picture added", Boolean(user?.avatar)],
    ["Bio completed", Boolean(user?.bio?.trim())],
    ["Creative category selected", Boolean(sp.creativeType)],
    ["Offerings described", Boolean(sp.offerings?.trim())],
    ["Portfolio links added", Boolean(sp.portfolioLinks?.length)],
    ["Social links added", Boolean(sp.socialLinks?.length)],
  ];
};
