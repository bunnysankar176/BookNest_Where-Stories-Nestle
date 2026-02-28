const Book = require("../models/Book");
const cloudinary = require("../config/cloudinary");

// ----------------- Public -----------------
// 1. Get Books (With Server-Side Pagination, Filtering, and Sorting)
exports.getAllBooks = async (req, res) => {
  try {
    // 1. Set up Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // 2. Build the MongoDB Filter Query
    let query = { isActive: true };

    // Search by title or author
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { author: { $regex: req.query.search, $options: "i" } }
      ];
    }

    // Filter by Category (Handles partial matches if stored as comma-separated strings)
    if (req.query.category && req.query.category !== "all") {
      query.category = { $regex: req.query.category, $options: "i" };
    }

    // Filter by Genre
    if (req.query.genre && req.query.genre !== "all") {
      query.genre = { $regex: req.query.genre, $options: "i" };
    }

    // Filter by Price Range
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Filter by Minimum Rating 
    if (req.query.minRating && Number(req.query.minRating) > 0) {
      query.averageRating = { $gte: Number(req.query.minRating) }; 
    }

    // 3. Build the MongoDB Sort Object
    let sortObj = { createdAt: -1 }; // Default: Newest first
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case "oldest": sortObj = { createdAt: 1 }; break;
        case "price-low": sortObj = { price: 1 }; break;
        case "price-high": sortObj = { price: -1 }; break;
        case "rating": sortObj = { ratingsAverage: -1 }; break;
      }
    }

    // 4. Execute queries concurrently for max speed
    const [books, totalBooks] = await Promise.all([
      Book.find(query)
        .populate("seller", "name email")
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Book.countDocuments(query)
    ]);

    // Apply low stock flag
    const booksWithStockFlag = books.map(book => ({
      ...book.toObject(),
      isLowStock: book.stock <= (book.lowStockThreshold || 5) // Added a fallback of 5
    }));

    // Send the paginated payload
    res.json({
      books: booksWithStockFlag,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit),
      totalBooks
    });

  } catch (error) {
    console.error("Get All Books Error:", error);
    res.status(500).json({ message: "Failed to fetch books" });
  }
};

// 2. Get Unique Filters for the Sidebar
exports.getBookFilters = async (req, res) => {
  try {
    // Use MongoDB's 'distinct' command to instantly grab unique values
    const [categories, genres] = await Promise.all([
      Book.distinct("category", { isActive: true }),
      Book.distinct("genre", { isActive: true })
    ]);

    // Clean up comma-separated values (e.g., if a book has genre: "Fiction, Fantasy")
    const cleanCategories = [...new Set(categories.flatMap(c => c ? c.split(',').map(s => s.trim()) : []))].filter(Boolean).sort();
    const cleanGenres = [...new Set(genres.flatMap(g => g ? g.split(',').map(s => s.trim()) : []))].filter(Boolean).sort();

    res.json({ categories: cleanCategories, genres: cleanGenres });
  } catch (error) {
    console.error("Fetch Filters Error:", error);
    res.status(500).json({ message: "Failed to fetch filters" });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findOne({
  _id: req.params.id,
  isActive: true
}).populate("seller", "name email");
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({
  ...book.toObject(),
  isLowStock: book.stock <= book.lowStockThreshold
});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch book" });
  }
};

// ----------------- Protected (Seller/Admin) -----------------
exports.createBook = async (req, res) => {
  try {
    let { title, author, category, genre, price, description, stock } = req.body;

    // ✅ Parse genre (METHOD 1)
    if (genre && typeof genre === "string") {
      genre = JSON.parse(genre);
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Images are required" });
    }

    const images = req.files.map(file => ({
      url: file.path,
      public_id: file.filename
    }));

    const book = await Book.create({
      title,
      author,
      category,
      genre,
      price,
      description,
      stock,
      images,
      seller: req.user.id
    });

    await book.populate("seller", "name email");

    res.status(201).json({ message: "Book added successfully", book });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create book" });
  }
};


// Update book
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // -------- AUTH CHECK --------
    if (
      req.user.role === "seller" &&
      book.seller.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // -------- BASIC FIELDS --------
    const allowedFields = [
      "title",
      "author",
      "category",
      "price",
      "description",
      "stock"
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        book[field] = req.body[field];
      }
    });

    // -------- SAFE GENRE PARSE --------
    if (req.body.genre) {
      try {
        book.genre =
          typeof req.body.genre === "string"
            ? JSON.parse(req.body.genre)
            : req.body.genre;
      } catch (err) {
        return res.status(400).json({ message: "Invalid genre format" });
      }
    }

    // -------- REMOVE IMAGES --------
    if (req.body.removeImages) {
      let imagesToRemove;

      try {
        imagesToRemove =
          typeof req.body.removeImages === "string"
            ? JSON.parse(req.body.removeImages)
            : req.body.removeImages;
      } catch (err) {
        return res.status(400).json({ message: "Invalid removeImages format" });
      }

      for (const img of imagesToRemove) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }

      book.images = book.images.filter(
        img => !imagesToRemove.some(r => r.public_id === img.public_id)
      );
    }

    // -------- ADD NEW IMAGES --------
    const MAX_IMAGES = 5;

    if (req.files && req.files.length > 0) {
      if (book.images.length + req.files.length > MAX_IMAGES) {
        return res.status(400).json({
          message: `Maximum ${MAX_IMAGES} images allowed`
        });
      }

      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "books"
        });

        book.images.push({
          url: result.secure_url,
          public_id: result.public_id,
          isCover: false
        });
      }
    }

    // -------- REORDER IMAGES SAFELY --------
    if (req.body.reorderImages) {
      let reordered;

      try {
        reordered =
          typeof req.body.reorderImages === "string"
            ? JSON.parse(req.body.reorderImages)
            : req.body.reorderImages;
      } catch (err) {
        return res.status(400).json({ message: "Invalid reorderImages format" });
      }

      if (Array.isArray(reordered)) {
        const imageMap = new Map(
          book.images.map(img => [img.public_id, img])
        );

        const orderedImages = reordered
          .map(r => imageMap.get(r.public_id))
          .filter(Boolean);

        const remainingImages = book.images.filter(
          img => !reordered.some(r => r.public_id === img.public_id)
        );

        book.images = [...orderedImages, ...remainingImages];
      }
    }

    // -------- SET COVER IMAGE --------
    if (req.body.coverImageId) {
      book.images.forEach(img => {
        img.isCover = img.public_id === req.body.coverImageId;
      });
    }

    // -------- AUTO FIX COVER --------
    const hasCover = book.images.some(img => img.isCover);
    if (!hasCover && book.images.length > 0) {
      book.images[0].isCover = true;
    }

    await book.save();

    res.json({
      message: "Book updated successfully",
      book
    });

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};



exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // Seller → only delete own book
    if (req.user.role === "seller" && book.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Delete images from Cloudinary
    if (book.images && book.images.length > 0) {
      for (const img of book.images) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }

    await book.deleteOne();

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Delete failed" });
  }
};

// ----------------- Seller/Admin Dashboard -----------------
exports.getBooksByRole = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let books;

    if (req.user.role === "admin") {
      books = await Book.find().populate("seller", "name email");
    } else if (req.user.role === "seller") {
      books = await Book.find({ seller: req.user.id }).populate("seller", "name email");
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Ensure seller is always defined for frontend
    const safeBooks = books.map(book => ({
      ...book._doc,
      seller: book.seller || { name: "Unknown" }
    }));

    res.json(safeBooks); // send array directly
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Failed to fetch books" });
  }
};


// Get related books by category
const mongoose = require("mongoose");

exports.getRelatedBooks = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Book ID" });
    }

    const currentBook = await Book.findById(id);

    if (!currentBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!currentBook.category) {
      return res.json([]);
    }

    const related = await Book.find({
  category: currentBook.category,
  isActive: true,
  _id: { $ne: currentBook._id }
}).limit(6);

    res.json(related);

  } catch (err) {
    console.error("Related Books Error:", err);
    res.status(500).json({ message: "Server error while fetching related books" });
  }
};


// Update book stock 
exports.updateBookStock = async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // ✅ Seller can only update their own books
    if (
      req.user.role === "seller" &&
      book.seller.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    book.stock = stock;

    await book.save();

    res.json({ message: "Stock updated successfully", book });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update stock" });
  }
};

// Toggle book active status (soft delete)
exports.toggleBookStatus = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Seller can only modify their own book
    if (
      req.user.role === "seller" &&
      book.seller.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    book.isActive = !book.isActive;

    await book.save();

    res.json({
      message: "Book status updated",
      book,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to update status" });
  }
};


// Get Curated Lists for the Homepage
exports.getHomepageData = async (req, res) => {
  try {
    const [newArrivals, mostReviewed, topRated, statsAgg, booksForFilters] = await Promise.all([
      // 1. Latest Additions
      Book.find({ isActive: true }).sort({ createdAt: -1 }).limit(12).populate("seller", "name"),

      // 2. Community Favorites
      Book.find({ isActive: true }).sort({ numReviews: -1 }).limit(10).populate("seller", "name"),

      // 3. Top Picks
      Book.find({ isActive: true }).sort({ averageRating: -1 }).limit(10).populate("seller", "name"),

      // 4. Global Stats (Total Books and Total Reviews)
      Book.aggregate([
        { $match: { isActive: true } },
        { 
          $group: { 
            _id: null, 
            totalBooks: { $sum: 1 }, 
            totalReviews: { $sum: { $ifNull: ["$numReviews", 0] } } // Change numReviews to ratingsCount if your schema uses that
          } 
        }
      ]),

      // 5. Lightweight list of books for building Category/Genre maps
      // We only fetch the necessary fields (_id, title, category, genre, images) to keep it fast
      Book.find({ isActive: true })
        .select('_id title category genre images coverImage') 
    ]);

    const stats = statsAgg.length > 0 ? statsAgg[0] : { totalBooks: 0, totalReviews: 0 };

    res.json({
      newArrivals,
      mostReviewed,
      topRated,
      stats,
      booksForFilters
    });

  } catch (error) {
    console.error("Homepage Data Error:", error);
    res.status(500).json({ message: "Failed to fetch homepage data" });
  }
};