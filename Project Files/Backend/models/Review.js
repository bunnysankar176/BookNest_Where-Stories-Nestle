const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String
  },

  // Helpful system
  helpful: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  // Moderation Status
  status: {
    type: String,
    enum: ["visible", "hidden", "flagged"],
    default: "visible"
  },

  // Seller Reply
  sellerReply: {
    text: String,
    repliedAt: Date,
    updatedAt: Date // Added to support editing replies
  },

  // Report Info (Used by both Sellers and Users)
  report: {
    reported: {
      type: Boolean,
      default: false
    },
    reason: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // Added so admins know who reported it
    },
    reportedAt: Date
  },

  // Unhide Request System (Used by Users)
  unhideRequested: {
    type: Boolean,
    default: false
  },
  unhideRequestedAt: {
    type: Date
  },

  // Admin Moderation Info
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  moderatedAt: Date

}, { timestamps: true });

// Prevent multiple reviews on the same book by the same user
reviewSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);