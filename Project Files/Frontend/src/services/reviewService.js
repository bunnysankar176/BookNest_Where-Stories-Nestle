import api from "./api";

// ADD REVIEW
export const addReview = async (data) => {
  const response = await api.post("/reviews", data);
  return response.data;
};

// GET BOOK REVIEWS (Pagination + Sorting)
// FIX: Added Authorization header so backend knows if the user owns a hidden review
export const getBookReviews = async (
  bookId,
  { page = 1, limit = 5, sort = "newest" } = {}
) => {
  const token = localStorage.getItem("token"); 
  const config = {};
  
  if (token) {
    config.headers = { Authorization: `Bearer ${token}` };
  }

  const response = await api.get(
    `/reviews/book/${bookId}?page=${page}&limit=${limit}&sort=${sort}`,
    config
  );
  return response.data;
};

// GET RATING DISTRIBUTION
export const getRatingDistribution = async (bookId) => {
  const response = await api.get(
    `/reviews/book/${bookId}/distribution`
  );
  return response.data;
};

// UPDATE REVIEW
export const updateReview = async (id, data) => {
  const response = await api.put(`/reviews/${id}`, data);
  return response.data;
};

// DELETE REVIEW
export const deleteReview = async (id) => {
  const response = await api.delete(`/reviews/${id}`);
  return response.data;
};

// MARK HELPFUL
export const markReviewHelpful = async (reviewId) => {
  const response = await api.put(
    `/reviews/${reviewId}/helpful`
  );
  return response.data;
};

// CHECK REVIEW ELIGIBILITY
export const checkReviewEligibility = async (bookId) => {
  const response = await api.get(
    `/reviews/eligible/${bookId}`
  );
  return response.data;
};

// Get All Reviews (Admin)
export const getAllReviews = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/reviews/admin?${query}`);
  return res.data;
};

// Hide Review (Admin)
export const hideReview = async (id) => {
  await api.put(`/reviews/${id}/hide`);
};

// Restore Review (Admin)
export const restoreReview = async (id) => {
  await api.put(`/reviews/${id}/restore`);
};


// Seller - Get Own Reviews
export const getSellerReviews = async () => {
  const res = await api.get("/reviews/seller");
  return res.data;
};

// Seller Reply
export const replyToReview = async (id, data) => {
  const res = await api.put(`/reviews/${id}/reply`, data);
  return res.data;
};

// Seller Report
export const reportReview = async (id, data) => {
  const res = await api.patch(`/reviews/${id}/report`, data);
  return res.data;
};

// Unflag a review
export const unflagReview = async (id) => {
  const res = await api.patch(`/reviews/${id}/unflag`);
  return res.data;
};

// Delete a reply
export const deleteReviewReply = async (id) => {
  const res = await api.delete(`/reviews/${id}/reply`);
  return res.data;
};

// Update a Seller Reply
export const updateReviewReply = async (id, data) => {
  const res = await api.put(`/reviews/${id}/reply`, data);
  return res.data;
};

// User requests to unhide a review
export const requestReviewUnhide = async (id) => {
  const res = await api.post(`/reviews/${id}/request-unhide`);
  return res.data;
};