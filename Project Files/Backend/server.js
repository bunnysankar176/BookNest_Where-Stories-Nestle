const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/book");
const adminRoutes = require("./routes/admin");
const dashboardRoutes = require("./routes/dashboard");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const reviewRoutes = require("./routes/review");
const profileRoutes = require("./routes/profile");
const userAnalyticsRoutes = require("./routes/userAnalytics");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Log incoming requests for debugging
app.use((req, res, next) => {
  const auth = req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'NO_AUTH';
  console.log(`${new Date().toISOString()} -> ${req.method} ${req.originalUrl} [${auth}]`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/user", userAnalyticsRoutes);
app.get("/", (req, res) => {
  res.send("BookNest Backend Running");
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(error.status || 500).json({ 
    message: error.message || "Internal Server Error" 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
