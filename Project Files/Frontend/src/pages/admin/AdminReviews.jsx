import { useEffect, useState } from "react";
import { getAllReviews, hideReview, restoreReview, deleteReview, unflagReview, reportReview } from "../../services/reviewService";
import AdminReviewCard from "../../components/admin/AdminReviewCard";
import AdminReviewFilters from "../../components/admin/AdminReviewFilters";
import { Loader2, MessageSquareOff, ShieldCheck, CheckCircle, AlertTriangle, Info, BookOpen, ChevronLeft, Trash2, Undo2 } from "lucide-react";
import "../../styles/AdminReviews.css";

// --- REUSABLE PAGINATION COMPONENT ---
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="ar-pagination">
      <button 
        className="ar-page-btn" 
        disabled={currentPage === 1} 
        onClick={() => { onPageChange(currentPage - 1); window.scrollTo(0,0); }}
      >
        Previous
      </button>
      <span className="ar-page-info">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
      <button 
        className="ar-page-btn" 
        disabled={currentPage === totalPages} 
        onClick={() => { onPageChange(currentPage + 1); window.scrollTo(0,0); }}
      >
        Next
      </button>
    </div>
  );
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedBookId, setSelectedBookId] = useState(null);

  // NEW: Pagination States
  const [bookPage, setBookPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const ITEMS_PER_PAGE = 6; 

  // Professional UI States
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [confirmModal, setConfirmModal] = useState({ show: false, review: null, action: null });
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getAllReviews({ limit: 2000 }); // Fetch enough to group locally
      setReviews(data.reviews || []);
    } catch (error) {
      showToast("Failed to load reviews.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Reset pagination when search or filters change
  useEffect(() => {
    setBookPage(1);
    setReviewPage(1);
  }, [filter, searchTerm]);

  // Reset review pagination when a new book is clicked
  useEffect(() => {
    setReviewPage(1);
  }, [selectedBookId]);

  const handleActionClick = (review, action) => {
    setConfirmModal({ show: true, review, action });
  };

  const executeAction = async () => {
    if (!confirmModal.review) return;
    setIsProcessing(true);
    
   try {
      const reviewId = confirmModal.review._id;
      if (confirmModal.action === "hide") {
        await hideReview(reviewId);
        showToast("Review has been hidden successfully.");
      } else if (confirmModal.action === "restore") {
        await restoreReview(reviewId);
        showToast("Review has been restored successfully.");
      } else if (confirmModal.action === "unflag") {
        await unflagReview(reviewId);
        showToast("Review flag removed successfully.");
      } else if (confirmModal.action === "flag") { // NEW: Flag Action
        await reportReview(reviewId, { reason: "Admin manual flag" });
        showToast("Review has been flagged manually.");
      } else if (confirmModal.action === "delete") {
        await deleteReview(reviewId);
        showToast("Review deleted permanently.");
        const remainingForBook = reviews.filter(r => r.book?._id === selectedBookId && r._id !== reviewId);
        if (remainingForBook.length === 0) setSelectedBookId(null);
      }
      await fetchReviews(); 
    } catch (err) {
      showToast(`Failed to process request.`, "error");
    } finally {
      setIsProcessing(false);
      setConfirmModal({ show: false, review: null, action: null });
    }
  };

  // 1. FILTER REVIEWS BY SEARCH & STATUS
  const filteredReviews = reviews.filter((review) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      review.book?.title?.toLowerCase().includes(searchLower) ||
      review.user?.name?.toLowerCase().includes(searchLower) ||
      review.comment?.toLowerCase().includes(searchLower);

    const matchesFilter = 
      filter === "all" ? true 
      : filter === "flagged" ? review.report?.reported === true 
      : filter === "unhide_requests" ? review.unhideRequested === true // NEW: Unhide Request filter
      : review.status === filter;

    return matchesSearch && matchesFilter;
  });

  // 2. GROUP REVIEWS BY BOOK
  const groupedBooks = {};
  filteredReviews.forEach(review => {
    const bookId = review.book?._id;
    if (!bookId) return;

    if (!groupedBooks[bookId]) {
      groupedBooks[bookId] = {
        bookInfo: review.book,
        reviews: [],
        flaggedCount: 0,
        hiddenCount: 0,
        unhideCount: 0
      };
    }
    groupedBooks[bookId].reviews.push(review);
    if (review.report?.reported) groupedBooks[bookId].flaggedCount++;
    if (review.status === "hidden") groupedBooks[bookId].hiddenCount++;
    if (review.unhideRequested) groupedBooks[bookId].unhideCount++;
  });

  const bookList = Object.values(groupedBooks);

  // 3. PAGINATION MATH
  const totalBookPages = Math.ceil(bookList.length / ITEMS_PER_PAGE) || 1;
  const currentBookPage = Math.min(bookPage, totalBookPages);
  const paginatedBooks = bookList.slice((currentBookPage - 1) * ITEMS_PER_PAGE, currentBookPage * ITEMS_PER_PAGE);

  const currentBookReviews = selectedBookId && groupedBooks[selectedBookId] ? groupedBooks[selectedBookId].reviews : [];
  const totalReviewPages = Math.ceil(currentBookReviews.length / ITEMS_PER_PAGE) || 1;
  const currentReviewPage = Math.min(reviewPage, totalReviewPages);
  const paginatedReviews = currentBookReviews.slice((currentReviewPage - 1) * ITEMS_PER_PAGE, currentReviewPage * ITEMS_PER_PAGE);


  // 4. RENDER LOGIC
  return (
    <div className="ar-page-container">
      
      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`ar-toast ar-toast-${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="ar-modal-backdrop" onClick={() => !isProcessing && setConfirmModal({ show: false, review: null, action: null })}>
          <div className="ar-modal" onClick={e => e.stopPropagation()}>
            <div className={`ar-modal-icon ${
              confirmModal.action === 'delete' ? 'ar-bg-danger-light ar-text-danger' :
              confirmModal.action === 'hide' ? 'ar-bg-warning-light ar-text-warning' : 
              confirmModal.action === 'unflag' ? 'ar-bg-warning-light ar-text-warning' : 
              'ar-bg-success-light ar-text-success'
            }`}>
              {confirmModal.action === 'delete' ? <Trash2 size={32} /> : 
               confirmModal.action === 'unflag' ? <Undo2 size={32} /> : 
               <Info size={32} />}
            </div>
            
            <h3>
              {confirmModal.action === 'hide' ? 'Hide Review?' : 
               confirmModal.action === 'delete' ? 'Delete Review Permanently?' : 
               confirmModal.action === 'unflag' ? 'Unflag Review?' : 
               'Restore Review?'}
            </h3>
            
            <p>
              {confirmModal.action === 'unflag' 
                ? "Are you sure you want to remove the flag from this review?" 
                : `Are you sure you want to ${confirmModal.action} this review from `}
              {confirmModal.action !== 'unflag' && <strong>{confirmModal.review?.user?.name || "this user"}</strong>}
              {confirmModal.action !== 'unflag' && "?"}
              {confirmModal.action === 'delete' && " This action cannot be undone."}
            </p>
            
            <div className="ar-modal-actions">
              <button className="ar-btn-cancel" onClick={() => setConfirmModal({ show: false, review: null, action: null })} disabled={isProcessing}>
                Cancel
              </button>
              <button 
                className={`ar-btn-confirm ${
                  confirmModal.action === 'restore' || confirmModal.action === 'unflag' ? 'ar-btn-success' : 'ar-btn-danger'
                }`} 
                onClick={executeAction}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 size={16} className="ar-spin" /> : null}
                Yes, {
                  confirmModal.action === 'hide' ? 'Hide' : 
                  confirmModal.action === 'delete' ? 'Delete' : 
                  confirmModal.action === 'unflag' ? 'Unflag' : 'Restore'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="ar-header-section">
        <div className="ar-header-content">
          <div className="ar-header-icon"><ShieldCheck size={28} /></div>
          <div>
            <h1 className="ar-page-title">Review Moderation</h1>
            <p className="ar-page-subtitle">Grouped by book. Manage flagged content and community standards.</p>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="ar-controls-section">
        <AdminReviewFilters 
          filter={filter} 
          setFilter={setFilter} 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          resultCount={selectedBookId ? groupedBooks[selectedBookId]?.reviews.length : bookList.length} 
          isBookView={!selectedBookId}
        />
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="ar-loader-container">
          <Loader2 className="ar-spinner" size={48} />
          <p>Loading records...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="ar-empty-state">
          <div className="ar-empty-icon"><MessageSquareOff size={48} /></div>
          <h3>No Reviews Found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : !selectedBookId ? (
        
        /* VIEW 1: GRID OF BOOKS WITH PAGINATION */
        <div>
          <div className="ar-books-grid">
            {paginatedBooks.map((group) => (
              <div key={group.bookInfo._id} className="ar-book-folder-card" onClick={() => setSelectedBookId(group.bookInfo._id)}>
                <div className="ar-folder-icon"><BookOpen size={24} /></div>
                <div className="ar-folder-content">
  <h3 className="ar-folder-title">{group.bookInfo.title || "Unknown Book"}</h3>
  <p className="ar-folder-count">{group.reviews.length} Review(s)</p>
  
  {/* Horizontal Badge Row */}
  <div className="ar-folder-badges-row">
    {group.unhideCount > 0 && (
      <span className="ar-badge badge-unhide">{group.unhideCount} REQUESTS</span>
    )}
    {group.hiddenCount > 0 && (
      <span className="ar-badge badge-hidden">{group.hiddenCount} HIDDEN</span>
    )}
    {group.flaggedCount > 0 && (
      <span className="ar-badge badge-flagged">{group.flaggedCount} FLAGGED</span>
    )}
  </div>
</div>
                <div className="ar-folder-arrow"><ChevronLeft size={20} style={{transform: 'rotate(180deg)'}}/></div>
              </div>
            ))}
          </div>
          
          <Pagination 
            currentPage={currentBookPage} 
            totalPages={totalBookPages} 
            onPageChange={setBookPage} 
          />
        </div>

      ) : (

        /* VIEW 2: REVIEWS FOR SELECTED BOOK WITH PAGINATION */
        <div className="ar-reviews-detail-view">
          <button className="ar-back-btn" onClick={() => setSelectedBookId(null)}>
            <ChevronLeft size={18} /> Back to Book List
          </button>
          
          <div className="ar-detail-header">
            <h2>Reviews for: {groupedBooks[selectedBookId]?.bookInfo?.title}</h2>
          </div>

          <div className="ar-reviews-grid">
            {paginatedReviews.map((review) => (
              <AdminReviewCard
                key={review._id}
                review={review}
                onActionClick={handleActionClick}
              />
            ))}
          </div>

          <Pagination 
            currentPage={currentReviewPage} 
            totalPages={totalReviewPages} 
            onPageChange={setReviewPage} 
          />
        </div>

      )}
    </div>
  );
};

export default AdminReviews;