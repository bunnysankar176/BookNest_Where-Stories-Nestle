const express = require("express");
const {
  getAllBooks,
  getBookFilters,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getBooksByRole,
  getRelatedBooks,
  updateBookStock,
  toggleBookStatus,
  getHomepageData

} = require("../controllers/bookController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const parser = require("../middleware/upload");

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ---------------- PUBLIC ----------------
router.get("/", asyncHandler(getAllBooks));
router.get('/homepage', asyncHandler(getHomepageData));
router.get('/filters', getBookFilters);
router.get("/:id/related", asyncHandler(getRelatedBooks));


// ---------------- PROTECTED ----------------
// Dashboard: Sellers see their books, Admins see all books
router.get(
  "/dashboard",
  protect,
  authorizeRoles("seller", "admin"),
  asyncHandler(getBooksByRole)
);

// Update stock (Seller can update own, Admin can update ANY)
router.put(
  "/:id/stock",
  protect,
  authorizeRoles("seller", "admin"),
  asyncHandler(updateBookStock)
);

// Toggle active status (Seller can toggle own, Admin can toggle ANY)
router.put(
  "/:id/status",
  protect,
  authorizeRoles("seller", "admin"),
  asyncHandler(toggleBookStatus)
);

// Seller & Admin can create
router.post(
  "/",
  protect,
  authorizeRoles("seller", "admin"),
  parser.array("images", 5),
  asyncHandler(createBook)
);

// Seller can update own, Admin can update ANY
router.put(
  "/:id",
  protect,
  authorizeRoles("seller", "admin"),
  parser.array("images", 5),
  asyncHandler(updateBook)
);

// Seller can delete own, Admin can delete ANY
router.delete(
  "/:id",
  protect,
  authorizeRoles("seller", "admin"),
  asyncHandler(deleteBook)
);

// Dynamic book by ID 
router.get("/:id", asyncHandler(getBookById));


module.exports = router;