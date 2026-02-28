import { createContext, useState, useEffect, useContext  } from "react";
import { AuthContext } from "./AuthContext";
import {
  getCart,
  addToCart as addToCartService,
  removeFromCart as removeFromCartService,
  updateCartQuantity,
  clearCartService
} from "../services/cartService";
import useDebounce from "../hooks/useDebounce";


export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCheckoutInProgress, setIsCheckoutInProgress] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const { user } = useContext(AuthContext);

   const debouncedUpdate = useDebounce(
    async (bookId, quantity) => {
      try {
        await updateCartQuantity(bookId, quantity);
      } catch (err) {
        console.error("Failed to update quantity:", err);
        fetchCart();
      }
    },
    500
  );

  const cartCount = cartItems.reduce(
  (total, item) => total + item.quantity,
  0
);

const openMiniCart = () => setIsMiniCartOpen(true);
const closeMiniCart = () => setIsMiniCartOpen(false);


  // Fetch cart from backend on load
 const fetchCart = async () => {
  try {
    if (user?.role !== "user") return;

    const data = await getCart();
    setCartItems(data.items ?? []);
  } catch (err) {
    console.error("Failed to fetch cart:", err);
  }
};

useEffect(() => {
  if (user?.role === "user") {
    fetchCart();
  } else {
    setCartItems([]);
  }
}, [user]);

const addToCart = async (book, quantity = 1) => {
  if (isCheckoutInProgress) return;
  if (user?.role !== "user") return;

  const existingItem = cartItems.find(
    item => item.book._id === book._id
  );

  const currentQty = existingItem ? existingItem.quantity : 0;

  // Prevent exceeding stock
  if (currentQty + quantity > book.stock) {
    alert(`Only ${book.stock - currentQty} more available in stock`);
    return { success: false, message: "Stock limit reached" };
  }

  const previousCart = cartItems;

  // OPTIMISTIC UPDATE (instant UI)
  if (existingItem) {
    setCartItems(prev =>
      prev.map(item =>
        item.book._id === book._id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      )
    );
  } else {
    setCartItems(prev => [
      ...prev,
      {
        _id: `temp-${Date.now()}`, 
        book,
        quantity
      }
    ]);
  }

  setIsMiniCartOpen(true);

  try {
    await addToCartService(book._id, quantity);

    return { success: true };

  } catch (err) {
    console.error("Failed to add to cart:", err);

    // Rollback if API fails
    setCartItems(previousCart);

    return {
      success: false,
      message: err.response?.data?.message
    };
  }
};




 const removeFromCart = async (id) => {
  if (isCheckoutInProgress) return;

  if (user?.role !== "user") return;
  const previousCart = cartItems;
  setCartItems(cartItems.filter(item => item._id !== id));

  try {
    await removeFromCartService(id);
  } catch (err) {
    console.error("Failed to remove item:", err);
    // rollback if failed
    setCartItems(previousCart);
  }
};


const updateQuantity = (bookId, newQty) => {
  if (user?.role !== "user") return;
  if (isCheckoutInProgress) return;
  if (newQty < 1) return;

  const item = cartItems.find(i => i.book._id === bookId);
  if (!item) return;

  if (newQty > item.book.stock) {
    newQty = item.book.stock;
  }
  setCartItems(prev =>
    prev.map(i =>
      i.book._id === bookId
        ? { ...i, quantity: newQty }
        : i
    )
  );
  debouncedUpdate(bookId, newQty);
};



const clearCart = async () => {
  if (user?.role !== "user") return;
  try {
    const data = await clearCartService();
    setCartItems(data.items ?? []);
    setIsCheckoutInProgress(false);
  } catch (err) {
    console.error("Failed to clear cart:", err);
  }
};


  // Mark checkout in progress
  const startCheckout = () => setIsCheckoutInProgress(true);
  const cancelCheckout = () => setIsCheckoutInProgress(false);

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.book.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        cartCount,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        isCheckoutInProgress,
        startCheckout,
        cancelCheckout,
        isMiniCartOpen,
        openMiniCart,
        closeMiniCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
