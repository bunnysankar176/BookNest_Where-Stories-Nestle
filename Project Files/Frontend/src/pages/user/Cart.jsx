import { useContext } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Lock, ShoppingBag, ArrowLeft } from "lucide-react";
import { CartContext } from "../../context/CartContext";
import CartItem from "../../components/cart/CartItem";
import CartSummary from "../../components/cart/CartSummary";
import "../../styles/Cart.css";

function Cart() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    isCheckoutInProgress,
  } = useContext(CartContext);

  // Calculate total items
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  /* ── Empty State ── */
  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <div className="cart-empty-icon">
            <ShoppingBag size={40} strokeWidth={1.5} />
          </div>
          <h2 className="cart-empty-title">Your cart is empty</h2>
          <p className="cart-empty-subtitle">
            It looks like you haven't discovered our books yet.
          </p>
          <Link to="/books" className="btn-browse">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      
      {/* ── Header Section ── */}
      <div className="cart-header-section">
        <div className="cart-badge">
          <ShoppingCart size={14} strokeWidth={2.5} />
          <span>Your Bag</span>
        </div>
        
        <h1 className="cart-title">Shopping Cart</h1>
        <p className="cart-subtitle">
          You have <strong>{itemCount}</strong> items waiting for checkout.
        </p>

        {/* Lock Banner (if checkout active) */}
        {isCheckoutInProgress && (
          <div className="cart-lock-banner">
            <Lock size={16} />
            <span>
              Checkout is currently in progress. Your cart is locked.
            </span>
          </div>
        )}
      </div>

      {/* ── Main Grid Layout ── */}
      <div className="cart-container">
        
        {/* Left Column: Items */}
        <div className="cart-items-list">
          {cartItems.map((item, index) => (
            <div
              key={item._id}
              className="cart-item-wrapper"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CartItem
                item={item}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
                disabled={isCheckoutInProgress}
              />
            </div>
          ))}
          
         <Link to="/books" className="cart-continue-btn">
    <ArrowLeft size={16} />
    <span>Continue Shopping</span>
  </Link>
        </div>

        {/* Right Column: Summary */}
        <div className="cart-summary-col">
          <CartSummary
            totalPrice={totalPrice}
            clearCart={clearCart}
            disabled={isCheckoutInProgress}
            itemCount={itemCount}
          />
        </div>

      </div>
    </div>
  );
}

export default Cart;