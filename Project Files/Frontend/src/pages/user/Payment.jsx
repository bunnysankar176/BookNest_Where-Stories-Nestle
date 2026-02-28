import { useContext, useState, useRef, useEffect } from "react";
import { CartContext } from "../../context/CartContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ShieldCheck, CreditCard, Lock, ArrowRight, AlertCircle, Package } from "lucide-react";
import * as orderService from "../../services/orderService";
import "../../styles/Payment.css";

function Payment() {
  const { clearCart, cancelCheckout } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const paymentCompleted = useRef(false);

  const {
  cartItems = [],
  totalPrice = 0,
  addressId = null
} = location.state || {};


  // Auto-unlock cart if user navigates away without paying
  useEffect(() => {
    return () => {
      if (!paymentCompleted.current) cancelCheckout();
    };
  }, [cancelCheckout]);

  const getBookImage = (book) =>
    book.coverImage?.trim() || book.image?.trim() || book.images?.[0]?.url || null;

  if (cartItems.length === 0) {
    return (
      <div className="payment-page">
        <div className="payment-empty">
          <Package size={52} color="var(--border)" />
          <h3>No items to pay for</h3>
          <p>Please add books to your cart first.</p>
          <Link to="/books" className="payment-browse-btn">
            Browse Books <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

const handleMockPayment = async () => {
  setLoading(true);
  setError("");

  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 1️⃣ Create pending order
    const createRes = await orderService.createOrder({
      addressId,
      paymentMethod: "Card"
    });

    const order = createRes.order;

    // 2️⃣ Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3️⃣ Confirm payment
    await orderService.confirmPayment(order._id);

    paymentCompleted.current = true;
    await clearCart();
    navigate("/user/orders");

  } catch (err) {
    console.error(err.response?.data || err);
    setError(err.response?.data?.message || "Payment failed.");
    setLoading(false);
  }
};


  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Reusable Pay Button Content
  const PayButtonContent = () => (
    <>
      {loading ? (
        <>
          <div className="payment-btn-spinner" />
          Processing...
        </>
      ) : (
        <>
          <Lock size={16} />
          Pay ₹{Number(totalPrice).toFixed(2)}
        </>
      )}
    </>
  );

  return (
    <div className="payment-page">
      <div className="payment-container">

        <div className="payment-heading">
          <h1>Complete Payment</h1>
          <p>{itemCount} item{itemCount !== 1 ? "s" : ""} · ₹{Number(totalPrice).toFixed(2)}</p>
        </div>

        <div className="payment-layout">

          {/* ── Left: Mock Card UI ── */}
          <div className="payment-main">
            <div className={`payment-card-section ${loading ? 'is-loading' : ''}`}>
              
              {/* === UNIQUE SKELETON: HOLOGRAPHIC SCANNER === */}
              {loading && (
                <div className="scan-overlay">
                  <div className="scan-beam"></div>
                  <div className="scan-text">
                    <ShieldCheck size={18} style={{ display: 'inline', marginBottom: '-3px', marginRight: '5px' }} />
                    Verifying Secure Payment...
                  </div>
                </div>
              )}

              <h2 className="payment-section-title">
                <CreditCard size={17} />
                Payment Method
              </h2>

              {/* Visual card */}
              <div className="mock-card-visual">
                <div className="mock-card-chip" />
                <div className="mock-card-number">•••• •••• •••• 4242</div>
                <div className="mock-card-row">
                  <div>
                    <span className="mock-card-sub">Card Holder</span>
                    <span className="mock-card-val">Demo User</span>
                  </div>
                  <div>
                    <span className="mock-card-sub">Expires</span>
                    <span className="mock-card-val">12 / 26</span>
                  </div>
                </div>
              </div>

              {/* Read-only mock inputs */}
              <div className="mock-inputs">
                <div className="mock-input-field">
                  <label>Card Number</label>
                  <input type="text" value="4242 4242 4242 4242" readOnly className="mock-input" />
                </div>
                <div className="mock-input-row">
                  <div className="mock-input-field">
                    <label>Expiry</label>
                    <input type="text" value="12 / 26" readOnly className="mock-input" />
                  </div>
                  <div className="mock-input-field">
                    <label>CVV</label>
                    <input type="text" value="•••" readOnly className="mock-input" />
                  </div>
                </div>
              </div>

              <div className="payment-mock-notice">
                <Lock size={13} />
                <span>This is a demo payment page. No real transaction will occur.</span>
              </div>
            </div>
          </div>

          {/* ── Right: Order Summary + Pay ── */}
          <div className="payment-sidebar">

            <div className="payment-summary-card">
              <h2 className="payment-section-title">
                <Package size={17} />
                Order Summary
              </h2>

              <div className="payment-items">
                {cartItems.map((item) => {
                  const book = item.book;
                  const img = getBookImage(book);
                  return (
                    <div key={item._id || book._id} className="payment-item">
                      <div className="payment-item-image">
                        {img ? (
                          <img src={img} alt={book.title} />
                        ) : (
                          <div className="payment-item-placeholder">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="payment-item-info">
                        <span className="payment-item-title">{book.title}</span>
                        <span className="payment-item-qty">Qty: {item.quantity}</span>
                      </div>
                      <span className="payment-item-price">
                        ₹{(book.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="payment-divider" />

              <div className="payment-price-rows">
                <div className="payment-price-row">
                  <span>Subtotal</span>
                  <span>₹{Number(totalPrice).toFixed(2)}</span>
                </div>
                <div className="payment-price-row">
                  <span>Shipping</span>
                  <span className="payment-free">Free</span>
                </div>
              </div>

              <div className="payment-divider" />

              <div className="payment-total">
                <span>Total</span>
                <span className="payment-total-value">₹{Number(totalPrice).toFixed(2)}</span>
              </div>
            </div>

            {/* Trust */}
            <div className="payment-trust">
              <div className="payment-trust-item">
                <ShieldCheck size={14} />
                <span>Secure & encrypted checkout</span>
              </div>
              <div className="payment-trust-item">
                <Package size={14} />
                <span>Free delivery on all orders</span>
              </div>
            </div>

            {/* Inline error */}
            {error && (
              <div className="payment-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Desktop Pay Button (Hidden on Mobile via CSS) */}
            <button
              className="payment-pay-btn"
              onClick={handleMockPayment}
              disabled={loading}
            >
              <PayButtonContent />
            </button>

          </div>
        </div>
      </div>

      {/* MOBILE STICKY FOOTER (Visible only on Mobile via CSS) */}
      <div className="mobile-sticky-footer display-mobile-only">
        <button
          className="payment-pay-btn"
          onClick={handleMockPayment}
          disabled={loading}
        >
          <PayButtonContent />
        </button>
      </div>

    </div>
  );
}

export default Payment;