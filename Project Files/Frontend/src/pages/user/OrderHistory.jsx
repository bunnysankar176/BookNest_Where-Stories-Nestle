import { useEffect, useState, useMemo, useRef } from "react";
import { 
  ClipboardList, ChevronRight, Search, Package, 
  Truck, CheckCircle, Clock, Filter, Calendar,
  Phone, Store, XCircle, MapPin, X, AlertCircle, Star, AlertTriangle, ChevronDown
} from "lucide-react";
import * as orderService from "../../services/orderService";
import BookCard from "../../components/books/BookCard"; 
import { useNavigate } from "react-router-dom";
import "../../styles/OrderHistory.css";

// --- AGGREGATE STATUS DROPDOWN (WITH COLORS) ---
function AggregateStatusBadge({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAllDelivered = items.every(i => (i.status || 'pending').toLowerCase() === 'delivered');
  const isAllCancelled = items.every(i => (i.status || 'pending').toLowerCase() === 'cancelled');

  if (isAllDelivered) return <span className="oh-status-badge status-delivered"><CheckCircle size={14} strokeWidth={2.5}/> All Delivered</span>;
  if (isAllCancelled) return <span className="oh-status-badge status-cancelled"><XCircle size={14} strokeWidth={2.5}/> All Cancelled</span>;

  const statusCounts = items.reduce((acc, item) => {
    const s = (item.status || 'pending').toLowerCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return { text: '#10b981', bg: '#d1fae5' };
      case 'shipped': return { text: '#8b5cf6', bg: '#ede9fe' };
      case 'processing': case 'paid': return { text: '#3b82f6', bg: '#dbeafe' };
      case 'cancelled': return { text: '#ef4444', bg: '#fee2e2' };
      default: return { text: '#f59e0b', bg: '#fef3c7' };
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <span 
        className="oh-status-badge status-paid" 
        style={{ cursor: "pointer", background: "var(--ao-primary-light, #eef2ff)", color: "var(--ao-primary, #4f46e5)" }} 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
      >
        <Package size={14} strokeWidth={2.5}/> View Statuses <ChevronDown size={14} style={{ marginLeft: "4px" }}/>
      </span>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "white", border: "1px solid #e2e8f0", borderRadius: "8px",
            padding: "8px", minWidth: "180px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 50, display: "flex", flexDirection: "column", gap: "6px"
          }}
        >
          {Object.entries(statusCounts).map(([status, count]) => {
            const colors = getStatusColor(status);
            return (
              <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", fontSize: "0.85rem", fontWeight: 600, color: colors.text, background: colors.bg, borderRadius: "6px" }}>
                <span style={{ textTransform: "capitalize" }}>{status === 'paid' ? 'Processing' : status}</span>
                <span style={{ background: "rgba(255,255,255,0.7)", padding: "2px 8px", borderRadius: "12px", color: colors.text }}>{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderHistory() {
  const navigate = useNavigate(); 
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());
  const [previewImage, setPreviewImage] = useState(null);
  const [addressCollapsed, setAddressCollapsed] = useState({});

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewItems, setReviewItems] = useState([]);

  /* Professional Modals & Toasts */
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null, cancelableItems: [] });
  const [cancelMode, setCancelMode] = useState('all'); 
  const [selectedItemsToCancel, setSelectedItemsToCancel] = useState([]);

  /* Controls States */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(""); 
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'paid', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getUserOrders();
      setOrders(data || []);
    } catch (err) {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3500);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = 
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.book?.title?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const d = new Date(order.createdAt);
      const localDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const matchesDate = !dateFilter || localDateString === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  const getRemainingTime = (deliverBy, status) => {
    if (!deliverBy) return "Updating delivery time...";
    if (status === 'cancelled') return "Timer Stopped";
    if (status === 'delivered') return "Delivered";

    const deliveryDate = new Date(deliverBy);
    if (isNaN(deliveryDate)) return "Delivery date unavailable";

    const diff = deliveryDate - now;
    if (diff <= 0) return "Arriving today";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const timeParts = [];
    if (days > 0) timeParts.push(`${days}d`);
    if (hours > 0 || days > 0) timeParts.push(`${hours}h`);
    timeParts.push(`${minutes}m`);
    timeParts.push(`${seconds}s`);

    return `${timeParts.join(' ')} remaining`;
  };

  const calculateTotal = (items) => items.reduce((total, item) => total + (item.book?.price || 0) * item.quantity, 0);

  const toggleAddress = (orderId, e) => {
    e.stopPropagation();
    setAddressCollapsed(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const openReviewModal = (items, e) => {
    e.stopPropagation();
    setReviewItems(items);
    setIsReviewModalOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (cancelMode === 'partial' && selectedItemsToCancel.length === 0) {
      showToast("Please select at least one item to cancel.", "error");
      return;
    }

    try {
      await orderService.cancelOrder(cancelModal.orderId, selectedItemsToCancel);
      await fetchOrders();
      showToast("Items cancelled successfully", "success");
    } catch {
      showToast("Failed to cancel items. Please try again.", "error");
    } finally {
      setCancelModal({ show: false, orderId: null, cancelableItems: [] });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) pages.push(1, 2, 3, 4, "...", totalPages);
      else if (currentPage >= totalPages - 2) pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  if (loading) return <div className="oh-loading"><div className="oh-spinner"></div><p>Loading your orders...</p></div>;
  if (error) return <div className="oh-page"><div className="oh-container"><div className="oh-empty"><AlertCircle size={56} color="#ef4444" strokeWidth={1.5} /><h3>Oops!</h3><p>{error}</p></div></div></div>;

  return (
    <div className="oh-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`oh-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Advanced Cancel Order Modal */}
      {cancelModal.show && (
        <div className="oh-modal-overlay">
          <div className="oh-modal-content" style={{ maxWidth: "500px" }}>
            <div className="oh-modal-icon warning"><AlertTriangle size={32} /></div>
            <h3>Cancel Order</h3>
            
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <input 
                  type="radio" 
                  checked={cancelMode === 'all'} 
                  onChange={() => {
                    setCancelMode('all');
                    setSelectedItemsToCancel(cancelModal.cancelableItems.map(i => i._id));
                  }} 
                /> 
                Cancel All Eligible Items
              </label>
              
              {cancelModal.cancelableItems.length > 1 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  <input 
                    type="radio" 
                    checked={cancelMode === 'partial'} 
                    onChange={() => {
                      setCancelMode('partial');
                      setSelectedItemsToCancel([]);
                    }} 
                  /> 
                  Cancel Specific Books
                </label>
              )}
            </div>

            {(cancelMode === 'partial') && (
              <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                {cancelModal.cancelableItems.map(item => (
                  <label key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedItemsToCancel.includes(item._id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedItemsToCancel(prev => [...prev, item._id]);
                        else setSelectedItemsToCancel(prev => prev.filter(id => id !== item._id));
                      }}
                    />
                    <img src={item.book?.images?.[0]?.url} alt={item.book?.title} style={{ width: '40px', height: '55px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.book?.title}</span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Qty: {item.quantity}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="oh-modal-actions">
              <button className="btn-cancel" onClick={() => setCancelModal({ show: false, orderId: null, cancelableItems: [] })}>Keep Order</button>
              <button className="btn-confirm-danger" disabled={cancelMode === 'partial' && selectedItemsToCancel.length === 0} onClick={confirmCancelOrder}>
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW BOOKS MODAL (Only shows delivered books) */}
      {isReviewModalOpen && (
        <div className="review-modal-overlay" onClick={() => setIsReviewModalOpen(false)}>
          <div className="review-modal-content" onClick={e => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>Select a Book to Review</h3>
              <button className="review-modal-close" onClick={() => setIsReviewModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="review-modal-body review-books-scroll">
              {reviewItems.map(item => (
                <div 
                  key={item.book._id} 
                  className="review-book-wrapper" 
                  title="Click to view details and review"
                  onClick={() => navigate(`/books/${item.book._id}#review`)}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ pointerEvents: 'none' }}>
                    <BookCard book={item.book} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="oh-container">
        {/* HEADER */}
        <div className="oh-heading">
          <div className="oh-heading-left">
            <div className="oh-heading-icon"><ClipboardList size={28} /></div>
            <div>
              <h1>Order History</h1>
              <p>Track, manage, and review your recent purchases.</p>
            </div>
          </div>
          <div className="oh-heading-right">
             <span className="oh-order-count-badge">{filteredOrders.length} Orders</span>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <div className="oh-controls-bar">
          <div className="oh-filter-pill oh-search-pill">
            <Search size={18} className="oh-filter-icon" />
            <input type="text" placeholder="Search by Order ID or Title..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
          <div className="oh-filter-pill oh-date-pill">
            <Calendar size={18} className="oh-filter-icon" />
            <input type="date" className="oh-date-picker" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} />
            {dateFilter && <X size={16} className="oh-clear-date" onClick={() => { setDateFilter(""); setCurrentPage(1); }} />}
          </div>
          <div className="oh-filter-pill oh-select-pill custom-dropdown" ref={statusDropdownRef}>
            <Filter size={18} className="oh-filter-icon" />
            <div className="custom-dropdown-selected" onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}>
              <span>{statusOptions.find(opt => opt.value === statusFilter)?.label}</span>
              <ChevronDown size={16} className={`dropdown-arrow ${isStatusDropdownOpen ? 'open' : ''}`} />
            </div>
            {isStatusDropdownOpen && (
              <div className="custom-dropdown-menu">
                {statusOptions.map((opt) => (
                  <div key={opt.value} className={`custom-dropdown-item ${statusFilter === opt.value ? 'active' : ''}`} onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); setIsStatusDropdownOpen(false); }}>
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ORDERS LIST */}
        <div className="oh-list">
          {paginatedOrders.length === 0 ? (
            <div className="oh-empty">
              <Package size={56} color="#94a3b8" strokeWidth={1.5} />
              <h3>No Orders Found</h3>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
            </div>
          ) : (
            paginatedOrders.map((order) => {
              const orderTotal = calculateTotal(order.items);
              const isExpanded = expanded === order._id;
              
              // Logic Checkers
              const deliveredItems = order.items.filter(i => (i.status || '').toLowerCase() === 'delivered');
              const cancelableItems = order.items.filter(i => ['pending', 'paid', 'processing'].includes((i.status || 'pending').toLowerCase()));

              return (
                <div key={order._id} className={`oh-card ${isExpanded ? 'expanded' : ''}`}>
                  
                  {/* RESTORED FLOATING RATE & REVIEW BUTTON */}
                  {deliveredItems.length > 0 && (
                    <button 
                      className="oh-floating-review-btn"
                      onClick={(e) => openReviewModal(deliveredItems, e)} // Only passes the delivered books!
                      title="Write a review for your delivered books"
                    >
                      <Star size={14} fill="currentColor" /> Rate & Review
                    </button>
                  )}

                  {/* CARD HEADER */}
                  <div className="oh-card-header" onClick={() => setExpanded(isExpanded ? null : order._id)}>
                    <div className="oh-header-left">
                      <div className="oh-id-badge"><span className="oh-placeholder-label">Order ID: </span>#{order._id.slice(-8).toUpperCase()}</div>
                      <div className="oh-date-info">
                        <Calendar size={14} />
                        {new Date(order.createdAt).toLocaleString("en-IN", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="oh-header-right">
                      <div className="oh-amount-info">
                        <span className="oh-amount-label">Total Amount</span>
                        <span className="oh-amount-value">₹{orderTotal > 0 ? orderTotal : "---"}</span>
                      </div>
                      <AggregateStatusBadge items={order.items} />
                      <button className={`oh-expand-btn ${isExpanded ? 'active' : ''}`}><ChevronRight size={20} /></button>
                    </div>
                  </div>

                  {/* CARD DETAILS */}
                  {isExpanded && (
                    <div className="oh-card-body">
                      {/* Visual Progress Stepper (Only show if all items are on same track) */}
                      {order.status !== 'processing' && (
                        <div className="oh-stepper-wrapper">
                          {order.status === 'cancelled' ? (
                             <div className="oh-cancelled-banner">
                               <XCircle size={20} /> All items in this order have been cancelled.
                             </div>
                          ) : (
                            <div className="oh-stepper">
                              <div className={`step ${['paid', 'shipped', 'delivered'].includes(order.status) ? 'active' : ''}`}>
                                <div className="step-icon"><Package size={18} /></div>
                                <span>Processed</span>
                              </div>
                              <div className={`step-line ${['shipped', 'delivered'].includes(order.status) ? 'active' : ''}`}></div>
                              
                              <div className={`step ${['shipped', 'delivered'].includes(order.status) ? 'active' : ''}`}>
                                <div className="step-icon"><Truck size={18} /></div>
                                <span>Shipped</span>
                              </div>
                              <div className={`step-line ${order.status === 'delivered' ? 'active' : ''}`}></div>
                              
                              <div className={`step ${order.status === 'delivered' ? 'active' : ''}`}>
                                <div className="step-icon"><CheckCircle size={18} /></div>
                                <span>Delivered</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="oh-details-grid">
                        <div className="oh-shipping-box">
                          <div className="oh-box-header" onClick={(e) => toggleAddress(order._id, e)}>
                            <h4 className="oh-box-title"><MapPin size={16} /> Shipping Address</h4>
                            <button className={`oh-address-toggle ${!addressCollapsed[order._id] ? 'open' : ''}`}><ChevronRight size={18} /></button>
                          </div>
                          {!addressCollapsed[order._id] && (
                            <div className="oh-address-content">
                              <strong>{order.shippingAddress.fullName}</strong>
                              <p>{order.shippingAddress.line1}</p>
                              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                              <p>{order.shippingAddress.country}</p>
                              <div className="oh-address-phone"><Phone size={14} /> {order.shippingAddress.phone}</div>
                            </div>
                          )}
                        </div>

                        <div className="oh-actions-box">
                          {cancelableItems.length > 0 && (
                            <button className="oh-cancel-btn" onClick={(e) => {
                                e.stopPropagation();
                                setCancelMode('all');
                                setSelectedItemsToCancel(cancelableItems.map(i => i._id));
                                setCancelModal({ show: true, orderId: order._id, cancelableItems });
                            }}>
                              <XCircle size={16} /> Cancel Order Items
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="oh-items-container">
                        <h4 className="oh-items-title">Order Items ({order.items.length})</h4>
                        <div className="oh-items-list">
                          {order.items.map((item) => {
                            const itemStatus = (item.status || 'pending').toLowerCase();
                            const isItemCancelled = itemStatus === 'cancelled';
                            const isItemDelivered = itemStatus === 'delivered';

                            return (
                              <div key={item._id} className="oh-item-row">
                                <div className="oh-item-details">
                                  <div className="oh-item-image">
                                    {item.book?.images?.length > 0 ? (
                                      <img src={item.book.images[0].url} alt={item.book.title} className={`oh-book-img ${isItemCancelled ? 'cancelled-img' : ''}`} onClick={() => setPreviewImage(item.book.images[0].url)} />
                                    ) : (
                                      <div className="oh-no-img"><Package size={24} /></div>
                                    )}
                                  </div>
                                  <div className="oh-item-text">
                                    <strong>{item.book?.title || "Unknown Book"}</strong>
                                    <span className="oh-item-qty"><span className="oh-placeholder-label">Qty:</span> {item.quantity}</span>
                                    <span className="oh-seller-name">
                                      <span className="oh-placeholder-label">Seller:</span> 
                                      <Store size={14} style={{marginLeft: '4px', marginRight: '4px', color: 'var(--ao-primary, #4f46e5)'}} /> 
                                      {item.seller?.name || item.book?.seller?.name || "BookNest Verified"}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="oh-item-pricing">
                                  <div className="oh-price-calc"><span className="oh-placeholder-label">Each: </span>₹{item.book?.price || 0}</div>
                                  <div className="oh-price-subtotal"><span className="oh-placeholder-label">Subtotal: </span>₹{(item.book?.price || 0) * item.quantity}</div>
                                </div>
                                
                                <div className="oh-item-delivery">
                                  <div style={{ marginBottom: "8px" }}>
                                    <span className={`oh-status-badge status-${itemStatus}`} style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px" }}>
                                      {isItemDelivered ? <CheckCircle size={12}/> : itemStatus === 'shipped' ? <Truck size={12}/> : isItemCancelled ? <XCircle size={12}/> : <Clock size={12}/>}
                                      {itemStatus.charAt(0).toUpperCase() + itemStatus.slice(1)}
                                    </span>
                                  </div>
                                  <span className={`oh-delivery-date ${isItemCancelled ? 'cancelled' : ''} ${isItemDelivered ? 'delivered-text' : ''}`}>
                                    {isItemDelivered ? (item.deliveredAt ? `Delivered on ${new Date(item.deliveredAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}` : "Delivered") 
                                    : (item.expectedDelivery && !isNaN(new Date(item.expectedDelivery)) ? `Expected by ${new Date(item.expectedDelivery).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}` : "Updating delivery time...")}
                                  </span>
                                  {itemStatus !== "delivered" && (
                                    <span className={`oh-delivery-countdown ${isItemCancelled ? 'cancelled' : ''}`}>
                                      {isItemCancelled ? <XCircle size={12}/> : <Clock size={12} />} {getRemainingTime(item.expectedDelivery, itemStatus)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="oh-pagination">
            <button className="oh-page-btn" disabled={currentPage === 1} onClick={() => { setCurrentPage(currentPage - 1); window.scrollTo(0,0); }}>Previous</button>
            <div className="oh-page-numbers">
              {getPageNumbers().map((page, index) => page === "..." ? ( <span key={`dots-${index}`} className="oh-dots">...</span> ) : (
                  <button key={`page-${page}`} className={`oh-page-number ${currentPage === page ? "active" : ""}`} onClick={() => { setCurrentPage(page); window.scrollTo(0,0); }}>{page}</button>
                )
              )}
            </div>
            <button className="oh-page-btn" disabled={currentPage === totalPages} onClick={() => { setCurrentPage(currentPage + 1); window.scrollTo(0,0); }}>Next</button>
          </div>
        )}
      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="image-modal" onClick={() => setPreviewImage(null)}>
          <button className="image-modal-close" onClick={() => setPreviewImage(null)}><X size={24} /></button>
          <img src={previewImage} alt="Preview" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

    </div>
  );
}

export default OrderHistory;