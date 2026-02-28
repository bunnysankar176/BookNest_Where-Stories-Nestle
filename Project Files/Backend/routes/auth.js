const express = require("express");
const { loginUser, registerUser } = require("../controllers/authController");
const router = express.Router();

// Wrapper for async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post("/login", asyncHandler(loginUser));
router.post("/register", asyncHandler(registerUser));

module.exports = router;
