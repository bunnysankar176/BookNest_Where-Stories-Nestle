const Review = require("../models/Review");
const Book = require("../models/Book");

const updateBookRatings = async (bookId) => {
  const stats = await Review.aggregate([
    { $match: { book: bookId } },
    {
      $group: {
        _id: "$book",
        avgRating: { $avg: "$rating" },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  const book = await Book.findById(bookId);
  if (!book) return;

  if (stats.length > 0) {
    book.averageRating = Math.round(stats[0].avgRating * 10) / 10; // 1 decimal
    book.numReviews = stats[0].numReviews;
  } else {
    book.averageRating = 0;
    book.numReviews = 0;
  }

  await book.save();
};

module.exports = updateBookRatings;
