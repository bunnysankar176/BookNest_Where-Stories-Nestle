import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { Link } from "react-router-dom";
import { X, ShoppingBag, Trash2, ArrowRight, Minus, Plus } from "lucide-react";
import "../styles/MiniCart.css";

function MiniCart() {
  const {
    cartItems,
    totalPrice,
    isMiniCartOpen,
    closeMiniCart,
    removeFromCart,
    updateQuantity
  } = useContext(CartContext);

  if (!isMiniCartOpen) return null;

  const getBookImage = (book) => {
    return (
      book.coverImage?.trim() ||
      book.image?.trim() ||
      book.images?.[0]?.url ||
      null
    );
  };

  return (
    <>
      <div className="mini-cart-overlay" onClick={closeMiniCart}></div>
      
      <div className="mini-cart">
        {/* Header */}
        <div className="mini-cart-header">
          <div className="header-title">
            <h3>Your Bag</h3>
            <span className="cart-count-badge">{cartItems.length}</span>
          </div>
          <button className="close-btn" onClick={closeMiniCart}>
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="mini-cart-scroll-area">
          {cartItems.length === 0 ? (
            <div className="mc-empty">
              <div className="mc-empty-icon">
                <ShoppingBag size={40} strokeWidth={1.5} />
              </div>
              <h4>Your cart is empty</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Looks like you haven't found your story yet.
              </p>
              <Link to="/books" className="mc-browse-btn" onClick={closeMiniCart}>
                Start Exploring
              </Link>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => {
                const book = item.book;
                const image = getBookImage(book);
                const itemTotal = (book.price * item.quantity).toFixed(2);

                return (
                  <div key={item._id} className="mc-item">
                    {/* Image */}
                    <Link 
                      to={`/books/${book._id}`} 
                      className="mc-image-link"
                      onClick={closeMiniCart}
                    >
                      {image ? (
                        <img src={image} alt={book.title} />
                      ) : (
                        <div style={{ width:'100%', height:'100%', background:'#f1f5f9' }} />
                      )}
                    </Link>

                    {/* Details */}
                    <div className="mc-details">
                      <div style={{ paddingRight: '20px' }}>
                        <Link 
                          to={`/books/${book._id}`} 
                          className="mc-title"
                          onClick={closeMiniCart}
                        >
                          {book.title}
                        </Link>
                        <p className="mc-author">{book.author}</p>
                      </div>

                      <div className="mc-controls">
                        {/* ── UPDATED QUANTITY PILL ── */}
                        <div className="mc-qty-pill">
                          <button
                            className="mc-qty-btn"
                            disabled={item.quantity <= 1}
                            onClick={() => updateQuantity(book._id, Math.max(1, item.quantity - 1))}
                          >
                            <Minus size={12} strokeWidth={3} />
                          </button>
                          
                          {/* Input Field */}
                          <input
                            type="number"
                            className="mc-qty-input"
                            value={item.quantity}
                            min="1"
                            max={book.stock}
                            onChange={(e) => {
                              let val = parseInt(e.target.value);
                              // Prevent invalid inputs (NaN or < 1)
                              if (isNaN(val) || val < 1) val = 1;
                              // Prevent exceeding stock
                              if (val > book.stock) val = book.stock;
                              
                              updateQuantity(book._id, val);
                            }}
                          />
                          
                          <button
                            className="mc-qty-btn"
                            disabled={item.quantity >= book.stock}
                            onClick={() => updateQuantity(book._id, Math.min(book.stock, item.quantity + 1))}
                          >
                            <Plus size={12} strokeWidth={3} />
                          </button>
                        </div>
                        {/* ── END UPDATED PILL ── */}

                        <div className="mc-price">₹{itemTotal}</div>
                      </div>
                    </div>

                    <button
                      className="mc-remove"
                      onClick={() => removeFromCart(item._id)}
                      title="Remove Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="mini-cart-footer">
            <div className="mc-summary-row">
              <span className="mc-total-label">Subtotal</span>
              <span className="mc-total-val">₹{totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="mc-actions">
              <Link 
                to="/user/cart" 
                className="btn-view-cart"
                onClick={closeMiniCart}
              >
                View Cart
              </Link>
              <Link 
                to="/user/checkout" 
                className="btn-checkout"
                onClick={closeMiniCart}
              >
                <span>Checkout</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MiniCart;