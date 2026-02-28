const express = require("express");
const {
  getUsers,
  getSellers,
  getStats,
  approveSeller,
  rejectSeller,
  adminAddUser,
  adminDeleteUser,
  adminAddSeller,
  adminDeleteSeller,
  adminUpdateAccount,
  getAccountById
} = require("../controllers/adminController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const router = express.Router();

// Wrapper for async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.use(protect);
router.use(authorizeRoles("admin"));

router.get("/users", asyncHandler(getUsers));
router.get("/sellers", asyncHandler(getSellers));
router.get("/stats", asyncHandler(getStats));


router.put("/sellers/:id/approve", asyncHandler(approveSeller));
router.put("/sellers/:id/reject", asyncHandler(rejectSeller));

router.post("/users", asyncHandler(adminAddUser));
router.delete("/users/:id", asyncHandler(adminDeleteUser));

router.post("/sellers", asyncHandler(adminAddSeller));
router.delete("/sellers/:id", asyncHandler(adminDeleteSeller));
router.put("/accounts/:id", asyncHandler(adminUpdateAccount));
router.get("/accounts/:id", asyncHandler(getAccountById));

module.exports = router;
