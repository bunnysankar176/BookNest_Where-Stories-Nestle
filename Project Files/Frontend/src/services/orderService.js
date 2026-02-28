import api from "./api";

// USER – Create Orders
export const createOrder = async (orderData) => {
  const res = await api.post("/orders", orderData);
  return res.data;
};

// Confirm Payment
export const confirmPayment = async (orderId) => {
  const res = await api.post("/orders/confirm-payment", {
    orderId,
  });
  return res.data;
};

// USER – Get My Orders
export const getUserOrders = async () => {
  const res = await api.get(`/orders/my-orders`);
  return res.data;
};

// ✅ USER – Get Single Order (NEW)
export const getOrderById = async (id) => {
  const res = await api.get(`/orders/${id}`);
  return res.data;
};


// ✅ USER – Cancel Order (UPDATED FOR PARTIAL CANCELLATION)
export const cancelOrder = async (id, itemIds) => {
  const res = await api.patch(`/orders/${id}/cancel`, { itemIds });
  return res.data;
};

// SELLER – Get Orders for Seller
export const getSellerOrders = async () => {
  const res = await api.get(`/orders/seller`);
  return res.data;
};

// ADMIN – Get All Orders (✅ UPDATED: Added date parameter for calendar filtering)
export const getAllOrders = async (
  page = 1,
  search = "",
  status = "all",
  date = "" 
) => {
  const res = await api.get(
    `/orders/admin?page=${page}&search=${search}&status=${status}&date=${date}`
  );
  return res.data;
};

// SELLER / ADMIN – Update Bulk Order Status
export const updateOrderStatus = async (id, status) => {
  const res = await api.put(`/orders/${id}`, { status });
  return res.data;
};

// ✅ ADMIN – Update Specific Item Status (NEW: For updating individual books in an order)
export const updateOrderItemStatus = async (orderId, itemId, status) => {
  const res = await api.put(`/orders/${orderId}`, { status, itemId });
  return res.data;
};