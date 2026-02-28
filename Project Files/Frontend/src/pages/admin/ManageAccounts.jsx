import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Search, Trash2, AlertTriangle, 
  ChevronLeft, ChevronRight, UserCog, Edit,
  CheckCircle2, AlertCircle, Mail, Store, User // Added Store and User icons
} from "lucide-react";
import { getUsers, getSellers, deleteUser, deleteSeller } from "../../services/adminService";
import "../../styles/ManageAccounts.css";

function ManageAccounts() {
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [accountFilter, setAccountFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [showModal, setShowModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [notification, setNotification] = useState({ type: "", message: "" });
  const navigate = useNavigate();

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: "", message: "" });
    }, 4000);
  };

  const fetchAccounts = async () => {
    try {
      const [usersData, sellersData] = await Promise.all([
        getUsers(),
        getSellers(),
      ]);
      setUsers(usersData || []);
      setSellers(sellersData || []);
    } catch (error) {
      console.error("Failed to fetch accounts", error);
      showNotification("error", "Failed to load accounts from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const accountsToShow =
    accountFilter === "user"
      ? users
      : accountFilter === "seller"
      ? sellers
      : [...users, ...sellers];

  const filteredUsers = useMemo(() => {
    let filtered = accountsToShow;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.role?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user._id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) 
      );
    }
    return filtered;
  }, [accountsToShow, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, accountFilter]);

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      if (userToDelete.role === "seller") {
        await deleteSeller(userToDelete._id);
        setSellers(prev => prev.filter(s => s._id !== userToDelete._id));
      } else {
        await deleteUser(userToDelete._id);
        setUsers(prev => prev.filter(u => u._id !== userToDelete._id));
      }

      showNotification("success", "Account deleted successfully.");
      setShowModal(false);
      setUserToDelete(null);

      if (paginatedUsers.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }

    } catch (error) {
      console.error("Delete failed:", error);
      showNotification("error", "Failed to delete account. Please try again.");
      setShowModal(false);
    }
  };

  if (loading) return (
    <div className="mu-loader">
      <div className="mu-spinner"></div>
      <p>Loading accounts...</p>
    </div>
  );

  return (
    <div className="mu-container">
      
      {/* Floating Notification */}
      {notification.message && (
        <div className={`mu-toast mu-toast-${notification.type}`}>
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="mu-header-card">
        <div className="mu-header-main">
          <div className="mu-header-title">
            <div className="mu-icon-wrapper">
              <Users size={28} />
            </div>
            <div>
              <h2>Manage Accounts</h2>
              <p>View, edit, and manage all registered users and sellers.</p>
            </div>
          </div>
        </div>

        <div className="mu-controls-wrapper">
          <div className="mu-search-box">
            <Search size={18} className="mu-search-icon" />
            <input 
              type="text" 
              placeholder="Search by name, email, role, or ID..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          <div className="mu-toggle-group">
            <button
              className={`mu-toggle-btn ${accountFilter === "all" ? "active" : ""}`}
              onClick={() => setAccountFilter("all")}
            >
              All
            </button>
            <button
              className={`mu-toggle-btn ${accountFilter === "user" ? "active" : ""}`}
              onClick={() => setAccountFilter("user")}
            >
              Users
            </button>
            <button
              className={`mu-toggle-btn ${accountFilter === "seller" ? "active" : ""}`}
              onClick={() => setAccountFilter("seller")}
            >
              Sellers
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="mu-table-card">
        <div className="mu-table-responsive">
          <table className="mu-table">
            <thead>
              <tr>
                <th>Account Details</th>
                <th>Contact Information</th>
                <th>Role Level</th>
                <th className="mu-text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="mu-user-info">
                        <div className="mu-avatar">
                          {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div className="mu-user-texts">
                          <strong>{user.name || "Unknown"}</strong>
                          <span className="mu-id">ID: {user._id?.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="mu-email-pill">
                        <Mail size={14} />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      {/* UPDATED: Dynamic Role Icons added here */}
                      <span className={`mu-role-badge role-${user.role || 'user'}`}>
                        {user.role === 'admin' && <UserCog size={14} className="mu-mr-1" />} 
                        {user.role === 'seller' && <Store size={14} className="mu-mr-1" />} 
                        {(user.role === 'user' || !user.role) && <User size={14} className="mu-mr-1" />} 
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="mu-text-right">
                      <div className="mu-action-cell">
                        <button
                          className="mu-btn-action mu-btn-edit"
                          onClick={() => navigate(`/admin/edit-account/${user._id}`)}
                          title="Edit Account"
                        >
                          <Edit size={16} />
                        </button>

                        {user.role !== "admin" && (
                          <button
                            className="mu-btn-action mu-btn-delete"
                            onClick={() => confirmDelete(user)}
                            title="Delete Account"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="mu-empty-state">
                    <Search size={32} className="mu-empty-icon" />
                    <p>No accounts found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Grid View */}
      <div className="mu-mobile-grid">
        {paginatedUsers.length > 0 ? paginatedUsers.map(user => (
          <div key={user._id} className="mu-mobile-card">
            <div className="mu-mobile-card-top">
              <div className="mu-avatar">{user.name ? user.name.charAt(0).toUpperCase() : "?"}</div>
              <div className="mu-user-texts">
                <strong>{user.name || "Unknown"}</strong>
                <span className="mu-id">ID: {user._id?.slice(-6).toUpperCase()}</span>
                
                <div className="mu-email-pill mu-mt-2">
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
                
                {/* UPDATED: Dynamic Role Icons added here */}
                <span className={`mu-role-badge role-${user.role || 'user'} mu-mt-2`}>
                  {user.role === 'admin' && <UserCog size={14} className="mu-mr-1" />} 
                  {user.role === 'seller' && <Store size={14} className="mu-mr-1" />} 
                  {(user.role === 'user' || !user.role) && <User size={14} className="mu-mr-1" />} 
                  {user.role || 'user'}
                </span>
              </div>
            </div>
            <div className="mu-mobile-card-bottom">
              <button 
                className="mu-btn-mobile-action mu-btn-edit-mobile" 
                onClick={() => navigate(`/admin/edit-account/${user._id}`)}
              >
                <Edit size={16} /> Edit
              </button>
              
              {user.role !== 'admin' && (
                <button 
                  className="mu-btn-mobile-action mu-btn-delete-mobile" 
                  onClick={() => confirmDelete(user)}
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="mu-empty-state mu-card-empty">
            <p>No accounts found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mu-pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft size={18} /> Prev
          </button>
          <span className="mu-page-info">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className="mu-modal-backdrop">
          <div className="mu-modal">
            <div className="mu-modal-icon">
              <AlertTriangle size={32} />
            </div>
            <h3>Delete Account?</h3>
            <p>Are you sure you want to permanently delete <strong>{userToDelete?.name}</strong>? This action cannot be undone.</p>
            <div className="mu-modal-actions">
              <button className="mu-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="mu-btn-confirm-danger" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageAccounts;