const express = require("express");
const {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart 
} = require("../controllers/cartController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const router = express.Router();

// Wrapper for async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.use(protect);
router.use(authorizeRoles("user"));

// User cart
router.get("/", asyncHandler(getCart));
router.post("/", asyncHandler(addToCart));
router.put("/:id", asyncHandler(updateCartItem));
router.delete("/:id", asyncHandler(removeFromCart));
router.delete("/", asyncHandler(clearCart));


module.exports = router;
