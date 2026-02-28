import { useNavigate } from "react-router-dom";
import { ArrowRight, Trash2, CreditCard } from "lucide-react";

function CartSummary({ totalPrice, itemCount, clearCart, disabled }) {
  const navigate = useNavigate();

  return (
    <div className="summary-box">
      <h3 className="summary-title">Order Details</h3>

      {/* Rows */}
      <div className="summary-rows">
        <div className="summary-row">
          <span className="summary-row-label">
            Subtotal ({itemCount} items)
          </span>
          <span className="summary-row-value">₹{totalPrice.toFixed(2)}</span>
        </div>
        
        <div className="summary-row">
          <span className="summary-row-label">Shipping</span>
          <span className="summary-row-free">FREE</span>
        </div>
        
        <div className="summary-row">
          <span className="summary-row-label">Tax estimate</span>
          <span className="summary-row-value">Calculated at checkout</span>
        </div>
      </div>

      {/* Total */}
      <div className="summary-total">
        <span className="summary-total-label">Total Amount</span>
        <span className="summary-total-value">₹{totalPrice.toFixed(2)}</span>
      </div>

      {/* Action Buttons */}
      <button
        className="summary-checkout-btn"
        disabled={disabled}
        onClick={() => navigate("/user/checkout")}
      >
        <span>Checkout Now</span>
        <ArrowRight size={20} strokeWidth={2.5} />
      </button>

      <button
        className="summary-clear-btn"
        onClick={clearCart}
        disabled={disabled}
      >
        <Trash2 size={16} />
        <span>Clear Basket</span>
      </button>
      
      {/* Trust Badges (Optional Visual Flair) */}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px', justifyContent: 'center', opacity: 0.5 }}>
        <CreditCard size={24} />
      </div>
    </div>
  );
}

export default CartSummary;