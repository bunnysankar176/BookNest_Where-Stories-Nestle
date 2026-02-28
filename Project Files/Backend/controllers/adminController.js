const User = require("../models/User");
const Book = require("../models/Book");

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Get all sellers
exports.getSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller" }).select("-password");
  res.json(sellers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sellers" });
  }
};

// Get site stats
exports.getStats = async (req, res) => {
  const totalUsers = await User.countDocuments({ role: "user" });
  const totalSellers = await User.countDocuments({ role: "seller" });
  const totalBooks = await Book.countDocuments();
  res.json({ totalUsers, totalSellers, totalBooks });
};


// Approve seller accounts
exports.approveSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (seller.status === "approved") {
      return res.status(400).json({ message: "Seller already approved" });
    }

    seller.status = "approved";
    await seller.save();

    res.json({ message: "Seller approved successfully", seller });
  } catch (error) {
    res.status(500).json({ message: "Approval failed" });
  }
};

// Reject seller accounts
exports.rejectSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.status = "rejected";
    await seller.save();

    res.json({ message: "Seller rejected successfully", seller });
  } catch (error) {
    res.status(500).json({ message: "Rejection failed" });
  }
};

// Admin adds a new user
exports.adminAddUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "user",
      status: "approved"
    });

    res.status(201).json(user);

  } catch (error) {
    res.status(500).json({ message: "Failed to create user" });
  }
};

// Admin updates accounts (both users and sellers)
exports.adminUpdateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    const allowedRoles = ["user", "seller"];

    if (req.body.role && !allowedRoles.includes(req.body.role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // ✅ Prevent duplicate email update
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });

      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }

      user.email = req.body.email;
    }

    // Update name if provided
    if (req.body.name) {
      user.name = req.body.name;
    }

    // Update role if provided
    if (req.body.role) {
      user.role = req.body.role;
    }

    await user.save();

    res.json(user);

  } catch (error) {
    console.error("Admin update error:", error);
    res.status(500).json({ message: "Failed to update account" });
  }
};

// Admin deletes a user
exports.adminDeleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "user") {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// Admin add sellers
exports.adminAddSeller = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const seller = await User.create({
      name,
      email,
      password,
      role: "seller",
      status: "approved"
    });

    res.status(201).json(seller);

  } catch (error) {
    res.status(500).json({ message: "Failed to create seller" });
  }
};


// Admin delete sellers
exports.adminDeleteSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" });
    }

    await seller.deleteOne();

    res.json({ message: "Seller deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Failed to delete seller" });
  }
};


// Get single account by ID (user or seller)
exports.getAccountById = async (req, res) => {
  try {
    const account = await User.findById(req.params.id).select("-password");

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json(account);

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch account" });
  }
};