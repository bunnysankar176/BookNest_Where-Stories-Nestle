import React, { useEffect, useState, useMemo } from "react";
import { getSellers, approveSeller, rejectSeller } from "../../services/adminService";
import { 
  Store, Search, CheckCircle, Clock, ShieldCheck, 
  ChevronLeft, ChevronRight, XCircle, Mail, Filter, 
  AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";
import "../../styles/ManageSellers.css";

function ManageSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [expandedId, setExpandedId] = useState(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false, type: null, seller: null
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: "", message: "" });
    }, 4000);
  };

  const fetchSellers = async () => {
    try {
      const data = await getSellers();
      setSellers(data || []);
    } catch (error) {
      console.error("Failed to fetch sellers", error);
      showNotification("error", "Failed to load seller data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSellers(); }, []);

  const filteredSellers = useMemo(() => {
    let filtered = sellers.filter(seller => {
      const matchesSearch = seller.name.toLowerCase().includes(searchTerm.toLowerCase()) || seller.email.toLowerCase().includes(searchTerm.toLowerCase());
      const sellerStatus = (seller.status || "pending").toLowerCase();
      const matchesStatus = statusFilter === "all" || sellerStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // --- SORTING LOGIC: Newest First ---
    // Sorts chronologically descending (newest at the top)
    // Uses createdAt if available, otherwise safely relies on MongoDB's chronological _id
    filtered.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return b._id.localeCompare(a._id);
    });

    return filtered;
  }, [sellers, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage);
  const paginatedSellers = filteredSellers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const toggleExpand = (id) => { setExpandedId(prev => prev === id ? null : id); };

  const openConfirmModal = (type, seller) => {
    setModalConfig({ isOpen: true, type, seller });
  };

  const handleConfirmAction = async () => {
    const { type, seller } = modalConfig;
    if (!seller) return;
    setIsProcessing(true);
    setNotification({ type: "", message: "" });

    try {
      if (type === 'approve') {
        await approveSeller(seller._id);
        setSellers(prev => prev.map(s => s._id === seller._id ? { ...s, status: 'approved' } : s));
        showNotification("success", "Seller has been approved successfully.");
      } else if (type === 'reject') {
         await rejectSeller(seller._id);
        setSellers(prev => prev.map(s => s._id === seller._id ? { ...s, status: 'rejected' } : s));
        showNotification("success", "Seller has been rejected.");
      }
    } catch (error) {
      showNotification("error", `Failed to ${type} the seller. Please try again.`);
    } finally {
      setIsProcessing(false);
      setExpandedId(null);
      setModalConfig({ isOpen: false, type: null, seller: null });
    }
  };

  const renderStatusBadge = (seller) => {
    const status = (seller.status || "pending").toLowerCase();
    if (status === 'approved') return <span className="ms-badge ms-badge-success"><CheckCircle size={14} /> Approved</span>;
    if (status === 'rejected') return <span className="ms-badge ms-badge-danger"><XCircle size={14} /> Rejected</span>;
    return <span className="ms-badge ms-badge-warning"><Clock size={14} /> Pending</span>;
  };

  if (loading) return <div className="ms-loader"><div className="ms-spinner"></div></div>;

  return (
    <div className="ms-container">
      
      {/* --- Floating Toast Notification --- */}
      {notification.message && (
        <div className={`ms-toast ms-toast-${notification.type}`}>
          {notification.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="ms-header-card">
        <div className="ms-header-title">
          <div className="ms-icon-wrapper ms-bg-purple-light ms-text-purple">
            <Store size={24} />
          </div>
          <div>
            <h2>Manage Sellers</h2>
            <p>Review, approve or reject seller registrations on the platform.</p>
          </div>
        </div>

        <div className="ms-controls-row">
          <div className="ms-search-box">
            <Search size={18} className="ms-search-icon" />
            <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="ms-filter-box">
            <Filter size={18} className="ms-search-icon" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="ms-table-card">
        <div className="ms-table-responsive">
          <table className="ms-table">
            <thead>
              <tr>
                <th>Seller Info</th>
                <th>Email Address</th>
                <th>Status</th>
                <th className="ms-text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSellers.length > 0 ? (
                paginatedSellers.map(seller => {
                  const status = (seller.status || "pending").toLowerCase();
                  const isExpanded = expandedId === seller._id;
                  
                  return (
                    <React.Fragment key={seller._id}>
                      <tr className={isExpanded ? "ms-row-active" : ""}>
                        <td>
                          <div className="ms-user-info">
                            <div className="ms-avatar ms-bg-purple-gradient">{seller.name.charAt(0).toUpperCase()}</div>
                            <div className="ms-user-texts">
                              <strong>{seller.name}</strong>
                              <span className="ms-id">ID: {seller._id.slice(-6).toUpperCase()}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="ms-email-badge">
                            <Mail size={14} className="ms-text-muted" />
                            <span>{seller.email}</span>
                          </div>
                        </td>
                        <td>{renderStatusBadge(seller)}</td>
                        <td className="ms-text-right">
                          {status === 'pending' ? (
                            <button 
                              className={`ms-btn-action ms-btn-action-needed ${isExpanded ? 'active' : ''}`} 
                              onClick={() => toggleExpand(seller._id)}
                            >
                              Action Needed {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          ) : (
                            <span className="ms-text-muted-italic">No action needed</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && status === 'pending' && (
                        <tr className="ms-expanded-row-tr">
                          <td colSpan="4" className="ms-expanded-cell">
                            <div className="ms-expanded-content">
                              <span className="ms-expanded-text">Please review and select an action for this seller:</span>
                              <div className="ms-expanded-actions">
                                <button className="ms-btn-approve-expand" onClick={() => openConfirmModal('approve', seller)}>
                                  <ShieldCheck size={18} /> Approve Seller
                                </button>
                                <button className="ms-btn-reject-expand" onClick={() => openConfirmModal('reject', seller)}>
                                  <XCircle size={18} /> Reject Seller
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              ) : (
                <tr><td colSpan="4" className="ms-empty-state">No sellers found matching your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ms-mobile-grid">
        {paginatedSellers.map(seller => {
          const status = (seller.status || "pending").toLowerCase();
          const isExpanded = expandedId === seller._id;

          return (
            <div key={seller._id} className="ms-mobile-card">
              <div className="ms-mobile-card-top">
                <div className="ms-avatar ms-bg-purple-gradient">{seller.name.charAt(0).toUpperCase()}</div>
                <div className="ms-user-texts">
                  <strong>{seller.name}</strong>
                  <div className="ms-email-badge ms-mt-1"><Mail size={12} className="ms-text-muted" /><span>{seller.email}</span></div>
                </div>
              </div>
              <div className="ms-mobile-card-bottom">
                {renderStatusBadge(seller)}
                {status === 'pending' && (
                  <button 
                    className={`ms-btn-action ms-btn-action-needed ${isExpanded ? 'active' : ''}`} 
                    onClick={() => toggleExpand(seller._id)}
                  >
                    Action Needed {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>
              
              {isExpanded && status === 'pending' && (
                <div className="ms-mobile-expanded-area">
                  <button className="ms-btn-approve-expand" onClick={() => openConfirmModal('approve', seller)}>
                    <ShieldCheck size={18} /> Approve
                  </button>
                  <button className="ms-btn-reject-expand" onClick={() => openConfirmModal('reject', seller)}>
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="ms-pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={18} /> Prev</button>
          <span className="ms-page-info">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next <ChevronRight size={18} /></button>
        </div>
      )}

      {modalConfig.isOpen && modalConfig.seller && (
        <div className="ms-modal-backdrop">
          <div className="ms-modal">
            <div className={`ms-modal-icon ${modalConfig.type === 'approve' ? 'ms-bg-green-light ms-text-green' : 'ms-bg-red-light ms-text-red'}`}>
              {modalConfig.type === 'approve' ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
            </div>
            <h3>{modalConfig.type === 'approve' ? 'Approve Seller?' : 'Reject Seller?'}</h3>
            <p>Please confirm the details below before proceeding.</p>
            <div className="ms-modal-details">
              <div className="ms-detail-row"><span className="ms-detail-label">Name</span><span className="ms-detail-value">{modalConfig.seller.name}</span></div>
              <div className="ms-detail-row"><span className="ms-detail-label">Email</span><span className="ms-detail-value ms-text-primary">{modalConfig.seller.email}</span></div>
              <div className="ms-detail-row"><span className="ms-detail-label">Seller ID</span><span className="ms-detail-value ms-font-mono">{modalConfig.seller._id}</span></div>
            </div>
            <p className="ms-warning-text">
              {modalConfig.type === 'approve' ? "Approval allows the seller to sell and manage the books." : "Rejecting prevents accessing seller features."}
            </p>
            <div className="ms-modal-actions">
              <button className="ms-btn-cancel" onClick={() => setModalConfig({ isOpen: false, type: null, seller: null })} disabled={isProcessing}>Cancel</button>
              <button className={modalConfig.type === 'approve' ? "ms-btn-confirm-success" : "ms-btn-confirm-danger"} onClick={handleConfirmAction} disabled={isProcessing}>
                {isProcessing ? <span className="ms-spinner-small"></span> : (modalConfig.type === 'approve' ? "Yes, Approve" : "Yes, Reject")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageSellers;