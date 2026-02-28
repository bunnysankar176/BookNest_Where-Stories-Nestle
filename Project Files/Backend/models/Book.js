const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String },
    category: { type: String },
    genre: [{ type: String }],
    price: { type: Number, required: true },
    description: { type: String },
    stock: { type: Number, default: 0 },
    images: [
      {
        url: { type: String },
        public_id: { type: String },
        isCover: { type: Boolean, default: false }
      }
    ],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ✅ ADD THESE TWO FIELDS
    averageRating: {
      type: Number,
      default: 0
    },
    numReviews: {
      type: Number,
      default: 0
    },
    isActive: {
  type: Boolean,
  default: true
},

lowStockThreshold: {
  type: Number,
  default: 5
},

  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
