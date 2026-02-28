import { useEffect, useState, useMemo, useRef } from "react";
import * as orderService from "../../services/orderService";
import { 
  Package, User, Mail, ShoppingBag, Clock, CheckCircle, Truck, XCircle, 
  MapPin, ChevronRight, ChevronDown, ChevronUp, Phone, Search, 
  Filter, Calendar, AlertCircle, Store
} from "lucide-react";
import "../../styles/AdminSellerOrders.css"; 

// --- HELPER COMPONENT: LIVE COUNTDOWN TIMER ---
function LiveCountdown({ orderDate }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!orderDate) return;
    const targetDate = new Date(orderDate);
    targetDate.setDate(targetDate.getDate() + 7); 

    const calculateTime = () => {
      const diff = targetDate - new Date();
      if (diff <= 0) return 'Time Elapsed';
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      return `${d}d ${h}h ${m}m ${s}s remaining`;
    };

    setTimeLeft(calculateTime());
    const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
    
    return () => clearInterval(timer);
  }, [orderDate]);

  return <span>{timeLeft}</span>;
}

// --- HELPER COMPONENT: CUSTOM DROPDOWN ---
function CustomDropdown({ value, options, onChange, disabled, statusDropdown = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`ao-custom-dropdown-container ${disabled ? 'disabled' : ''} ${statusDropdown ? 'status-mode' : ''}`} ref={dropdownRef}>
      <div 
        className={`ao-dropdown-selected ${statusDropdown ? `border-${value}` : ''}`} 
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
        style={{ whiteSpace: "nowrap" }}
      >
        <span>{selectedOption?.label || "Select"}</span>
        <ChevronDown size={14} className={`ao-dropdown-icon ${isOpen ? 'open' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="ao-dropdown-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`ao-dropdown-item ${option.disabled ? 'disabled-item' : ''} ${value === option.value ? 'active-item' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!option.disabled) {
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---
function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [detailsCollapsed, setDetailsCollapsed] = useState({});
  const [notification, setNotification] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getSellerOrders();
      setOrders(data || []);
    } catch (error) {
      showNotification("Failed to load orders. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await orderService.updateOrderStatus(id, status);
      fetchOrders(); // Forces sync with items internally
      showNotification("Order status updated successfully.");
    } catch (error) {
      showNotification("Failed to update status.", "error");
    }
  };

  const toggleDetails = (orderId, e) => {
    e.stopPropagation();
    setDetailsCollapsed(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "paid": return <Package size={16} strokeWidth={2.5}/>;
      case "shipped": return <Truck size={16} strokeWidth={2.5}/>;
      case "delivered": return <CheckCircle size={16} strokeWidth={2.5}/>;
      case "cancelled": return <XCircle size={16} strokeWidth={2.5}/>;
      default: return <Clock size={16} strokeWidth={2.5}/>;
    }
  };

  const getExpectedDate = (dateString) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchString = searchTerm.toLowerCase();
      const matchesSearch = 
        order._id.toLowerCase().includes(searchString) ||
        (order.user?.name || "").toLowerCase().includes(searchString) ||
        order.items.some(item => item.book?.title?.toLowerCase().includes(searchString));

      // Calculate the specific seller's status to correctly apply search filters
      const activeItems = order.items.filter(i => (i.status || 'pending').toLowerCase() !== 'cancelled');
      let derivedStatus = 'pending';
      if (activeItems.length > 0) {
        const firstStat = (activeItems[0].status || 'pending').toLowerCase();
        const allSame = activeItems.every(i => (i.status || 'pending').toLowerCase() === firstStat);
        derivedStatus = allSame ? firstStat : 'paid';
      } else if (order.items.length > 0) {
        derivedStatus = 'cancelled';
      }

      const matchesStatus = statusFilter === "all" || derivedStatus === statusFilter.toLowerCase();

      let matchesDate = true;
      if (selectedDate && order.createdAt) {
        const d = new Date(order.createdAt);
        const localDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        matchesDate = localDateString === selectedDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, selectedDate]);

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const filterOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Processing (Paid)" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="ao-container">
      
      {notification && (
        <div className={`ao-notification ${notification.type}`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {notification.message}
        </div>
      )}

      <div className="ao-header-card">
        <div className="ao-header-top">
          <div className="ao-header-title">
            <div className="ao-icon-wrapper">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2>My Orders</h2>
              <p>Track, update, and fulfill your customer orders.</p>
            </div>
          </div>
          <div className="ao-total-orders-badge">
            <Package size={18} />
            <span>Total Orders: <strong>{filteredOrders.length}</strong></span>
          </div>
        </div>

        <div className="ao-controls">
          <div className="ao-search-box">
            <Search size={18} className="ao-icon" />
            <input
              type="text"
              placeholder="Search by Customer Name, Book, or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="ao-filter-box ao-date-filter-wrapper">
            <Calendar size={18} className="ao-icon" />
            <input 
              type="date" 
              className={`ao-date-input ${selectedDate ? 'has-value' : ''}`}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            {selectedDate && (
              <XCircle size={16} className="ao-clear-date-icon" onClick={() => setSelectedDate("")} />
            )}
          </div>

          <div className="ao-filter-box ao-dropdown-filter-wrapper">
            <Filter size={18} className="ao-icon" />
            <CustomDropdown value={statusFilter} options={filterOptions} onChange={(val) => setStatusFilter(val)} />
          </div>
        </div>
      </div>

      <div className="ao-list-container">
        {loading ? (
          <div className="ao-loader"><div className="spinner"></div></div>
        ) : currentOrders.length === 0 ? (
          <div className="ao-empty-state">
            <AlertCircle size={48} color="#cbd5e1" />
            <h3>No orders found</h3>
            <p>You have no orders matching your current search or filters.</p>
          </div>
        ) : (
          <div className="ao-orders-list">
            {currentOrders.map((order) => {
              const isExpanded = expandedOrder === order._id;
              
              // ✅ CRITICAL FIX: Calculate the dropdown status strictly from the SELLER'S items, ignoring the Global Order status
              const activeItems = order.items.filter(i => (i.status || 'pending').toLowerCase() !== 'cancelled');
              let computedStatus = 'pending';
              
              if (activeItems.length > 0) {
                const firstStatus = (activeItems[0].status || 'pending').toLowerCase();
                const allSame = activeItems.every(i => (i.status || 'pending').toLowerCase() === firstStatus);
                computedStatus = allSame ? firstStatus : 'paid'; // Fallback 'paid' correctly maps to "Processing"
              } else if (order.items.length > 0) {
                computedStatus = 'cancelled';
              } else {
                computedStatus = (order.status || 'pending').toLowerCase();
              }

              const currentStatus = computedStatus;
              const isCancelled = currentStatus === "cancelled";
              const isLocked = currentStatus === "delivered" || isCancelled;

              const statusOptions = [
                { value: 'pending', label: 'Pending', disabled: currentStatus === 'shipped' || currentStatus === 'paid' },
                { value: 'paid', label: 'Processing', disabled: currentStatus === 'shipped' },
                { value: 'shipped', label: 'Shipped', disabled: false },
                { value: 'delivered', label: 'Delivered', disabled: false },
                { value: 'cancelled', label: 'Cancelled', disabled: false }
              ];
              
              return (
                <div key={order._id} className={`ao-card ${isExpanded ? 'expanded' : ''}`}>
                  
                  <div className="ao-card-summary" onClick={() => setExpandedOrder(isExpanded ? null : order._id)}>
                    <div className="ao-summary-left">
                      <div className="ao-id-block">
                        <span className="ao-label">Order ID:</span>
                        <span className="ao-id-badge">#{order._id.slice(-8).toUpperCase()}</span>
                      </div>
                      
                      {order.createdAt && (
                        <div className="ao-order-date">
                          {new Date(order.createdAt).toLocaleString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>

                    <div className="ao-summary-right" style={{ gap: "1.25rem", flexShrink: 0 }}>
                      <div className="ao-amount-block">
                        <span className="ao-label">Your Revenue</span>
                        <span className="ao-amount">₹{order.totalAmount?.toFixed(2) || "0.00"}</span>
                      </div>

                      <div className="ao-status-control" onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                        <div className={`ao-status-badge status-${currentStatus}`}>
                          {getStatusIcon(currentStatus)}
                        </div>
                        <div className="ao-status-select-wrapper" style={{ minWidth: "160px" }}>
                          <CustomDropdown 
                            value={currentStatus}
                            options={statusOptions}
                            onChange={(val) => handleStatusChange(order._id, val)}
                            disabled={isLocked}
                            statusDropdown={true}
                          />
                        </div>
                      </div>

                      <button className={`ao-expand-btn ${isExpanded ? 'active' : ''}`} style={{ flexShrink: 0 }}>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="ao-card-body">
                      <div className="ao-details-grid">
                        
                        <div className="ao-shipping-box">
                          <div className="ao-box-header" onClick={(e) => toggleDetails(order._id, e)}>
                            <h4 className="ao-box-title">
                              <User size={16} /> Customer & Shipping Info
                            </h4>
                            <button className={`ao-address-toggle ${!detailsCollapsed[order._id] ? 'open' : ''}`}>
                              <ChevronRight size={18} />
                            </button>
                          </div>

                          {!detailsCollapsed[order._id] && (
                            <div className="ao-address-content">
                              <div className="ao-customer-mini-profile">
                                 <Mail size={14} className="ao-mini-icon"/> {order.user?.email || "No email provided"}
                              </div>
                              
                              <div className="ao-address-block">
                                <div className="ao-address-title"><MapPin size={14}/> Delivery Address:</div>
                                
                                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
                                  <span style={{ color: "var(--ao-text-light)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "700" }}>
                                    Customer:
                                  </span>
                                  <strong style={{ display: "inline", margin: 0 }}>
                                    {order.shippingAddress?.fullName || order.user?.name || (
                                      <span className="ao-placeholder-text">Name Unavailable</span>
                                    )}
                                  </strong>
                                </div>

                                <p>{order.shippingAddress?.line1 || "No address provided"}</p>
                                {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
                                {order.shippingAddress?.city && (
                                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                                )}
                                <p>{order.shippingAddress?.country}</p>
                                <div className="ao-address-phone">
                                  <Phone size={14} /> {order.shippingAddress?.phone || "No phone provided"}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ao-items-container">
                        <div className="ao-items-header-row">
                          <h5 className="ao-items-title">Ordered Items ({order.items?.length || 0})</h5>
                        </div>
                        
                        <div className="ao-items-list">
                          {order.items?.map((item) => {
                            const itemPrice = item.price || item.book?.price || 0;
                            const itemSubtotal = itemPrice * item.quantity;
                            
                            // Make sure item status matches the sync variables
                            const itemStatus = (item.status || "pending").toLowerCase();
                            const isItemDelivered = itemStatus === 'delivered';
                            const isItemCancelled = itemStatus === 'cancelled';
                            
                            const sellerName = item.book?.seller?.name || "You";
                            const imageUrl = item.book?.images?.length > 0 
                                ? (item.book.images[0].url || item.book.images[0]) 
                                : null;

                            return (
                              <div key={item._id} className="ao-new-item-row">
                                <div className="ao-item-main-info">
                                  <div className="ao-item-image">
                                    {imageUrl ? (
                                      <img src={imageUrl} alt={item.book.title} className={`ao-book-img ${isItemCancelled ? 'cancelled-img' : ''}`} />
                                    ) : (
                                      <div className="ao-no-img"><Package size={24} /></div>
                                    )}
                                  </div>
                                  <div className="ao-item-details-text">
                                    <strong className="ao-item-title">{item.book?.title || "Unknown Book"}</strong>
                                    <div className="ao-item-qty">QTY: <span>{item.quantity}</span></div>
                                    <div className="ao-item-seller">
                                      SELLER: 
                                      <span className="ao-seller-name">
                                        <Store size={14} className="ao-store-icon"/> 
                                        {sellerName}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="ao-item-pricing-info">
                                  <div className="ao-price-line">
                                    <span className="ao-price-label">EACH:</span>
                                    <span className="ao-price-value">₹{itemPrice}</span>
                                  </div>
                                  <div className="ao-price-line">
                                    <span className="ao-price-label">SUBTOTAL:</span>
                                    <span className="ao-price-value ao-highlight-price">₹{itemSubtotal}</span>
                                  </div>
                                </div>

                                <div className="ao-item-status-info" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                                  
                                  <div className={`ao-status-badge status-${itemStatus}`} style={{ padding: "4px 10px", width: "auto", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold" }}>
                                     {itemStatus === 'paid' ? 'Processing' : itemStatus.charAt(0).toUpperCase() + itemStatus.slice(1)}
                                  </div>

                                  {isItemDelivered ? (
                                    <div className="ao-delivered-text">
                                      Delivered on {new Date(item.deliveredAt || order.updatedAt).toLocaleDateString()}
                                    </div>
                                  ) : isItemCancelled ? (
                                    <div className="ao-cancelled-text">Item Cancelled</div>
                                  ) : (
                                    <div className="ao-expected-container" style={{ alignItems: "flex-end" }}>
                                      <div className="ao-expected-date" style={{ fontSize: "0.85rem" }}>Exp: {getExpectedDate(order.createdAt)}</div>
                                      <div className="ao-countdown-box" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
                                        <Clock size={12} />
                                        <LiveCountdown orderDate={order.createdAt} />
                                      </div>
                                    </div>
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
            })}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="ao-pagination">
            <button className="ao-page-btn" disabled={currentPage === 1} onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo(0,0); }}>Prev</button>
            <div className="ao-page-numbers">
              {getPageNumbers().map((page, index) => page === "..." ? ( <span key={`dots-${index}`} className="ao-dots">...</span> ) : (
                  <button key={`page-${page}`} className={`ao-page-number ${currentPage === page ? "active" : ""}`} onClick={() => { setCurrentPage(page); window.scrollTo(0,0); }}>{page}</button>
                )
              )}
            </div>
            <button className="ao-page-btn" disabled={currentPage === totalPages} onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0,0); }}>Next</button>
          </div>
        )}

      </div>
    </div>
  );
}

export default SellerOrders;