const express = require("express");
const {
  createOrder,
  getUserOrders,
  getSellerOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  cancelOrder,
  confirmPayment
} = require("../controllers/orderController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Wrapper for async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require login
router.use(protect);

// ADMIN ROUTES
router.get("/admin", authorizeRoles("admin"), asyncHandler(getAllOrders));

// USER ROUTES
router.post("/", authorizeRoles("user"), asyncHandler(createOrder));
router.get("/my-orders", authorizeRoles("user"), asyncHandler(getUserOrders));
router.post("/confirm-payment", authorizeRoles("user"), asyncHandler(confirmPayment));

// SELLER ROUTES
router.get("/seller", authorizeRoles("seller"), asyncHandler(getSellerOrders));

// USER CANCEL
router.patch("/:id/cancel", authorizeRoles("user"), asyncHandler(cancelOrder));

// SELLER / ADMIN UPDATE
router.put("/:id", authorizeRoles("seller", "admin"), asyncHandler(updateOrderStatus));

// SINGLE ORDER VIEW (USER, SELLER, ADMIN)
router.get("/:id", authorizeRoles("user", "seller", "admin"), asyncHandler(getOrderById));


module.exports = router;
