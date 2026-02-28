import api from "./api";

export const getCart = async () => {
  const res = await api.get("/cart");
  return res.data;
};

export const addToCart = async (bookId, quantity) => {
  const res = await api.post("/cart", { bookId, quantity });
  return res.data;
};

export const removeFromCart = async (id) => {
  const res = await api.delete(`/cart/${id}`);
  return res.data;
};

export const getUserStats = async () => {
  const res = await api.get(`/cart/stats`);
  return res.data;
};

export const updateCartQuantity = async (bookId, quantity) => {
  const res = await api.put(`/cart/${bookId}`, { quantity });
  return res.data;
};

export const clearCartService = async () => {
  const res = await api.delete("/cart");
  return res.data;
};

