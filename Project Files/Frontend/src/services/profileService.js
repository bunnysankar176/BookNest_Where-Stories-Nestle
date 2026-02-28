import api from "./api";

// Get all addresses
export const getAddresses = async () => {
  const res = await api.get("/profile/addresses");
  return res.data;
};

// Add address
export const addAddress = async (addressData) => {
  const res = await api.post("/profile/addresses", addressData);
  return res.data;
};

// Update address
export const updateAddress = async (id, addressData) => {
  const res = await api.put(`/profile/addresses/${id}`, addressData);
  return res.data;
};

// Set default address
export const setDefaultAddress = async (id) => {
  const res = await api.patch(`/profile/addresses/${id}/default`);
  return res.data;
};

// Delete address
export const deleteAddress = async (id) => {
  const res = await api.delete(`/profile/addresses/${id}`);
  return res.data;
};

export const getUserAnalytics = async () => {
  const res = await api.get("/user/analytics");
  return res.data;
};