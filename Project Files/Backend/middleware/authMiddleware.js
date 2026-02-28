const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── Protect routes (JWT required) ──
exports.protect = async (req, res, next) => {
  let token;

  try {
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    if (user.role === "seller") {
      const status = user.status || "pending";

      if (status !== "approved") {
        return res.status(403).json({
          message:
            status === "rejected"
              ? "Your seller account was rejected by admin"
              : "Your seller account is pending approval"
        });
      }
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// ── Role-based access control ──
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
};

// ── Optional Auth (Does not block guests, but identifies logged-in users) ──
exports.optionalAuth = async (req, res, next) => {
  let token;

  try {
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      

      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch (error) {
  }

  next(); 
};