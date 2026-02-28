import { useEffect, useState, useContext, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { getBookById, getRelatedBooks } from "../services/bookService";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { 
  Star, ShoppingCart, MessageSquarePlus, Package, ThumbsUp, 
  Trash2, Edit2, User, ChevronDown, ChevronUp, AlertTriangle, LogIn, MoreVertical,
  AlertCircle, CheckCircle, MessageCircle, Flag, X
} from "lucide-react";
import AddReview from "../components/reviews/AddReview";
import ReviewSummary from "../components/reviews/ReviewSummary";
import { 
  getBookReviews, deleteReview, markReviewHelpful, getRatingDistribution,
  reportReview, requestReviewUnhide 
} from "../services/reviewService";
import "../styles/BookDetails.css";
import "../styles/Reviews.css";

// --- SUB-COMPONENT: Individual Review Card ---
const ReviewCard = ({ 
  review, user, isOwner, isEditing, onEditClick, onDeleteClick, 
  onCancelEdit, refreshReviews, bookId, onReportClick, onRequestUnhide 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Seller Reply State
  const [showReplyPopup, setShowReplyPopup] = useState(false);
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);
  
  const reviewerName = review.user?.name || "Anonymous";
  const maxChars = 110; 
  const isLong = review.comment.length > maxChars;
  const displayText = isExpanded ? review.comment : review.comment.slice(0, maxChars) + (isLong ? "..." : "");

  // Seller Reply Logic
  const sellerReplyText = review.sellerReply?.text || review.reply?.message || "";
  const hasSellerReply = sellerReplyText.trim().length > 0;
  const maxReplyChars = 80;
  const isReplyLong = sellerReplyText.length > maxReplyChars;
  const displayReplyText = isReplyExpanded ? sellerReplyText : sellerReplyText.slice(0, maxReplyChars) + (isReplyLong ? "..." : "");

  if (isEditing) {
    return (
      <div className="review-card">
        <AddReview 
          bookId={bookId} 
          existingReview={review} 
          onReviewAdded={refreshReviews} 
          onDeleteReview={onDeleteClick}
          startInEditMode={true}
          onCancelEdit={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className={`review-card ${review.status === 'hidden' ? 'hidden-status' : ''}`}>
      
      {/* Hidden Review Banner for the Author */}
      {review.status === 'hidden' && (
        <div className="hidden-review-alert">
          <div className="hidden-alert-content">
            <AlertTriangle size={16} />
            <span>Admin hide this review for violating guidelines. Please edit it to comply.</span>
          </div>
          {isOwner && (
            <button className="btn-request-unhide" onClick={() => onRequestUnhide(review._id)}>
              Request Unhide
            </button>
          )}
        </div>
      )}

      <div className="review-header-row">
        <div className="user-meta">
          <div className="avatar-circle">
            {reviewerName !== "Anonymous" ? reviewerName.charAt(0).toUpperCase() : <User size={20}/>}
          </div>
          <div className="user-info">
            <h4>{reviewerName}</h4>
            <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="header-right-actions">
          <div className="card-stars">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" />
            ))}
          </div>

          {/* User Kebab Menu (Edit/Delete) */}
          {isOwner && (
            <div className="review-menu-container">
              <button 
                className="btn-kebab" 
                onClick={() => setMenuOpen(!menuOpen)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 200)}
              >
                <MoreVertical size={18} />
              </button>
              {menuOpen && (
                <div className="review-dropdown">
                  <button onMouseDown={(e) => { 
                    e.preventDefault(); onEditClick(); setMenuOpen(false); 
                  }}>
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onMouseDown={(e) => { 
                    e.preventDefault(); onDeleteClick(); setMenuOpen(false); 
                  }} className="danger-text">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Report Button (For non-owners if logged in) */}
          {!isOwner && user && (
             <button className="btn-report-flag" onClick={() => onReportClick(review._id)} title="Report this review">
               <Flag size={14} />
             </button>
          )}
        </div>
      </div>

      <div className="review-body">
        <p style={{ margin: 0, display: 'inline' }}>{displayText}</p>
        {isLong && (
          <button className="btn-read-more" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      <div className="review-footer-actions">
        <button 
          className={`btn-pill btn-helpful ${review.helpful > 0 ? 'active' : ''}`} 
          onClick={() => markReviewHelpful(review._id).then(refreshReviews)}
          disabled={review.status === 'hidden'} 
        >
          <ThumbsUp size={14} /> Helpful ({review.helpful || 0})
        </button>

        {/* SELLER REPLY PILL & POPUP */}
        {hasSellerReply && (
          <div className="seller-reply-wrapper">
            <button 
              className={`btn-pill btn-seller-reply ${showReplyPopup ? 'active' : ''}`}
              onClick={() => setShowReplyPopup(!showReplyPopup)}
            >
              <MessageCircle size={14} /> Seller Replied
            </button>
            
            {showReplyPopup && (
              <div className="seller-reply-popup">
                <div className="popup-header">
                  <strong>Seller Response</strong>
                  <button className="btn-close-popup" onClick={() => setShowReplyPopup(false)}><X size={14}/></button>
                </div>
                <p className="popup-body">
                  {displayReplyText}
                  {isReplyLong && (
                    <span className="btn-reply-read-more" onClick={() => setIsReplyExpanded(!isReplyExpanded)}>
                      {isReplyExpanded ? " Show less" : " Read more"}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { cartItems, addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("newest");
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [bookStats, setBookStats] = useState({ average: 0, count: 0 });
  const [deleteModal, setDeleteModal] = useState({ show: false, reviewId: null });
  
  // Report Modal State
  const [reportModal, setReportModal] = useState({ show: false, reviewId: null, reason: "", submitting: false });
  const [toastMessage, setToastMessage] = useState({ show: false, text: "", type: "success" });

  const [cartError, setCartError] = useState("");
  const [showAllReviews, setShowAllReviews] = useState(false); 
  const writeReviewRef = useRef(null); 

useEffect(() => {
    const fetchBookData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch the main book details
        const data = await getBookById(id);
        setBook(data);
        
        // 2. Fetch strictly the 5 related books from the backend
        const related = await getRelatedBooks(id);
        setRelatedBooks(related);
        
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    };
    
    if (id) { 
      fetchBookData(); 
      window.scrollTo(0, 0); 
    }
  }, [id]);

  useEffect(() => {
    const fetchReviewsAndStats = async () => {
      if (!id) return;
      try {
        setLoadingReviews(true);
        const data = await getBookReviews(id, { page, limit: 15, sort }); 
        setReviews(data.reviews || []);
        setTotalPages(data.totalPages || 1);
        
        const stats = await getRatingDistribution(id);
        setBookStats({ average: stats.average || 0, count: stats.totalReviews || 0 });
        
      } catch (err) { console.error(err); } finally { setLoadingReviews(false); }
    };
    fetchReviewsAndStats();
  }, [id, page, sort]);

  // Toast Helper
  const showToast = (text, type = "success") => {
    setToastMessage({ show: true, text, type });
    setTimeout(() => setToastMessage({ show: false, text: "", type: "success" }), 3000);
  };

  const existingCartQty = cartItems.find(item => item.book._id === book?._id)?.quantity || 0;
  const availableStock = (book?.stock || 0) - existingCartQty;
  const isMaxReached = availableStock <= 0;

  const handleQuantityChange = (e) => { 
    const val = e.target.value;
    if (val === "") { setQuantity(""); setCartError(""); return; }
    
    const num = parseInt(val);
    if (!isNaN(num) && num > 0) { 
      if(num <= availableStock) {
         setQuantity(num); setCartError("");
      } else { 
         setQuantity(availableStock);
         setCartError(`You already have ${existingCartQty} in cart. Only ${availableStock} more available.`);
      }
    }
  };

  const handleIncrement = () => {
    if (quantity < availableStock) { setQuantity(prev => (prev === "" ? 1 : prev) + 1); setCartError(""); } 
    else { setCartError(`Only ${availableStock} more available.`); }
  };

  const handleDecrement = () => {
    if (quantity > 1) { setQuantity(prev => prev - 1); setCartError(""); }
  };

  const handleAddToCart = async () => { 
    if (!user) { navigate('/login'); return; }
    setCartError(""); 
    const validQty = quantity === "" || quantity < 1 ? 1 : quantity;
    if (validQty > availableStock) { setCartError(`Only ${availableStock} more available.`); return; }
    const result = await addToCart(book, validQty);
    if (result?.success) { setAdded(true); setTimeout(() => setAdded(false), 2500); } 
    else { setCartError(result?.message || "Failed to add to cart"); }
  };

  const handleBlur = () => { if (quantity === "" || quantity < 1) setQuantity(1); };

  const getBookImages = (b) => { 
    const imgs = [];
    if (b.images?.length > 0) b.images.forEach(img => { if (typeof img === 'string') imgs.push(img); else if (img.url) imgs.push(img.url); });
    if (b.coverImage?.trim() && !imgs.includes(b.coverImage)) imgs.push(b.coverImage);
    if (b.image?.trim() && !imgs.includes(b.image)) imgs.push(b.image);
    return imgs;
  };

  const refreshReviews = async () => {
    const data = await getBookReviews(book._id, { page, limit: 15, sort });
    setReviews(data.reviews);
    setTotalPages(data.totalPages);
    setEditingReview(null);
    try {
        const stats = await getRatingDistribution(book._id);
        setBookStats({ average: stats.average || 0, count: stats.totalReviews || 0 });
    } catch (e) {}
  };

  const handleDeleteClick = (reviewId) => { setDeleteModal({ show: true, reviewId }); };
  const confirmDelete = async () => {
    try { 
      await deleteReview(deleteModal.reviewId); 
      await refreshReviews(); 
      setDeleteModal({ show: false, reviewId: null });
      showToast("Review deleted successfully.");
    } catch (err) { console.error(err); setDeleteModal({ show: false, reviewId: null }); }
  };

  // --- REPORT & UNHIDE LOGIC ---
  const handleRequestUnhide = async (reviewId) => {
    try {
      await requestReviewUnhide(reviewId); // Call to backend
      showToast("Unhide request sent to admin. It will be reviewed shortly.");
    } catch (err) {
      showToast("Failed to send request. Try again.", "error");
    }
  };

  const submitReport = async () => {
    if (!reportModal.reason.trim()) { showToast("Please provide a reason.", "error"); return; }
    try {
      setReportModal(prev => ({ ...prev, submitting: true }));
      await reportReview(reportModal.reviewId, { reason: reportModal.reason }); // Call to backend
      setReportModal({ show: false, reviewId: null, reason: "", submitting: false });
      showToast("Review reported successfully.");
    } catch (err) {
      setReportModal(prev => ({ ...prev, submitting: false }));
      showToast("Failed to report review.", "error");
    }
  };

  if (loading) return <div className="book-details-page"><div className="loading-state"><div className="spinner" /><p>Loading...</p></div></div>;
  if (!book) return <div className="book-details-page"><div className="error-state">Book not found</div></div>;

  const bookImages = getBookImages(book);
  const existingReview = reviews.find(r => {
    if (!user) return false;
    const reviewUserId = r.user?._id || r.user; 
    return reviewUserId === user._id;
  });
  
  const displayQty = quantity === "" ? 1 : quantity;
  const totalPrice = (book.price * displayQty).toFixed(2);
  const descriptionText = book.description || "";
  const isLongDescription = descriptionText.length > 140;
  const displayDescription = isExpanded || !isLongDescription ? descriptionText : descriptionText.slice(0, 140) + "...";

  return (
    <div className="book-details-page">
      
      {/* GLOBAL TOAST MESSAGE */}
      {toastMessage.show && (
        <div className={`global-toast toast-${toastMessage.type}`}>
          {toastMessage.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {toastMessage.text}
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon-wrapper"><AlertTriangle size={32} className="warning-icon" /></div>
            <h3>Delete Review?</h3>
            <p>Are you sure you want to delete your review? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setDeleteModal({ show: false, reviewId: null })}>Cancel</button>
              <button className="btn-modal-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportModal.show && (
        <div className="modal-overlay">
          <div className="modal-content report-modal">
            <h3>Report Review</h3>
            <p className="report-subtext">Let admin know why this review is inappropriate.</p>
            <textarea 
              placeholder="E.g., Contains spam, offensive language, or spoilers..."
              value={reportModal.reason}
              onChange={(e) => setReportModal({ ...reportModal, reason: e.target.value })}
              className="report-textarea"
              rows="4"
            />
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setReportModal({ show: false, reviewId: null, reason: "", submitting: false })}>Cancel</button>
              <button className="btn-modal-submit" onClick={submitReport} disabled={reportModal.submitting}>
                {reportModal.submitting ? "Sending..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <div className="book-details-wrapper">
            
           <div className="book-image-section">
             <div className="main-image">
               {bookImages.length > 0 ? <img src={bookImages[currentImageIndex]} alt={book.title} /> : <div className="image-placeholder">No Image</div>}
             </div>
             {bookImages.length > 1 && (
               <div className="thumbnail-gallery">
                 {bookImages.map((img, idx) => (
                   <button key={idx} className={`thumbnail ${currentImageIndex === idx ? 'active' : ''}`} onClick={() => setCurrentImageIndex(idx)}>
                     <img src={img} alt="thumb" />
                   </button>
                 ))}
               </div>
             )}
           </div>

           <div className="book-info-section">
             <div className="book-header">
                <h1 className="book-title">{book.title}</h1>
                <p className="book-author">by <span>{book.author}</span></p>
             </div>
             
             <div className="rating-row">
               <div className="rating-pill score-pill">
                 <Star size={14} fill="currentColor"/> 
                 <span>{bookStats.average.toFixed(1)} Rating</span>
               </div>
               <div className="rating-pill review-pill">
                 <MessageSquarePlus size={14}/> 
                 <span>{bookStats.count} Reviews</span>
               </div>
             </div>
             
             <div className="book-meta-grid">
               {book.category && (
                 <div className="meta-item">
                   <span className="meta-label">Category</span>
                   <span className="meta-value">{book.category}</span>
                 </div>
               )}
               {book.genre && (
                 <div className="meta-item">
                   <span className="meta-label">Genre</span>
                   <div className="genre-capsules">
                     {(Array.isArray(book.genre) ? book.genre : [book.genre]).map((g, idx) => (
                       <span key={idx} className="genre-capsule">{g}</span>
                     ))}
                   </div>
                 </div>
               )}
             </div>

             <div className="description-box">
                <span className="meta-label">Description</span>
                <p className="description-text">
                  {displayDescription}
                </p>
                {isLongDescription && (
                  <button className="read-more-btn" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <>Show Less <ChevronUp size={14}/></> : <>Read More <ChevronDown size={14}/></>}
                  </button>
                )}
             </div>

             <div className="price-dashboard">
                <div className="price-item">
                  <span className="price-label">Unit Price</span>
                  <span className="price-value main-price">₹{book.price}</span>
                </div>
                <div className="divider-v"></div>
                <div className="price-item">
                  <span className="price-label">Total Price</span>
                  <span className="price-value total-price">₹{totalPrice}</span>
                </div>
                <div className="divider-v"></div>
                <div className="price-item">
                  <span className="price-label">Availability</span>
                  <span className={`stock-value ${availableStock > 0 ? 'good' : 'out'}`}>
                    {availableStock > 0 ? <><Package size={14}/> {availableStock} Available</> : "Out of Stock"}
                  </span>
                </div>
             </div>

             {book.stock > 0 && (
               <div className="book-actions-wrapper">
                 <div className="book-actions">
                   <div className="quantity-box">
                     <div className="qty-controls">
                       <button disabled={isMaxReached} onClick={handleDecrement}>-</button>
                       <input 
                         type="number" 
                         disabled={isMaxReached} 
                         value={quantity} 
                         onChange={handleQuantityChange} 
                         onBlur={handleBlur} 
                       />
                       <button disabled={isMaxReached} onClick={handleIncrement}>+</button>
                     </div>
                   </div>
                   <button className="btn-add-cart" disabled={isMaxReached} onClick={handleAddToCart}>
                      {isMaxReached ? "Max Reached" : <><ShoppingCart size={18} /> Add to Cart</>}
                   </button>
                 </div>

                 {added && (
                   <div className="cart-success-toast">
                     <CheckCircle size={16} /> Added to cart!
                   </div>
                 )}
                 {cartError && (
                   <div className="cart-error-toast">
                     <AlertCircle size={16} /> {cartError}
                   </div>
                 )}

               </div>
             )}
           </div>
        </div>

        <div className="reviews-section">
          <h2>Customer Reviews <span className="review-count-badge">{reviews.length}</span></h2>
          <div className="reviews-grid-layout">
            <div className="reviews-sidebar">
              {book?._id && <ReviewSummary key={bookStats.count} bookId={book._id} />}
            </div>
            
          <div className="reviews-content-col">
              <div className="review-controls-bar">
                <div className="review-count-group">
                  <span className="review-count-label">
                    {reviews.length > 0 ? `Showing ${reviews.length} reviews` : "No reviews yet"}
                  </span>
                  {reviews.length > 3 && (
                    <button className="btn-toggle-all" onClick={() => setShowAllReviews(!showAllReviews)}>
                      {showAllReviews ? "Show less" : "See all"}
                    </button>
                  )}
                </div>

                <select className="sort-select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                  <option value="helpful">Most Helpful</option>
                </select>
              </div>

              {reviews.length === 0 ? (
                <div className="no-reviews">
                  <Star size={40} color="var(--border)" />
                  <p>No reviews yet. Be the first to verify this book!</p>
                </div>
              ) : (
                <>
                  <div className={`reviews-list-container ${!showAllReviews ? "layout-horizontal" : "layout-vertical"}`}>
                    {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => {
                      const reviewUserId = review.user?._id || review.user;
                      const isOwner = user && reviewUserId === user._id;
                      const isEditing = editingReview && editingReview._id === review._id;
                      
                      return (
                        <ReviewCard 
                          key={review._id}
                          review={review}
                          user={user}
                          isOwner={isOwner}
                          isEditing={isEditing}
                          onEditClick={() => setEditingReview(review)}
                          onDeleteClick={() => handleDeleteClick(review._id)}
                          onCancelEdit={() => setEditingReview(null)}
                          refreshReviews={refreshReviews}
                          bookId={book._id}
                          onReportClick={(id) => setReportModal({ show: true, reviewId: id, reason: "", submitting: false })}
                          onRequestUnhide={handleRequestUnhide}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="add-review-section" ref={writeReviewRef} id="review">
          <h2><MessageSquarePlus size={20} /> Write a Review</h2>
          {user ? (
            <AddReview 
              bookId={book._id} 
              existingReview={existingReview} 
              onReviewAdded={refreshReviews} 
              onDeleteReview={() => handleDeleteClick(existingReview?._id)} 
            />
          ) : (
            <div className="login-to-review">
              <p>Sign in to share your thoughts</p>
              <Link to="/login"><LogIn size={16} /> Login to Review</Link>
            </div>
          )}
        </div>

        {relatedBooks.length > 0 && (
           <div className="related-books-section">
             <h2>You May Also Like</h2>
             <div className="related-books-grid">
               {relatedBooks.map(rb => {
                 const rbImages = getBookImages(rb);
                 const imageSrc = rbImages.length > 0 ? rbImages[0] : null;
                 return (
                   <Link key={rb._id} to={`/books/${rb._id}`} className="related-book-card">
                     <div className="related-book-image">
                       {imageSrc ? <img src={imageSrc} alt={rb.title}/> : <div className="image-placeholder">No Img</div>}
                     </div>
                     <p className="related-book-title">{rb.title}</p>
                   </Link>
                 )
               })}
             </div>
           </div>
        )}
      </div>
    </div>
  );
}

export default BookDetails;