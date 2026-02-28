import { useEffect, useState, useMemo } from "react";
import { 
  getSellerReviews, 
  replyToReview, 
  reportReview, 
  unflagReview, 
  deleteReviewReply, 
  updateReviewReply 
} from "../../services/reviewService";
import { 
  MessageSquareText, Search, AlertTriangle, CheckCircle, 
  ChevronLeft, ChevronRight, Loader2, Star, Flag, Send, BookOpen, Edit2, Trash2, Undo2, Calendar
} from "lucide-react";
import "../../styles/SellerReviews.css";

// --- HELPER: GET BOOK IMAGE ---
const getBookImage = (book) => {
  if (!book) return null;
  if (typeof book.coverImage === 'string') return book.coverImage;
  if (book.coverImage?.url) return book.coverImage.url;
  if (book.images && book.images.length > 0) {
    return typeof book.images[0] === 'string' ? book.images[0] : book.images[0].url;
  }
  if (typeof book.image === 'string') return book.image;
  if (book.image?.url) return book.image.url;
  return null;
};

// --- SELLER REVIEW CARD COMPONENT ---
const SellerReviewCard = ({ review, refresh, showToast, onActionClick }) => {
  const existingReply = review.sellerReply?.text || review.reply?.message || "";
  const hasReply = existingReply.trim().length > 0;

  const [reply, setReply] = useState(existingReply);
  const [sending, setSending] = useState(false);
  const [isEditingReply, setIsEditingReply] = useState(false);
  
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);

  useEffect(() => {
    setReply(existingReply);
  }, [existingReply]);

  const isReported = review.status === 'flagged' || review.report?.reported;
  const avatarLetter = review.user?.name ? review.user.name.charAt(0).toUpperCase() : "?";

  const formattedDate = review.createdAt 
    ? new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : "Recently";

  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      setSending(true);
      if (hasReply) {
        await updateReviewReply(review._id, { text: reply });
        showToast("Your reply has been updated successfully.");
      } else {
        await replyToReview(review._id, { text: reply }); 
        showToast("Your reply has been published successfully.");
      }
      setIsEditingReply(false);
      refresh();
    } catch (err) {
      showToast("We encountered an issue saving your reply. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  const MAX_LENGTH = 140;
  
  const commentShouldTruncate = review.comment && review.comment.length > MAX_LENGTH;
  const displayedComment = isCommentExpanded || !commentShouldTruncate 
      ? review.comment 
      : review.comment.slice(0, MAX_LENGTH) + "...";

  const replyShouldTruncate = existingReply && existingReply.length > MAX_LENGTH;
  const displayedReply = isReplyExpanded || !replyShouldTruncate
      ? existingReply
      : existingReply.slice(0, MAX_LENGTH) + "...";

  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star 
        key={index} 
        size={14} 
        fill={index < review.rating ? "#F59E0B" : "transparent"} 
        color={index < review.rating ? "#F59E0B" : "#D1D5DB"} 
      />
    ));
  };

  return (
    <div className={`sr-card ${isReported ? 'sr-flagged-card' : ''}`}>
      {/* CARD HEADER */}
      <div className="sr-card-top">
        <div className="sr-user-meta">
          <div className="sr-avatar">{avatarLetter}</div>
          <div className="sr-user-text">
            <h4 className="sr-user-name">{review.user?.name || "Unknown Customer"}</h4>
            <div className="sr-user-date">
              <Calendar size={12} /> {formattedDate}
            </div>
          </div>
        </div>
        
        {/* FLAGGED PILL AT TOP RIGHT */}
        {isReported && (
          <div className="sr-flagged-badge-top">
            <span className="sr-flag-badge"><Flag size={12} fill="currentColor" /> FLAGGED</span>
          </div>
        )}
      </div>

      {/* RATING */}
      <div className="sr-rating-row">
        <div className="sr-stars">{renderStars()}</div>
        <span className="sr-rating-number">{Number(review.rating).toFixed(1)}</span>
      </div>
      
      {/* USER COMMENT */}
      <div className="sr-comment">
        "{displayedComment}"
        {commentShouldTruncate && (
          <span className="sr-read-more" onClick={() => setIsCommentExpanded(!isCommentExpanded)}>
            {isCommentExpanded ? "Show Less" : "Read More"}
          </span>
        )}
      </div>

      {/* SELLER REPLY UI */}
      {hasReply && !isEditingReply ? (
        <div className="sr-reply-display">
          <div className="sr-reply-header">
            <span className="sr-reply-title">Your Reply</span>
            <div className="sr-reply-actions-small">
              <button className="sr-action-edit" onClick={() => setIsEditingReply(true)}>
                <Edit2 size={12} /> Edit
              </button>
              <button className="sr-action-delete" onClick={() => onActionClick('deleteReply', review)}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
          <p className="sr-reply-text">
            {displayedReply}
            {replyShouldTruncate && (
              <span className="sr-read-more" onClick={() => setIsReplyExpanded(!isReplyExpanded)}>
                {isReplyExpanded ? "Show Less" : "Read More"}
              </span>
            )}
          </p>
        </div>
      ) : (
        <div className="sr-reply-box">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a public reply..."
            className="sr-textarea"
            rows="2"
          />
          <div className="sr-reply-actions">
            {hasReply && (
              <button className="sr-btn-cancel" onClick={() => { setIsEditingReply(false); setReply(existingReply); }}>
                Cancel
              </button>
            )}
            <button 
              className="sr-btn-reply" 
              onClick={handleReply} 
              disabled={sending || !reply.trim()}
            >
              {sending ? <Loader2 size={14} className="sr-spin" /> : <Send size={14} />} 
              {hasReply ? "Update" : "Post Reply"}
            </button>
          </div>
        </div>
      )}

      {/* ACTION BUTTONS (BOTTOM RIGHT ONLY) */}
      <div className="sr-card-actions">
        {isReported ? (
          <button className="sr-btn-action sr-btn-unflag" onClick={() => onActionClick('unflag', review)} title="Restore">
            <Undo2 size={14} strokeWidth={2.5} /> Unflag
          </button>
        ) : (
          <button className="sr-btn-action sr-btn-report" onClick={() => onActionClick('report', review)} title="Report review">
            <Flag size={14} strokeWidth={2.5} /> Report
          </button>
        )}
      </div>
    </div>
  );
};

// --- MAIN SELLER REVIEWS PAGE COMPONENT ---
const SellerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [booksPage, setBooksPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedBook, setSelectedBook] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [confirmModal, setConfirmModal] = useState({ show: false, actionType: null, review: null });

  useEffect(() => { fetchReviews(); }, []);
  useEffect(() => { setBooksPage(1); setReviewsPage(1); }, [searchTerm, filterType, selectedBook]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getSellerReviews();
      setReviews(data.reviews || data || []);
    } catch (err) {
      showToast("Failed to load reviews.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  const executeAction = async () => {
    const { actionType, review } = confirmModal;
    if (!review) return;

    try {
      if (actionType === 'report') {
        await reportReview(review._id, { reason: "Inappropriate content or spam flagged by seller" });
        showToast("Review reported.");
      } else if (actionType === 'unflag') {
        await unflagReview(review._id);
        showToast("The review has been restored.");
      } else if (actionType === 'deleteReply') {
        await deleteReviewReply(review._id);
        showToast("Your reply has been successfully removed.");
      }
      fetchReviews();
    } catch (err) {
      showToast("Action failed. Try again.", "error");
    } finally {
      setConfirmModal({ show: false, actionType: null, review: null });
    }
  };

  const flaggedReviewsCount = reviews.filter(r => r.status === 'flagged' || r.report?.reported).length;

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchSearch = 
        r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.book?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.comment?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isReported = r.status === 'flagged' || r.report?.reported;
      const matchFlag = filterType === 'all' || (filterType === 'flagged' && isReported);
      
      return matchSearch && matchFlag;
    });
  }, [reviews, searchTerm, filterType]);

  const groupedBooks = useMemo(() => {
    const map = {};
    filteredReviews.forEach(r => {
      const bId = r.book?._id || 'unknown';
      if (!map[bId]) {
        map[bId] = { bookDetails: r.book, reviewsList: [], avgRating: 0, flaggedCount: 0 };
      }
      map[bId].reviewsList.push(r);
      if (r.status === 'flagged' || r.report?.reported) {
        map[bId].flaggedCount += 1;
      }
    });

    return Object.values(map).map(b => {
      const total = b.reviewsList.reduce((sum, rev) => sum + rev.rating, 0);
      b.avgRating = (total / b.reviewsList.length).toFixed(1);
      return b;
    });
  }, [filteredReviews]);

  const getPageData = (list, page) => {
    const lastIdx = page * itemsPerPage;
    const firstIdx = lastIdx - itemsPerPage;
    return list.slice(firstIdx, lastIdx);
  };

  const currentBooks = getPageData(groupedBooks, booksPage);
  const totalBooksPages = Math.ceil(groupedBooks.length / itemsPerPage);

  let currentReviews = [];
  let totalReviewsPages = 1;
  let activeBookDetails = null;

  if (selectedBook) {
    const bookData = groupedBooks.find(b => b.bookDetails?._id === selectedBook);
    if (bookData) {
      activeBookDetails = bookData;
      currentReviews = getPageData(bookData.reviewsList, reviewsPage);
      totalReviewsPages = Math.ceil(bookData.reviewsList.length / itemsPerPage);
    }
  }

  const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="sr-pagination">
        <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <ChevronLeft size={16} /> Prev
        </button>
        <span className="sr-page-info">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
        <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="sr-page">
      {toast.show && (
        <div className={`sr-toast sr-toast-${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="sr-modal-backdrop">
          <div className="sr-modal">
            <div className={`sr-modal-icon ${confirmModal.actionType === 'unflag' ? 'icon-warning' : 'icon-danger'}`}>
              {confirmModal.actionType === 'report' && <Flag size={32} />}
              {confirmModal.actionType === 'unflag' && <Undo2 size={32} />}
              {confirmModal.actionType === 'deleteReply' && <Trash2 size={32} />}
            </div>
            <h3>
              {confirmModal.actionType === 'report' ? 'Flag this Review?' : 
               confirmModal.actionType === 'unflag' ? 'Restore Review?' : 'Delete Reply?'}
            </h3>
            <p>
              {confirmModal.actionType === 'report' ? `Are you sure you want to flag this review by ${confirmModal.review.user?.name}? It will be sent to administrators.` :
               confirmModal.actionType === 'unflag' ? `Would you like to remove the flag and restore this review's visibility?` :
               `Are you certain you wish to remove this reply? This action cannot be undone.`}
            </p>
            <div className="sr-modal-actions">
              <button className="sr-btn-modal-cancel" onClick={() => setConfirmModal({ show: false, actionType: null, review: null })}>
                Cancel
              </button>
              <button className={`sr-btn-modal-confirm ${confirmModal.actionType === 'unflag' ? 'btn-warning' : 'btn-danger'}`} onClick={executeAction}>
                {confirmModal.actionType === 'report' ? 'Yes, Flag Review' : 
                 confirmModal.actionType === 'unflag' ? 'Yes, Restore' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="sr-header-card">
        <div className="sr-header-top">
          <div className="sr-header-title">
            <div className="sr-icon-wrapper"><MessageSquareText size={24} /></div>
            <div><h2>Customer Reviews</h2><p>Manage feedback and ratings on your books.</p></div>
          </div>
        </div>

        <div className="sr-controls">
          <div className="sr-search-box">
            <Search size={18} className="sr-icon-muted" />
            <input 
              type="text" 
              placeholder="Search by user, book, or comment..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="sr-filter-group">
            <div className="sr-filter-toggle">
              <button className={filterType === 'all' ? 'active' : ''} onClick={() => setFilterType('all')}>All Reviews</button>
              <button className={filterType === 'flagged' ? 'active' : ''} onClick={() => setFilterType('flagged')}>Flagged</button>
            </div>

            <div className={`sr-count-badge ${filterType === 'flagged' ? 'badge-flagged' : 'badge-all'}`}>
              {filterType === 'flagged' ? <Flag size={16} fill="currentColor" /> : <Star size={16} color="#f59e0b" fill="#f59e0b" />}
              <span>
                {filterType === 'flagged' ? 'Flagged: ' : 'Total Reviews: '} 
                <strong>{filterType === 'flagged' ? flaggedReviewsCount : reviews.length}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="sr-loader"><Loader2 className="sr-spin" size={40} /></div>
      ) : (
        <>
          {/* VIEW 1: BOOKS GRID */}
          {!selectedBook && (
            <div className="sr-view-container fade-in">
              {groupedBooks.length === 0 ? (
                <div className="sr-empty">
                  <BookOpen size={48} className="sr-empty-icon" />
                  <h3>No reviews found</h3>
                  <p>Try adjusting your search criteria.</p>
                </div>
              ) : (
                <>
                  <div className="sr-book-grid">
                    {currentBooks.map((group) => (
                      <div key={group.bookDetails?._id || Math.random()} className="sr-book-card" onClick={() => setSelectedBook(group.bookDetails?._id)}>
                        <div className="sr-book-card-content">
                          <div className="sr-book-cover">
                            {getBookImage(group.bookDetails) ? (
                              <img src={getBookImage(group.bookDetails)} alt={group.bookDetails.title} />
                            ) : (
                              <div className="sr-no-cover"><BookOpen size={24}/></div>
                            )}
                          </div>
                          <div className="sr-book-info">
                            <h4 className="sr-b-title">{group.bookDetails?.title || "Unknown Book"}</h4>
                            <div className="sr-b-stats">
                              <span className="sr-b-rating"><Star size={14} fill="currentColor" /> {group.avgRating}</span>
                              <span className="sr-b-count">{group.reviewsList.length} Review{group.reviewsList.length !== 1 && 's'}</span>
                              {group.flaggedCount > 0 && (
                                <span className="sr-b-flag-count"><Flag size={10} fill="currentColor" /> {group.flaggedCount}</span>
                              )}
                            </div>
                            <span className="sr-b-action">View Reviews <ChevronRight size={16}/></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <PaginationControls currentPage={booksPage} totalPages={totalBooksPages} onPageChange={setBooksPage} />
                </>
              )}
            </div>
          )}

          {/* VIEW 2: REVIEWS FOR SELECTED BOOK */}
          {selectedBook && (
            <div className="sr-view-container slide-in">
              <div className="sr-active-book-header">
                <button className="sr-btn-back" onClick={() => setSelectedBook(null)}>
                  <ChevronLeft size={18} strokeWidth={2.5} /> Back to Book List
                </button>

                <div className="sr-active-book-info">
                  <h3>Reviews for <span>{activeBookDetails?.bookDetails?.title}</span></h3>
                  <div className="sr-active-stats-badges">
                    <span className="sr-badge-rating"><Star size={14} fill="currentColor" /> {activeBookDetails?.avgRating} Avg Rating</span>
                    <span className="sr-badge-count">{activeBookDetails?.reviewsList.length} Total Reviews</span>
                  </div>
                </div>
              </div>

              {currentReviews.length === 0 ? (
                <div className="sr-empty">
                  <MessageSquareText size={48} className="sr-empty-icon" />
                  <h3>No reviews match your filters</h3>
                </div>
              ) : (
                <>
                  <div className="sr-reviews-grid">
                    {currentReviews.map(review => (
                      <SellerReviewCard 
                        key={review._id} 
                        review={review} 
                        refresh={fetchReviews} 
                        showToast={showToast}
                        onActionClick={(type, rev) => setConfirmModal({ show: true, actionType: type, review: rev })}
                      />
                    ))}
                  </div>
                  <PaginationControls currentPage={reviewsPage} totalPages={totalReviewsPages} onPageChange={setReviewsPage} />
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SellerReviews;