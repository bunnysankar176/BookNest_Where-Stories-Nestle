import api from "./api";

// Fetch admin dashboard stats
export const getAdminDashboard = async () => {
  try {
    const res = await api.get("/dashboard/admin");
    const data = res.data;

    return {
      totalUsers: data.totalUsers || 0,
      approvedSellers: data.approvedSellers || 0,
      pendingSellers: data.pendingSellers || 0,
      totalBooks: data.totalBooks || 0,
      totalOrders: data.totalOrders || 0,
      ordersByStatus: data.ordersByStatus || {
        pending: 0,
        paid: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      },
      monthlyRevenue: data.monthlyRevenue || [],
      recentOrders: data.recentOrders || [],
    };
  } catch (error) {
    console.error("Failed to fetch admin dashboard", error);
    return {
      totalUsers: 0,
      approvedSellers: 0,
      pendingSellers: 0,
      totalBooks: 0,
      totalOrders: 0,
      ordersByStatus: {
        pending: 0,
        paid: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      },
      monthlyRevenue: [],
      recentOrders: [],
    };
  }
};

// Fetch seller dashboard stats
export const getSellerDashboard = async () => {
  try {
    const res = await api.get("/dashboard/seller");
    const data = res.data;

    return {
      totalBooks: data.totalBooks || 0,
      totalOrders: data.totalOrders || 0,
      totalSales: data.totalSales || 0,
      ordersByStatus: data.ordersByStatus || {
        pending: 0,
        paid: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      },
      monthlyRevenue: data.monthlyRevenue || [],
      recentOrders: data.recentOrders || [],
    };
  } catch (error) {
    console.error("Failed to fetch seller dashboard", error);
    return {
      totalBooks: 0,
      totalOrders: 0,
      totalSales: 0,
      ordersByStatus: {
        pending: 0,
        paid: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      },
      monthlyRevenue: [],
      recentOrders: [],
    };
  }
};
