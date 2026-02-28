const express = require("express");
const {
  getProfile,
  updateProfile,
  addAddress,
  getAddresses,
  setDefaultAddress,
  deleteAddress,
  updateAddress, // ✅ make sure this is imported
} = require("../controllers/profileController");

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

// Async wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes require login
router.use(protect);

/* ===============================
   PROFILE ROUTES
================================= */

router.get("/", asyncHandler(getProfile));

router.patch(
  "/",
  upload.single("avatar"),
  asyncHandler(updateProfile)
);

/* ===============================
   ADDRESS ROUTES (FINAL VERSION)
================================= */

// Get all addresses
router.get("/addresses", asyncHandler(getAddresses));

// Add new address
router.post("/addresses", asyncHandler(addAddress));

// Update address
router.put(
  "/addresses/:addressId",
  asyncHandler(updateAddress)
);

// Set default address
router.patch(
  "/addresses/:addressId/default",
  asyncHandler(setDefaultAddress)
);

// Delete address (protected default)
router.delete(
  "/addresses/:addressId",
  asyncHandler(deleteAddress)
);

module.exports = router;
