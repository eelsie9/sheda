import prisma from "../lib/prisma.js";

export const createOrder = async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: "listingId is required" });

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.sellerId === req.userId) {
      return res.status(400).json({ error: "You can't order your own listing" });
    }

    const order = await prisma.order.create({
      data: {
        title: listing.title,
        price: listing.price,
        buyerId: req.userId,
        sellerId: listing.sellerId,
        listingId: listing.id,
      },
    });
    res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Buyer: purchase history
export const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.userId },
      include: { seller: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Seller: orders received
export const getMySales = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { sellerId: req.userId },
      include: { buyer: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ error: "status must be CONFIRMED, COMPLETED or CANCELLED" });
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const isSeller = order.sellerId === req.userId;
    const isBuyer = order.buyerId === req.userId;
    if (!isSeller && !isBuyer) return res.status(403).json({ error: "Not your order" });

    // Buyers can only cancel an order that is still pending
    if (!isSeller && (status !== "CANCELLED" || order.status !== "PENDING")) {
      return res.status(403).json({ error: "You can only cancel a pending order" });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status },
    });
    res.json({ order: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};