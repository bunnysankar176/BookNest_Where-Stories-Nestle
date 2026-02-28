const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/* ===============================
   ADDRESS SUB-SCHEMA
================================= */
const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },

    line1: { type: String, required: true },
    line2: { type: String },

    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },

    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

/* ===============================
   USER SCHEMA (FINAL CLEAN)
================================= */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: function () {
        return this.role === "seller" ? "pending" : "approved";
      },
    },

    avatar: { type: String },

    addresses: [addressSchema],
  },
  { timestamps: true }
);



/* ===============================
   PASSWORD HASHING
================================= */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
