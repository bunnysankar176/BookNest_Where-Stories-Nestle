const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "Looks like you already have an account with us! Please sign in to continue." });

  const user = await User.create({ name, email, password, role });
 res.status(201).json({
  message:
    role === "seller"
      ? "Registration successful. Wait for admin approval."
      : "Registration successful. Please login."
});
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "You are not registered. Please sign up first."
      });
    }

    // Seller approval check
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

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials. Please check your email or password."
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(user._id)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

