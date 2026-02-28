const express = require("express");
const {
  addReview,
  getBookReviews,
  deleteReview,
  updateReview,
  checkReviewEligibility,
  markHelpful,
  getRatingDistribution,
  replyToReview,
  requestReviewUnhide,
  reportReview,
  hideReview,
  restoreReview,
  getAllReviews,        
  getSellerReviews,
  deleteReply,
  unflagReview,
  updateReviewReply    
} = require("../controllers/reviewController");

// FIX: Import the new optionalAuth middleware
const { protect, authorizeRoles, optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Wrapper for async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// PUBLIC ROUTES

// Get rating distribution for a book
router.get(
  "/book/:bookId/distribution",
  asyncHandler(getRatingDistribution)
);

// FIX: Apply optionalAuth here! 
// Now, if you are logged in, the controller knows who you are and shows your hidden reviews.
router.get(
  "/book/:bookId", 
  optionalAuth, 
  asyncHandler(getBookReviews)
);


// All routes below require strict login
router.use(protect);


// Admin - Get All Reviews
router.get(
  "/admin",
  authorizeRoles("admin"),
  asyncHandler(getAllReviews)
);

// Seller - Get Own Book Reviews
router.get(
  "/seller",
  authorizeRoles("seller"),
  asyncHandler(getSellerReviews)
);

// Add review (only users)
router.post(
  "/",
  authorizeRoles("user"),
  asyncHandler(addReview)
);

// Delete a review
router.delete(
  "/:reviewId",
  authorizeRoles("admin","user"),
  asyncHandler(deleteReview)
);

// Update a review
router.put(
  "/:reviewId",
  authorizeRoles("user"),
  asyncHandler(updateReview)
);

// Mark review as helpful
router.put(
  "/:reviewId/helpful",
  authorizeRoles("user"),
  asyncHandler(markHelpful)
);

// Check if user can review a book 
router.get(
  "/eligible/:bookId",
  authorizeRoles("user"),
  asyncHandler(checkReviewEligibility)
);

// Seller reply to review
router.put(
  "/:reviewId/reply",
  authorizeRoles("seller", "admin"),
  asyncHandler(replyToReview)
);

// User requests to unhide a review  
router.post(
  "/:reviewId/request-unhide",
  authorizeRoles("user"),
  asyncHandler(requestReviewUnhide) 
);

// Report a review (User/Seller/Admin)
router.patch(
  "/:reviewId/report",
  authorizeRoles("user", "seller", "admin"), 
  asyncHandler(reportReview)
);

// Unflag a review (Admin/Seller)
router.patch("/:reviewId/unflag", 
   authorizeRoles("seller", "admin"),
    asyncHandler(unflagReview));


// Delete a reply (Seller)
router.delete("/:reviewId/reply",  
  authorizeRoles("seller"), 
  asyncHandler(deleteReply));

// Update a review reply (Seller)
router.put("/:reviewId/reply", 
   authorizeRoles("seller"), 
asyncHandler(updateReviewReply));


// Hide a review (Admin only)
router.put(
  "/:reviewId/hide",
  authorizeRoles("admin"),
  asyncHandler(hideReview)
);

// Restore a hidden review (Admin only)
router.put(
  "/:reviewId/restore",
  authorizeRoles("admin"),
  asyncHandler(restoreReview)
);

module.exports = router;