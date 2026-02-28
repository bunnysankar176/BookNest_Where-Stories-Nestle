import { useEffect, useState, useMemo } from "react";
import { getDashboardBooks, updateBookStock, toggleBookStatus } from "../../services/bookService";
import { 
  Package, Search, CheckCircle, XCircle, AlertTriangle, 
  ChevronLeft, ChevronRight, Save, X, Edit3, Store, Book, Info
} from "lucide-react";
import "../../styles/InventoryManagement.css";

function InventoryManagement() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get current user to determine UI elements dynamically
  const currentUser = JSON.parse(localStorage.getItem("booknest_user"));
  const userRole = currentUser?.role || "admin";

  // Search, Filter & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Inline Editing State
  const [editingStock, setEditingStock] = useState(null);
  const [newStock, setNewStock] = useState("");

  // UI States (Modals, Toasts, Previews)
  const [previewImage, setPreviewImage] = useState({ url: null, x: 0, y: 0 });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [confirmModal, setConfirmModal] = useState({ show: false, book: null });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      // NOTE: Ensure your backend getDashboardBooks() only returns the seller's books 
      // if the request is made with a seller's authentication token!
      const data = await getDashboardBooks();
      setBooks(data);
    } catch (err) {
      console.error("Fetch Books Error:", err);
      showToast(err.response?.data?.message || "Failed to load inventory data.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Custom Toast Notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // Filter & Pagination Logic
  const filteredBooks = useMemo(() => {
    let result = books;

    if (statusFilter === "active") {
      result = result.filter(book => book.isActive);
    } else if (statusFilter === "inactive") {
      result = result.filter(book => !book.isActive);
    }

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(book => 
        book.title.toLowerCase().includes(query) ||
        (userRole === "admin" && book.seller?.name?.toLowerCase().includes(query)) ||
        book._id.toLowerCase().includes(query)
      );
    }

    return result;
  }, [books, searchTerm, statusFilter, userRole]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const getBookImage = (book) => {
    if (book.images && book.images.length > 0) return book.images[0].url || book.images[0];
    if (book.coverImage) return book.coverImage;
    if (book.image) return book.image;
    return null;
  };

  const handleStockUpdate = async (bookId) => {
    try {
      await updateBookStock(bookId, { stock: Number(newStock) });
      setEditingStock(null);
      setNewStock("");
      fetchBooks();
      showToast("Stock updated successfully!");
    } catch (err) {
      console.error("Stock Update Error:", err);
      showToast(err.response?.data?.message || "Failed to update stock.", "error");
    }
  };

  const initiateToggleStatus = (book) => {
    setConfirmModal({ show: true, book });
  };

  const executeToggleStatus = async () => {
    if (!confirmModal.book) return;
    try {
      const res = await toggleBookStatus(confirmModal.book._id);

      setBooks(prev =>
        prev.map(b =>
          b._id === confirmModal.book._id
            ? { ...b, isActive: res.book.isActive }
            : b
        )
      );
      showToast(`Book marked as ${confirmModal.book.isActive ? 'Inactive' : 'Active'}!`);
      setConfirmModal({ show: false, book: null });
    } catch (err) {
      console.error("Status Toggle Error:", err);
      showToast(err.response?.data?.message || "Failed to update status.", "error");
      setConfirmModal({ show: false, book: null });
    }
  };

  // Hover Image Preview Handlers
  const handleMouseMove = (e, url) => {
    if (url) {
      const imageWidth = 200; 
      const imageHeight = 280; 
      const offset = 20;

      let x = e.clientX + offset;
      let y = e.clientY + offset;

      if (x + imageWidth > window.innerWidth) x = e.clientX - imageWidth - offset;
      if (y + imageHeight > window.innerHeight) y = e.clientY - imageHeight - offset;

      setPreviewImage({ url, x, y });
    }
  };

  const handleMouseLeave = () => {
    setPreviewImage({ url: null, x: 0, y: 0 });
  };

  if (loading) return <div className="inv-loader"><div className="inv-spinner"></div></div>;

  return (
    <div className="inv-container">
      
      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`inv-toast inv-toast-${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="inv-header-card">
        <div className="inv-header-title">
          <div className="inv-icon-wrapper inv-bg-blue-light inv-text-blue">
            <Package size={24} />
          </div>
          <div>
            <h2>Inventory Management</h2>
            <p>Update stock levels and manage active status.</p>
          </div>
        </div>

        {/* Side-by-Side Controls Row */}
        <div className="inv-controls-wrapper">
          <div className="inv-search-box">
            <Search size={18} className="inv-search-icon" />
            <input 
              type="text" 
              placeholder={userRole === "admin" ? "Search by title, ID, or seller..." : "Search by title or ID..."}
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          <div className="inv-status-filter-toggle">
            <button 
              className={statusFilter === 'all' ? 'active' : ''} 
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button 
              className={statusFilter === 'active' ? 'active' : ''} 
              onClick={() => setStatusFilter('active')}
            >
              Active
            </button>
            <button 
              className={statusFilter === 'inactive' ? 'active' : ''} 
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="inv-table-card">
        <div className="inv-table-responsive">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Book Details</th>
                {userRole === "admin" && <th>Seller</th>}
                <th>Status</th>
                <th>Stock Level</th>
                <th className="inv-text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBooks.length > 0 ? (
                paginatedBooks.map(book => {
                  const isLowStock = book.stock > 0 && book.stock < 5;
                  const isOutStock = book.stock === 0;

                  return (
                    <tr key={book._id}>
                      <td>
                        <div className="inv-book-info">
                          <div 
                            className="inv-book-img"
                            onMouseMove={(e) => handleMouseMove(e, getBookImage(book))}
                            onMouseLeave={handleMouseLeave}
                          >
                            {getBookImage(book) ? (
                              <img src={getBookImage(book)} alt={book.title} />
                            ) : (
                              <div className="inv-placeholder"><Book size={20}/></div>
                            )}
                          </div>
                          <div className="inv-book-texts">
                            <strong>{book.title}</strong>
                            <span className="inv-id">ID: {book._id.slice(-6).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>

                      {/* Only render seller column for Admins */}
                      {userRole === "admin" && (
                        <td>
                          <div className="inv-seller-badge">
                            <Store size={14} />
                            <span>{book.seller?.name || "Unknown"}</span>
                          </div>
                        </td>
                      )}

                      <td>
                        <button 
                          className={`inv-status-toggle ${book.isActive ? "active" : "inactive"}`}
                          onClick={() => initiateToggleStatus(book)}
                          title="Click to change status"
                        >
                          {book.isActive ? (
                            <><CheckCircle size={14}/> Active</>
                          ) : (
                            <><XCircle size={14}/> Inactive</>
                          )}
                        </button>
                      </td>

                      <td>
                        {editingStock === book._id ? (
                          <div className="inv-stock-edit">
                            <input
                              type="number"
                              min="0"
                              value={newStock}
                              onChange={(e) => setNewStock(e.target.value)}
                              autoFocus
                            />
                            <button className="inv-save-btn" onClick={() => handleStockUpdate(book._id)}>
                              <Save size={14} />
                            </button>
                            <button className="inv-cancel-btn" onClick={() => setEditingStock(null)}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="inv-stock-display">
                            <span className={`inv-stock-count ${isOutStock ? "danger" : isLowStock ? "warning" : "success"}`}>
                              {book.stock} in stock
                            </span>
                            {isLowStock && (
                              <span className="inv-low-stock-warning" title="Stock is running low!">
                                <AlertTriangle size={14} /> Low
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="inv-text-right">
                        <button 
                          className="inv-btn-action" 
                          onClick={() => {
                            setEditingStock(book._id);
                            setNewStock(book.stock);
                          }}
                          title="Update Stock"
                        >
                          <Edit3 size={16} /> Update Stock
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan={userRole === "admin" ? "5" : "4"} className="inv-empty-state">No books found matching your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="inv-mobile-grid">
        {paginatedBooks.map(book => {
          const isLowStock = book.stock > 0 && book.stock < 5;
          const isOutStock = book.stock === 0;

          return (
            <div key={book._id} className="inv-mobile-card">
              <div className="inv-mobile-card-top">
                <div 
                  className="inv-book-img"
                  onTouchStart={(e) => handleMouseMove(e.touches[0], getBookImage(book))}
                  onTouchEnd={handleMouseLeave}
                >
                  {getBookImage(book) ? ( <img src={getBookImage(book)} alt={book.title} /> ) : ( <div className="inv-placeholder"><Book size={20}/></div> )}
                </div>
                <div className="inv-book-texts">
                  <strong>{book.title}</strong>
                  <span className="inv-id">ID: {book._id.slice(-6).toUpperCase()}</span>
                  
                  {/* Only render seller badge for Admins on mobile */}
                  {userRole === "admin" && (
                    <div className="inv-seller-badge inv-mt-1">
                      <Store size={12} /><span>{book.seller?.name || "Unknown"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="inv-mobile-card-bottom">
                <button 
                  className={`inv-status-toggle ${book.isActive ? "active" : "inactive"}`}
                  onClick={() => initiateToggleStatus(book)}
                >
                  {book.isActive ? <><CheckCircle size={14}/> Active</> : <><XCircle size={14}/> Inactive</>}
                </button>

                <div className="inv-mobile-stock-section">
                  {editingStock === book._id ? (
                    <div className="inv-stock-edit mobile-edit">
                      <input
                        type="number"
                        min="0"
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                      />
                      <button className="inv-save-btn" onClick={() => handleStockUpdate(book._id)}><Save size={14} /></button>
                      <button className="inv-cancel-btn" onClick={() => setEditingStock(null)}><X size={14} /></button>
                    </div>
                  ) : (
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <span className={`inv-stock-count ${isOutStock ? "danger" : isLowStock ? "warning" : "success"}`}>
                        {book.stock} in stock
                      </span>
                      {isLowStock && <AlertTriangle size={14} color="#f59e0b" />}
                      
                      <button className="inv-icon-btn" onClick={() => { setEditingStock(book._id); setNewStock(book.stock); }}>
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* STATUS CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="inv-modal-backdrop">
          <div className="inv-modal">
            <div className={`inv-modal-icon ${confirmModal.book.isActive ? 'inv-bg-red-light inv-text-red' : 'inv-bg-green-light inv-text-green'}`}>
              <Info size={32} />
            </div>
            <h3>Change Status?</h3>
            <p>
              Are you sure you want to mark <strong>{confirmModal.book.title}</strong> as{' '} 
              <span style={{ fontWeight: 'bold', color: confirmModal.book.isActive ? 'var(--inv-danger)' : 'var(--inv-success)' }}>
                {confirmModal.book.isActive ? 'Inactive' : 'Active'}
              </span>?
            </p>
            <p className="inv-modal-hint">
              {confirmModal.book.isActive 
                ? "Inactive books will be hidden from the store." 
                : "Active books will become visible to customers."}
            </p>
            
            <div className="inv-modal-actions">
              <button className="inv-btn-cancel" onClick={() => setConfirmModal({ show: false, book: null })}>Cancel</button>
              <button className="inv-btn-confirm" onClick={executeToggleStatus}>Yes, Update Status</button>
            </div>
          </div>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="inv-pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={18} /> Prev</button>
          <span className="inv-page-info">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next <ChevronRight size={18} /></button>
        </div>
      )}

      {/* IMAGE PREVIEW */}
      {previewImage.url && (
        <div 
          className="inv-image-preview-popup" 
          style={{ left: previewImage.x, top: previewImage.y }}
        >
          <img src={previewImage.url} alt="Book Cover Preview" />
        </div>
      )}

    </div>
  );
}

export default InventoryManagement;