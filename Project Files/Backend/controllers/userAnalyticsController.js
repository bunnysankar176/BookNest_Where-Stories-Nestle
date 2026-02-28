const Order = require("../models/Order");
const User = require("../models/User");
const Book = require("../models/Book");
const mongoose = require("mongoose");

exports.getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ TOTAL ORDERS
    const totalOrders = await Order.countDocuments({ user: userId });

    // 2️⃣ TOTAL MONEY SPENT
    const revenueData = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalSpent = revenueData[0]?.totalSpent || 0;

// 3️⃣ TOTAL BOOKS PURCHASED
    const booksData = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$items" }, 
      {
        $group: {
          _id: null,
          totalBooksPurchased: { $sum: "$items.quantity" }, 
        },
      },
    ]);

    const totalBooksPurchased = booksData[0]?.totalBooksPurchased || 0;

    // 4️⃣ ORDER STATUS BREAKDOWN
    const statusBreakdownAgg = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const orderStatusBreakdown = {
      pending: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusBreakdownAgg.forEach((item) => {
      orderStatusBreakdown[item._id] = item.count;
    });

    // 5️⃣ MONTHLY SPENDING (LAST 6 MONTHS)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySpending = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: sixMonthsAgo },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formattedMonthlySpending = monthlySpending.map((item) => ({
      month: `${item._id.year}-${item._id.month}`,
      total: item.total,
    }));

// 6️⃣ MOST PURCHASED CATEGORY
    const categoryAgg = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$items" }, 
      {
        $lookup: {
          from: "books", 
          localField: "items.book", 
          foreignField: "_id",
          as: "bookDetails",
        },
      },
      { $unwind: "$bookDetails" },
      {
        $group: {
          _id: "$bookDetails.category",
          totalQuantity: { $sum: "$items.quantity" }, // ✅ FIX: Changed from orderItems.quantity
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 1 },
    ]);

    const favoriteCategory = categoryAgg[0]?._id || null;

    // 7️⃣ AVERAGE ORDER VALUE
    const averageOrderValue =
      totalOrders > 0 ? totalSpent / totalOrders : 0;

    // 8️⃣ LAST ORDER
    const lastOrder = await Order.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .select("createdAt totalAmount status");

    // 9️⃣ ACCOUNT AGE
    const user = await User.findById(userId).select("createdAt");

    const accountAgeDays = Math.floor(
      (new Date() - user.createdAt) / (1000 * 60 * 60 * 24)
    );

    // 10 MOST PURCHASED GENRE
    const genreAgg = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "books",
          localField: "items.book",
          foreignField: "_id",
          as: "bookDetails",
        },
      },
      { $unwind: "$bookDetails" },
      { $unwind: { path: "$bookDetails.genre", preserveNullAndEmptyArrays: true } }, 
      {
        $group: {
          _id: "$bookDetails.genre",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 1 },
    ]);

    const favoriteGenre = genreAgg[0]?._id || null;

    res.json({
      totalOrders,
      totalSpent,
      totalBooksPurchased,
      averageOrderValue,
      orderStatusBreakdown,
      monthlySpending: formattedMonthlySpending,
      favoriteCategory,
      favoriteGenre,
      lastOrder,
      accountAgeDays,
      memberSince: user.createdAt,
    });
  } catch (error) {
    console.error("User analytics error:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};