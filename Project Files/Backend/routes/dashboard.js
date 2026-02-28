const express = require("express");
const { getAdminDashboard, getSellerDashboard } = require("../controllers/dashboardController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Wrapper for async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require login
router.use(protect);

// Admin Dashboard
router.get("/admin", authorizeRoles("admin"), asyncHandler(getAdminDashboard));

// Seller Dashboard
router.get("/seller", authorizeRoles("seller"), asyncHandler(getSellerDashboard));

module.exports = router;
