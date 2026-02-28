const mongoose = require("mongoose");
const Order = require("../models/Order");
const Book = require("../models/Book");
const User = require("../models/User");


// Get admin dashboard stats
exports.getAdminDashboard = async (req, res) => {
  try {
    // 1. Fast, concurrent counts (Runs all these DB queries simultaneously!)
    const [
      totalUsers,
      approvedSellers,
      pendingSellers,
      totalBooks,
      totalOrders
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "seller", status: "approved" }),
      User.countDocuments({ role: "seller", status: "pending" }),
      Book.countDocuments(),
      Order.countDocuments()
    ]);

    // 2. Orders by Status (Aggregation)
    const statusAgg = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const ordersByStatus = { pending: 0, paid: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    statusAgg.forEach((statusObj) => {
      const key = statusObj._id ? statusObj._id.toLowerCase() : 'pending';
      if (ordersByStatus[key] !== undefined) {
        ordersByStatus[key] = statusObj.count;
      } else {
        ordersByStatus[key] = statusObj.count; // Fallback for unexpected statuses
      }
    });

    // 3. Total Revenue (Added for parity with Seller totalSales)
    // Calculates all-time revenue from non-cancelled orders
    const totalRevenueAgg = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].totalRevenue : 0;

    // 4. Monthly Revenue (Using the same clean MongoDB Date formatter as the seller)
    const monthlyRevenue = await Order.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          // MongoDB automatically formats the date to "YYYY-MM"
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }, // Sort chronologically
      { $project: { _id: 0, month: "$_id", revenue: 1 } } // Format exactly for Recharts
    ]);

    // 5. Recent Orders (Latest 5)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email");

    // 6. Send Response
    res.json({
      totalUsers,
      approvedSellers,
      pendingSellers,
      totalBooks,
      totalOrders,
      totalRevenue, 
      ordersByStatus,
      monthlyRevenue,
      recentOrders,
    });
  } catch (error) {
    console.error("Admin Dashboard Aggregation Error:", error);
    res.status(500).json({ message: "Failed to fetch admin dashboard data" });
  }
};

// Get seller dashboard stats
exports.getSellerDashboard = async (req, res) => {
  try {
    // 1. Safety Check for Authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: User not found in request" });
    }

    const sellerId = req.user._id;
    
    // Convert to ObjectId (CRITICAL for aggregation pipelines)
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // 2. Fast Counts
    const totalBooks = await Book.countDocuments({ seller: sellerId });
    const totalOrders = await Order.countDocuments({ "items.seller": sellerId });

    // 3. Orders by Status (Aggregation)
    const statusAgg = await Order.aggregate([
      { $match: { "items.seller": sellerObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const ordersByStatus = { pending: 0, paid: 0, shipped: 0, delivered: 0, cancelled: 0 };
    statusAgg.forEach((statusObj) => {
      // Ensure it maps correctly even if case differs slightly
      const key = statusObj._id ? statusObj._id.toLowerCase() : 'pending';
      ordersByStatus[key] = statusObj.count;
    });

    // 4. Total Sales (Revenue across ALL orders matching this seller)
    // We $unwind the items array so we can calculate price * quantity per item
    const totalSalesAgg = await Order.aggregate([
      { $match: { "items.seller": sellerObjectId } },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerObjectId } }, // Filter out other sellers' items
      { 
        $group: { 
          _id: null, 
          totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } 
        } 
      }
    ]);
    const totalSales = totalSalesAgg.length > 0 ? totalSalesAgg[0].totalSales : 0;

    // 5. Monthly Revenue (Only "delivered" orders, formatted exactly for your React chart)
    const monthlyRevenue = await Order.aggregate([
      { $match: { "items.seller": sellerObjectId, status: "delivered" } },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerObjectId } },
      {
        $group: {
          // MongoDB automatically formats the date to "YYYY-MM"!
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { _id: 1 } }, // Sort chronologically
      { $project: { _id: 0, month: "$_id", revenue: 1 } } // Format to { month: "2023-08", revenue: 1500 }
    ]);

    // 6. Recent Orders (Standard query is best here since we just want the latest 5)
    const recentOrders = await Order.find({ "items.seller": sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email");

    // 7. Send the exact payload the frontend expects
    res.json({
      totalBooks,
      totalOrders,
      ordersByStatus,
      totalSales,
      monthlyRevenue,
      recentOrders,
    });

  } catch (error) {
    console.error("Seller Dashboard Aggregation Error:", error);
    res.status(500).json({ message: "Failed to fetch seller dashboard data" });
  }
};