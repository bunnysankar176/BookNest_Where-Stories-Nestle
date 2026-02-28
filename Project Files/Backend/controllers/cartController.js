const Cart = require("../models/Cart");
const Book = require("../models/Book");

// Helper function
const getPopulatedCartItems = async (userId) => {
  const updatedCart = await Cart.findOne({ user: userId })
    .populate("items.book");

  return updatedCart ? updatedCart.items : [];
};

// Get user cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate("items.book");

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    cart.items = cart.items.filter(item => item.book !== null);
    await cart.save();

    const totalAmount = cart.items.reduce((total, item) => {
      return total + (item.book.price * item.quantity);
    }, 0);

    res.json({
      items: cart.items,
      totalAmount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get cart" });
  }
};

// ✅ ADD TO CART (YOU WERE MISSING THIS)
exports.addToCart = async (req, res) => {
  const { bookId, quantity } = req.body;

  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    cart.items = cart.items.filter(item => item.book !== null);

    const existingItem = cart.items.find(
      item => item.book.toString() === bookId
    );

    const qty = quantity || 1;

    if (existingItem) {
      if (existingItem.quantity + qty > book.stock) {
        return res.status(400).json({ message: "Not enough stock available" });
      }
      existingItem.quantity += qty;
    } else {
      if (qty > book.stock) {
        return res.status(400).json({ message: "Not enough stock available" });
      }
      cart.items.push({ book: bookId, quantity: qty });
    }

    await cart.save();

    const items = await getPopulatedCartItems(req.user._id);
    res.json(items);

  } catch (error) {
    console.error("ADD TO CART ERROR:", error);
    res.status(500).json({ message: "Failed to add to cart" });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      item => item._id.toString() !== req.params.id
    );

    await cart.save();

    const items = await getPopulatedCartItems(req.user._id);
    res.json(items);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove item" });
  }
};

// Update quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { id } = req.params;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(
      item => item.book.toString() === id
    );

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (quantity > book.stock) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    item.quantity = quantity;
    await cart.save();

    const items = await getPopulatedCartItems(req.user._id);
    res.json(items);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update cart item" });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();

    res.json([]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to clear cart" });
  }
};


