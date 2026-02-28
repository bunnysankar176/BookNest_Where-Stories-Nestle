const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Book = require("../models/Book");
const updateBookRatings = require("../utils/updateBookRatings");

// Add Review (User)
exports.addReview = async (req, res) => {
  try {
    const { bookId, rating, comment } = req.body;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    //  Check if user purchased the book
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      "items.book": bookId,
      status: "delivered"
    });

    if (!hasPurchased) {
      return res.status(400).json({ message: "You can only review purchased books" });
    }
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const review = await Review.create({
      user: req.user._id,
      book: bookId,
      seller: book.seller,
      rating,
      comment
    });

    await updateBookRatings(bookId); 

    res.status(201).json(review);
  } catch (error) {
  if (error.code === 11000) {
    return res.status(400).json({
      message: "You have already reviewed this book."
    });
  }

  console.error(error);
  res.status(500).json({ message: "Failed to add review" });
}
};


// Get Reviews for a Book
exports.getBookReviews = async (req, res) => {
  try {
    const { page = 1, limit = 5, sort = "newest" } = req.query;

    let sortOption = {};

    switch (sort) {
      case "highest":
        sortOption = { rating: -1 };
        break;
      case "lowest":
        sortOption = { rating: 1 };
        break;
      case "helpful":
        sortOption = { helpful: -1 };
        break;
      default:
        sortOption = { createdAt: -1 }; 
    }

    const skip = (page - 1) * limit;

    // 1. Base Query: Show visible reviews by default (for guests)
    let matchQuery = { 
      book: req.params.bookId, 
      status: "visible" 
    };

    // 2. If the user is logged in, show visible reviews OR their own hidden reviews
    if (req.user && req.user._id) {
      matchQuery = {
        book: req.params.bookId,
        $or: [
          { status: "visible" },
          { status: "hidden", user: req.user._id }
        ]
      };
    }

    const reviews = await Review.find(matchQuery)
      .populate("user", "name")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(matchQuery);

    res.json({
      reviews,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};



// Delete Review (Admin or Own User)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    // User can only delete their own review
   if (
  req.user.role === "user" &&
  review.user.toString() !== req.user._id.toString()
) {
  return res.status(403).json({ message: "Not authorized" });
}

    const bookId = review.book;
    await review.deleteOne();

    await updateBookRatings(bookId); 

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete review" });
  }
};


// Update Review (User)
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be between 1 and 5" });

    const review = await Review.findOne({ _id: req.params.reviewId, user: req.user._id });
    if (!review) return res.status(404).json({ message: "Review not found or not authorized" });

    review.rating = rating;
    review.comment = comment;
    await review.save();

    await updateBookRatings(review.book); 

    res.json({ message: "Review updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update review" });
  }
};


// Check if user can review a book
// checkReviewEligibility (Backend Controller)
exports.checkReviewEligibility = async (req, res) => {
  try {
    const { bookId } = req.params;
    const mongoose = require("mongoose");
    const bookObjectId = new mongoose.Types.ObjectId(bookId);

    // 1. Find ALL orders containing this book for this user
    const orders = await Order.find({
      user: req.user._id,
      "items.book": bookObjectId
    });

    // 2. If no orders found at all
    if (!orders || orders.length === 0) {
      return res.json({
        eligible: false,
        message: "Only customers who purchased this book can leave a review."
      });
    }

    // 3. Check if ANY of these orders/items are delivered (Case-Insensitive)
    let isDelivered = false;

    for (const order of orders) {
      // Check the parent order status
      if (order.status && order.status.toLowerCase() === "delivered") {
        isDelivered = true;
        break;
      }

      // Check the specific item's status in the array
      const item = order.items.find(i => i.book.toString() === bookId);
      if (item && item.status && item.status.toLowerCase() === "delivered") {
        isDelivered = true;
        break;
      }
    }

    if (isDelivered) {
      return res.json({ eligible: true });
    }

    // 4. Ordered, but none of them are marked delivered yet
    return res.json({
      eligible: false,
      message: "You can review this book once your order is delivered."
    });

  } catch (error) {
    console.error("Eligibility Error:", error);
    res.status(500).json({ message: "Failed to check eligibility" });
  }
};


// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findOneAndUpdate(
      {
        _id: req.params.reviewId,
        helpfulUsers: { $ne: req.user._id }
      },
      {
        $inc: { helpful: 1 },
        $push: { helpfulUsers: req.user._id }
      },
      { new: true }
    );

    if (!review) {
      return res.status(400).json({
        message: "Already marked helpful or review not found"
      });
    }

    res.json(review);

  } catch (error) {
    res.status(500).json({ message: "Failed to mark helpful" });
  }
};


// Get Rating Distribution for a Book
exports.getRatingDistribution = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid Book ID" });
    }

    const objectId = new mongoose.Types.ObjectId(bookId);

    const stats = await Review.aggregate([
      { $match: { book: objectId } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      }
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    stats.forEach((item) => {
      distribution[item._id] = item.count;
    });

    const totalReviews = Object.values(distribution)
      .reduce((sum, val) => sum + val, 0);

    const average =
      totalReviews > 0
        ? (
            Object.entries(distribution)
              .reduce((sum, [star, count]) => sum + star * count, 0)
            / totalReviews
          )
        : 0;

    res.status(200).json({
      average: Number(average.toFixed(1)),
      totalReviews,
      distribution
    });

  } catch (error) {
    console.error("Distribution Error:", error);
    res.status(500).json({
      message: "Failed to get rating distribution"
    });
  }
};


// Seller Reply to Review
exports.replyToReview = async (req, res) => {
  try {
    const { text } = req.body;

    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Seller can only reply to their own book's reviews
    if (
      req.user.role === "seller" &&
      review.seller.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    review.sellerReply = {
      text,
      repliedAt: new Date()
    };

    await review.save();

    res.json({ message: "Reply added successfully", review });

  } catch (error) {
    res.status(500).json({ message: "Failed to reply to review" });
  }
};

// User/Seller - Report a Review
exports.reportReview = async (req, res) => {
  try {
    const { reason } = req.body;

    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // If a seller is reporting, ensure they only report reviews on their own books
    if (
      req.user.role === "seller" &&
      review.seller.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Sellers can only report reviews on their own books." });
    }

    // Update the report object with the custom reason and who reported it
    review.report = {
      reported: true,
      reason: reason || "Inappropriate content flagged.",
      reportedBy: req.user._id, // Tracks who made the report
      reportedAt: new Date()
    };

    await review.save();

    res.json({ message: "Review reported successfully to admin" });

  } catch (error) {
    console.error("Report Review Error:", error);
    res.status(500).json({ message: "Failed to report review" });
  }
};


// Admin Hide Review
exports.hideReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.status = "hidden";
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();

    await review.save();

    res.json({ message: "Review hidden successfully" });

  } catch (error) {
    res.status(500).json({ message: "Failed to hide review" });
  }
};

// Admin Restore Review
exports.restoreReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.status = "visible";
    review.report = { reported: false };
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();

    await review.save();

    res.json({ message: "Review restored successfully" });

  } catch (error) {
    res.status(500).json({ message: "Failed to restore review" });
  }
};


// Admin - Get All Reviews
exports.getAllReviews = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status && status !== "all") {
      if (status === "flagged") {
        query["report.reported"] = true; // Query the report object instead
      } else {
        query.status = status;
      }
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find(query)
      .populate("user", "name email")
      .populate("book", "title")
      .populate("seller", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });

  } catch (error) {
    console.error("Admin Fetch Reviews Error:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

// Seller - Get Reviews of Their Own Books
exports.getSellerReviews = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { seller: req.user._id };

    if (status && status !== "all") {
      if (status === "flagged") {
        query["report.reported"] = true; // Query the report object instead
      } else {
        query.status = status;
      }
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find(query)
      .populate("user", "name email")
      .populate("book", "title images coverImage") 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });

  } catch (error) {
    console.error("Seller Fetch Reviews Error:", error);
    res.status(500).json({ message: "Failed to fetch seller reviews" });
  }
};

// Seller/Admin - Unflag a Review
exports.unflagReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    // Ensure the seller owns the book for this review
    if (req.user.role === "seller" && review.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Make sure it remains visible, and remove the report
    if (review.status !== "hidden") {
        review.status = "visible"; 
    }
    
    review.report = { reported: false };
    
    await review.save();
    res.json({ message: "Review unflagged successfully", review });
  } catch (error) {
    res.status(500).json({ message: "Failed to unflag review" });
  }
};

// Seller - Delete Reply
exports.deleteReply = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (req.user.role === "seller" && review.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Clear the seller reply
    review.sellerReply = { text: "" }; 
    
    await review.save();
    res.json({ message: "Reply deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete reply" });
  }
};

// Seller - Update an existing Reply
exports.updateReviewReply = async (req, res) => {
  try {
    const { text } = req.body;
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Security check: Seller can only update replies on their own books
    if (req.user.role === "seller" && review.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Make sure a reply actually exists to update
    if (!review.sellerReply || !review.sellerReply.text) {
      return res.status(400).json({ message: "No existing reply to update" });
    }

    // Update the text and set an updated timestamp
    review.sellerReply.text = text;
    review.sellerReply.updatedAt = new Date();

    await review.save();

    res.json({ message: "Reply updated successfully", review });
  } catch (error) {
    console.error("Update Reply Error:", error);
    res.status(500).json({ message: "Failed to update reply" });
  }
};


// User - Request Admin to Unhide Review
exports.requestReviewUnhide = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Security Check: Only the user who wrote the review can request an unhide
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to request unhide for this review" });
    }

    // Ensure the review is actually hidden before making a request
    if (review.status !== "hidden") {
      return res.status(400).json({ message: "This review is already visible." });
    }

    // Flag the review so admins can filter and see the request in their dashboard
    review.unhideRequested = true;
    review.unhideRequestedAt = new Date();

    await review.save();

    res.json({ message: "Unhide request submitted to admin successfully", review });

  } catch (error) {
    console.error("Unhide Request Error:", error);
    res.status(500).json({ message: "Failed to request review unhide" });
  }
};