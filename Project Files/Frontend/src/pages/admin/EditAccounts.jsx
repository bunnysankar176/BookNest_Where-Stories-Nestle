import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  updateAccount,
  getAccountById
} from "../../services/adminService";
import { 
  UserCog, ArrowLeft, Loader2, User, Mail, 
  Save, CheckCircle2, AlertCircle, Store 
} from "lucide-react";
import "../../styles/EditAccounts.css";

function EditAccounts() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const accountType = formData.role;
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Custom inline notification handler
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: "", message: "" });
    }, 4000);
  };

useEffect(() => {
  const fetchAccount = async () => {
    try {
      const account = await getAccountById(id);

      setFormData({
        name: account.name,
        email: account.email,
        role: account.role
      });

    } catch (error) {
      console.error("Failed to fetch account", error);
      showNotification("error","Failed to load account details.");
    } finally {
      setLoading(false);
    }
  };

  fetchAccount();
}, [id]);
    

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotification({ type: "", message: "" });

    try {
      await updateAccount(id, formData);

      showNotification("success", "Account updated successfully!");
      
      // Optional: Navigate back after a short delay on success
      setTimeout(() => {
        navigate(-1);
      }, 1500);

    } catch (error) {
  console.error("Update failed:", error);

  const backendMessage =
    error.response?.data?.message || "Failed to update account.";

  showNotification("error", backendMessage);
} finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ea-wrapper ea-loading-screen">
        <Loader2 className="ea-spin" size={48} />
        <p>Loading account details...</p>
      </div>
    );
  }

  return (
    <div className="ea-wrapper">
      <div className="ea-container">
        
        {/* Top Actions */}
        <div className="ea-top-actions">
          <button onClick={() => navigate(-1)} className="ea-back-btn" type="button">
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
        </div>

        {/* Header Section */}
        <div className="ea-header">
          <div className="ea-icon-wrapper">
            <UserCog size={28} />
          </div>
          <h2 className="ea-title">Edit Account</h2>
          <p className="ea-subtitle">Update details and permissions for this user.</p>
        </div>

        {/* Custom Segmented Toggle */}
        <div className="ea-toggle-container">
          <button
            type="button"
            className={`ea-toggle-btn ${accountType === "user" ? "active" : ""}`}
            onClick={() => {
  setFormData(prev => ({
    ...prev,
    role: "user"
  }));
}}
          >
            <User size={18} />
            <span>User</span>
          </button>
          <button
            type="button"
            className={`ea-toggle-btn ${accountType === "seller" ? "active" : ""}`}
            onClick={() => {
  setFormData(prev => ({
    ...prev,
    role: "seller"
  }));
}}
          >
            <Store size={18} />
            <span>Seller</span>
          </button>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="ea-form">
          
          {/* --- Custom Notification Alert --- */}
          {notification.message && (
            <div className={`ea-alert ea-alert-${notification.type}`}>
              {notification.type === "success" ? (
                <CheckCircle2 size={18} className="ea-alert-icon" />
              ) : (
                <AlertCircle size={18} className="ea-alert-icon" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          <div className="ea-input-group">
            <label>Full Name</label>
            <div className="ea-input-wrapper">
              <User size={18} className="ea-input-icon" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ben Tennyson"
                required
              />
            </div>
          </div>

          <div className="ea-input-group">
            <label>Email Address</label>
            <div className="ea-input-wrapper">
              <Mail size={18} className="ea-input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. ben10@example.com"
                required
              />
            </div>
          </div>

          <div className="ea-form-actions">
            <button type="button" onClick={() => navigate(-1)} className="ea-cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="ea-save-btn">
              {saving ? (
                <>
                  <Loader2 className="ea-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Update Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditAccounts;