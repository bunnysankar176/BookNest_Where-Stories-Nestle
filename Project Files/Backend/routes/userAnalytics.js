// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { getUserAnalytics } = require("../controllers/userAnalyticsController");


router.use(protect);
router.use(authorizeRoles("user"));
router.get("/analytics", getUserAnalytics);

module.exports = router;