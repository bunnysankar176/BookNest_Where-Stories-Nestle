import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ImageOff } from "lucide-react";

function CartItem({ item, removeFromCart, updateQuantity, disabled }) {
  const book = item.book;

  const imageUrl =
    book.coverImage?.trim() ||
    book.image?.trim() ||
    book.images?.[0]?.url ||
    null;

  // Calculate subtotal
  const subTotal = (book.price * item.quantity).toFixed(2);

  return (
    <div className={`cart-item${disabled ? " cart-item--disabled" : ""}`}>
      
      {/* 1. Book Cover */}
      <Link to={`/books/${book._id}`} className="cart-item-image">
        {imageUrl ? (
          <img src={imageUrl} alt={book.title} />
        ) : (
          <div style={{ 
            width: '100%', height: '100%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#f1f5f9', color: '#cbd5e1' 
          }}>
            <ImageOff size={24} />
          </div>
        )}
      </Link>

      {/* 2. Item Info & Controls */}
      <div className="cart-item-info">
        
        {/* Top Row: Title/Author & Unit Price */}
        <div className="cart-item-top">
          <div>
            <Link to={`/books/${book._id}`} className="cart-item-title">
              {book.title}
            </Link>
            {book.author && (
              <p className="cart-item-author">by {book.author}</p>
            )}
          </div>
          <div className="cart-item-unit-price">
            ₹{book.price}
          </div>
        </div>

        {/* Bottom Row: Controls */}
        <div className="cart-item-bottom">
          
          {/* A. Pill Quantity Selector (Typing Enabled) */}
          <div className="cart-qty">
            <button
              className="qty-btn"
              disabled={disabled || item.quantity <= 1}
              onClick={() => updateQuantity(book._id, Math.max(1, item.quantity - 1))}
              aria-label="Decrease quantity"
            >
              <Minus size={14} strokeWidth={3} />
            </button>

            <input
              type="number"
              className="qty-input"
              value={item.quantity}
              min="1"
              max={book.stock}
              disabled={disabled}
              onChange={(e) => {
                let val = parseInt(e.target.value);
                // Allow empty string temporarily while typing, otherwise validate
                if (isNaN(val)) val = 1; 
                if (val < 1) val = 1;
                if (val > book.stock) val = book.stock;
                
                updateQuantity(book._id, val);
              }}
            />

            <button
              className="qty-btn"
              disabled={disabled || item.quantity >= book.stock}
              onClick={() => updateQuantity(book._id, Math.min(book.stock, item.quantity + 1))}
              aria-label="Increase quantity"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>

  
   {/* In CartItem.jsx */}
<div className="cart-item-subtotal">
  <span className="subtotal-label-mobile">Total:</span> 
  ₹{subTotal}
</div>

          {/* C. Remove Button */}
          <button
            className="cart-remove-btn"
            disabled={disabled}
            onClick={() => removeFromCart(item._id)}
            title="Remove item"
          >
            <Trash2 size={16} />
            <span>Remove</span>
          </button>
          
        </div>
      </div>
    </div>
  );
}

export default CartItem;