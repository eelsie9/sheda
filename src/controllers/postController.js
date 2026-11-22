import prisma from "../lib/prisma.js";
import { cleanList } from "../utils/helpers.js";

const postInclude = {
  user: { select: { id: true, name: true, avatar: true, activeRole: true } },
  listing: { select: { id: true, title: true, images: true } },
};

export const createPost = async (req, res) => {
  try {
    const { text, images, listingId } = req.body;
    const imageList = cleanList(images);
    if (!text && !imageList.length) {
      return res.status(400).json({ error: "A post needs text or at least one image" });
    }

    if (listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) return res.status(404).json({ error: "Listing not found" });
    }

    const post = await prisma.post.create({
      data: {
        text: text ? String(text).trim() : "",
        images: imageList,
        listingId: listingId || null,
        userId: req.userId,
      },
      include: postInclude,
    });
    res.status(201).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getPosts = async (req, res) => {
  try {
    const { by, userId } = req.query;
    const where = {
      ...(userId && { userId: String(userId) }),
      ...(by === "sellers" && { user: { sellerProfile: { isNot: null } } }),
      ...(by === "buyers" && { user: { sellerProfile: { is: null } } }),
    };

    const posts = await prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.userId !== req.userId) return res.status(403).json({ error: "Not your post" });

    await prisma.post.delete({ where: { id: post.id } });
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};