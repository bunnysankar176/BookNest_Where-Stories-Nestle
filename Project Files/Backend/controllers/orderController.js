const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Book = require("../models/Book");
const User = require("../models/User");

// Create Order (Step 1 - Before Payment Success)
exports.createOrder = async (req, res) => {
  try {
    const { addressId, tempAddress, paymentMethod } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.book");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalAmount = 0;

    // ✅ Check stock only (do NOT reduce yet)
    for (const item of cart.items) {
      if (item.quantity > item.book.stock) {
        return res.status(400).json({
          message: `Not enough stock for "${item.book.title}". Available: ${item.book.stock}`,
        });
      }

      totalAmount += item.book.price * item.quantity;
    }

    /* =============================
       SHIPPING ADDRESS LOGIC
    ============================== */

    let shippingAddress = null;
    let addressRef = null;

    if (addressId) {
      const selectedAddress = user.addresses.id(addressId);
      if (!selectedAddress) {
        return res.status(404).json({ message: "Address not found" });
      }

      shippingAddress = { ...selectedAddress.toObject() };
      addressRef = selectedAddress._id;
    }

    if (!shippingAddress) {
      const defaultAddress = user.addresses.find(a => a.isDefault);
      if (defaultAddress) {
        shippingAddress = { ...defaultAddress.toObject() };
        addressRef = defaultAddress._id;
      }
    }

    if (!shippingAddress && tempAddress) {
      shippingAddress = tempAddress;
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "No shipping address available" });
    }

    /* =============================
       CREATE ORDER ITEMS (PENDING)
    ============================== */

    const orderItems = cart.items.map(item => ({
      book: item.book._id,
      seller: item.book.seller,
      quantity: item.quantity,
      price: item.book.price,
      status: "pending",
    }));

    /* =============================
       CREATE ORDER
    ============================== */

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: paymentMethod || "Card",
      addressRef,
      shippingAddress,
    });

    res.status(201).json({
      message: "Order created. Awaiting payment confirmation.",
      order,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// Confirm Payment (Step 2 - After Payment Success)
exports.confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId)
      .populate("items.book");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Payment already confirmed" });
    }

    // ✅ Update payment
    order.paymentStatus = "paid";
    order.status = "paid";

    // ✅ Update item statuses
    order.items.forEach(item => {
  item.status = "paid";
  item.expectedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  item.deliveredAt = null;
});

    // ✅ Reduce stock NOW (after payment success)
    for (const item of order.items) {
      await Book.findByIdAndUpdate(
        item.book._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // ✅ Clear cart
    const cart = await Cart.findOne({ user: order.user });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    await order.save();

    res.json({
      message: "Payment confirmed. Order placed successfully.",
      order,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Payment confirmation failed" });
  }
};



// Get orders of logged-in user
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("user", "name email")
      .populate("items.book", "title price images")
      .populate("items.seller", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


// Get orders for seller (books that belong to this seller)
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      "items.book": { $exists: true }
    })
      .populate("user", "name email")
      .populate({
        path: "items.book",
        select: "title seller price images", 
        populate: { path: "seller", select: "name" } 
      })
      .sort({ createdAt: -1 });

    const sellerOrders = orders
      .map(order => {
        const sellerItems = order.items.filter(
          item => {
            const sellerId = item.book.seller._id ? item.book.seller._id.toString() : item.book.seller.toString();
            return item.book && sellerId === req.user._id.toString();
          }
        );

        if (sellerItems.length === 0) return null;

        return {
          _id: order._id,
          user: order.user,
          status: order.status,
          createdAt: order.createdAt,
          shippingAddress: order.shippingAddress, 
          totalAmount: sellerItems.reduce(
            (acc, item) => acc + item.book.price * item.quantity,
            0
          ),
          items: sellerItems
        };
      })
      .filter(order => order !== null);

    res.json(sellerOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch seller orders" });
  }
};


// Get all orders (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Bumped to 10 for better view
    const skip = (page - 1) * limit;

    const { search, status, date } = req.query; // ✅ Now accepting 'date' from frontend

    let filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    // ✅ FIX 1: Proper Timezone-Safe Date Filtering
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0); // Start of selected day
      
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999); // End of selected day

      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    if (search) {
      const users = await require("../models/User").find({
        name: { $regex: search, $options: "i" },
      });
      const userIds = users.map((u) => u._id);
      filter.user = { $in: userIds };
    }

    const totalOrders = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      // ✅ FIX 2: Populating the Seller Name deeply from the item's book
      .populate({
        path: "items.book",
        populate: { path: "seller", select: "name" }
      })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      orders,
    });
  } catch (error) {
    console.error("Admin Fetch Orders Error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


// Update order status (Seller/Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, itemId } = req.body; // ✅ Now tracking if an itemId was sent

    const allowedStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status update: ${status}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Cannot update a cancelled order" });
    }

  /* ================================
       SELLER LOGIC
    ================================== */
    if (req.user.role === "seller") {
      let sellerUpdated = false;
      for (const item of order.items) {
        // ✅ FIX: Now strictly checks if an itemId was sent, and only updates that specific item
        if (item.seller.toString() === req.user._id.toString() && (!itemId || item._id.toString() === itemId)) {
          item.status = status;
          if (status === "shipped") item.shippedAt = new Date();
          if (status === "delivered") item.deliveredAt = new Date();
          sellerUpdated = true;
        }
      }
      if (!sellerUpdated) return res.status(400).json({ message: "Item not found or does not belong to you." });
    }

    /* ================================
       ADMIN LOGIC (FIX 3: Item vs Bulk Update)
    ================================== */
    if (req.user.role === "admin") {
      if (itemId) {
        // Admin is updating a SINGLE item
        const item = order.items.find(i => i._id.toString() === itemId);
        if (!item) return res.status(404).json({ message: "Item not found in order" });
        
        item.status = status;
        if (status === "shipped") item.shippedAt = new Date();
        if (status === "delivered") item.deliveredAt = new Date();
      } else {
        // Admin is bulk-updating the WHOLE order
        order.status = status;
        for (const item of order.items) {
          item.status = status;
          if (status === "shipped" && !item.shippedAt) item.shippedAt = new Date();
          if (status === "delivered" && !item.deliveredAt) item.deliveredAt = new Date();
        }
      }
    }

/* ================================
       AUTO UPDATE PARENT ORDER STATUS
    ================================== */
    // Evaluate parent status if a child item was modified
    if (req.user.role === "seller" || itemId) {
      // Ignore cancelled items when calculating the overall order progress
      const activeItems = order.items.filter(item => item.status !== "cancelled");

      if (activeItems.length === 0) {
        order.status = "cancelled"; // All items were cancelled
      } else {
        const allDelivered = activeItems.every(item => item.status === "delivered");
        const allShippedOrDelivered = activeItems.every(item => item.status === "shipped" || item.status === "delivered");

        if (allDelivered) {
          order.status = "delivered";
        } else if (allShippedOrDelivered) {
          order.status = "shipped";
        } else {
          // If even one item is still pending/paid/processing, the whole order stays processing
          order.status = "processing"; 
        }
      }
    }

    await order.save();
    res.json(order);

  } catch (error) {
    console.error("Order Status Update Error:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};




// Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.book")
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Optional: Prevent other users from viewing someone else's order
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

// Cancel order (Supports Full and Partial Cancellation)
exports.cancelOrder = async (req, res) => {
  try {
    const { itemIds } = req.body; // Array of specific item _ids to cancel
    const order = await Order.findById(req.params.id).populate("items.book");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!itemIds || itemIds.length === 0) {
      return res.status(400).json({ message: "No items selected for cancellation" });
    }

    let cancelledCount = 0;

    // Loop through order items and cancel only the selected ones
    for (const item of order.items) {
      if (itemIds.includes(item._id.toString())) {
        const currentStatus = (item.status || "pending").toLowerCase();
        
        // Only allow cancelling if the item hasn't shipped yet
        if (['pending', 'paid', 'processing'].includes(currentStatus)) {
          item.status = "cancelled";
          
          // Restock the book
          if (item.book) {
            const book = await Book.findById(item.book._id);
            if (book) {
              book.stock += item.quantity;
              await book.save();
            }
          }
          cancelledCount++;
        }
      }
    }

    if (cancelledCount === 0) {
      return res.status(400).json({ message: "Selected items cannot be cancelled at this stage." });
    }

    // Check if ALL items in the order are now cancelled
    const activeItems = order.items.filter(i => i.status !== "cancelled");
    if (activeItems.length === 0) {
      order.status = "cancelled";
    }

    await order.save();
    res.json({ message: "Selected items cancelled successfully", order });

  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

