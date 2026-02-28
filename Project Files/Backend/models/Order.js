const mongoose = require("mongoose");

/* ===============================
   📦 ORDER ITEM SCHEMA
================================= */
const orderItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },

price: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: [
      "pending",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled"
    ],
    default: "pending",
  },

  trackingNumber: String,
  courierPartner: String,

  shippedAt: Date,
  deliveredAt: Date,
  expectedDelivery: Date,
});

/* ===============================
   🧾 MAIN ORDER SCHEMA
================================= */
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [orderItemSchema],

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
      ],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["Card", "UPI", "COD"],
      default: "Card",
    },

    addressRef: {
      type: mongoose.Schema.Types.ObjectId,
    },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, required: true },
    },
  },
  { timestamps: true }
);

/* ===============================
   🔢 AUTO GENERATE ORDER NUMBER
================================= */
orderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    this.orderNumber = "ORD-" + Date.now();
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);