import api from "./api";

// Get Users
export const getUsers = async () => {
  const { data } = await api.get("/admin/users");
  return data;
};

// Get Sellers
export const getSellers = async () => {
  const { data } = await api.get("/admin/sellers");
  return data;
};

// Approve Seller
export const approveSeller = async (id) => {
  const { data } = await api.put(`/admin/sellers/${id}/approve`);
  return data;
};

// Reject Seller
export const rejectSeller = async (id) => {
  const { data } = await api.put(`/admin/sellers/${id}/reject`);
  return data;
};

// Get Stats
export const getStats = async () => {
  const { data } = await api.get("/admin/stats");
  return data;
};

// Add User
export const addUser = async (formData) => {
  const { data } = await api.post("/admin/users", formData);
  return data;
};

// Add Seller
export const addSeller = async (formData) => {
  const { data } = await api.post("/admin/sellers", formData);
  return data;
};

// Delete User
export const deleteUser = async (id) => {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
};

// Delete Seller
export const deleteSeller = async (id) => {
  const { data } = await api.delete(`/admin/sellers/${id}`);
  return data;
};

// Update Account (User or Seller)
export const updateAccount = async (id, data) => {
  const res = await api.put(`/admin/accounts/${id}`, data);
  return res.data;
};

// Get Account by ID (User or Seller)
export const getAccountById = async (id) => {
  const res = await api.get(`/admin/accounts/${id}`);
  return res.data;
};


