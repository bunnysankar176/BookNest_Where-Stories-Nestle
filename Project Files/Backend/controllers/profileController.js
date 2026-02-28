const User = require("../models/User");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/cloudinary");

// GET logged-in user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};


// UPDATE logged-in user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password, avatarRemoved } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;

    if (avatarRemoved === "true" || avatarRemoved === true) {
      user.avatar = "";
    } else if (req.file) {
      user.avatar = req.file.path;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
};



// ADD NEW ADDRESS
exports.addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      line1,
      line2,
      city,
      state,
      pincode,
      country,
      isDefault,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If setting new address as default → remove old default
    if (isDefault) {
      user.addresses.forEach(addr => (addr.isDefault = false));
    }

    const newAddress = {
      fullName,
      phone,
      line1,
      line2,
      city,
      state,
      pincode,
      country,
      isDefault: isDefault || user.addresses.length === 0,
    };

    user.addresses.push(newAddress);

    await user.save();

    res.status(201).json({
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add address" });
  }
};


// GET USER ADDRESSES
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

// SET DEFAULT ADDRESS
exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address)
      return res.status(404).json({ message: "Address not found" });

    // Remove previous default
    user.addresses.forEach(addr => (addr.isDefault = false));

    address.isDefault = true;

    await user.save();

    res.json({
      message: "Default address updated successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update default address" });
  }
};


// DELETE ADDRESS
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address)
      return res.status(404).json({ message: "Address not found" });

    // 🔐 Prevent deleting default address
    if (address.isDefault) {
      return res.status(400).json({
        message: "Cannot delete default address. Set another address as default first.",
      });
    }

    address.deleteOne();
    await user.save();

    res.json({
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete address" });
  }
};



exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address)
      return res.status(404).json({ message: "Address not found" });

    Object.assign(address, req.body);

    await user.save();

    res.json({
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update address" });
  }
};
