import { useState } from "react";
import { addUser, addSeller } from "../../services/adminService";
import { 
  UserPlus, Store, Loader2, User, Mail, Lock, 
  CheckCircle2, AlertCircle 
} from "lucide-react";
import "../../styles/AdminCreateAccounts.css";

function AdminCreateAccounts() {
  const [accountType, setAccountType] = useState("user");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    // Auto-hide the message after 4 seconds
    setTimeout(() => {
      setNotification({ type: "", message: "" });
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification({ type: "", message: "" }); // Clear any old messages

    try {
      if (accountType === "user") {
        await addUser(formData);
        showNotification("success", "User account created successfully!");
      } else {
        await addSeller(formData);
        showNotification("success", "Seller account created successfully!");
      }
      setFormData({ name: "", email: "", password: "" });
    } catch (error) {
      showNotification(
        "error", 
        error.response?.data?.message || "Something went wrong while creating the account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ac-wrapper">
      <div className="ac-container">
        {/* Header Section */}
        <div className="ac-header">
          <div className="ac-icon-wrapper">
            {accountType === "user" ? <UserPlus size={28} /> : <Store size={28} />}
          </div>
          <h2 className="ac-title">Create New Account</h2>
          <p className="ac-subtitle">
            Register a new {accountType === "user" ? "customer" : "seller"} to the platform.
          </p>
        </div>

        {/* Custom Segmented Toggle */}
        <div className="ac-toggle-container">
          <button
            type="button"
            onClick={() => setAccountType("user")}
            className={`ac-toggle-btn ${accountType === "user" ? "active" : ""}`}
          >
            <UserPlus size={18} />
            <span>Add User</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("seller")}
            className={`ac-toggle-btn ${accountType === "seller" ? "active" : ""}`}
          >
            <Store size={18} />
            <span>Add Seller</span>
          </button>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="ac-form">
          
          {/* --- Custom Notification Alert --- */}
          {notification.message && (
            <div className={`ac-alert ac-alert-${notification.type}`}>
              {notification.type === "success" ? (
                <CheckCircle2 size={18} className="ac-alert-icon" />
              ) : (
                <AlertCircle size={18} className="ac-alert-icon" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          <div className="ac-input-group">
            <label>Full Name</label>
            <div className="ac-input-wrapper">
              <User size={18} className="ac-input-icon" />
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

          <div className="ac-input-group">
            <label>Email Address</label>
            <div className="ac-input-wrapper">
              <Mail size={18} className="ac-input-icon" />
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

          <div className="ac-input-group">
            <label>Password</label>
            <div className="ac-input-wrapper">
              <Lock size={18} className="ac-input-icon" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter a secure password"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="ac-submit-btn">
            {loading ? (
              <>
                <Loader2 className="ac-spin" size={18} />
                <span>Creating...</span>
              </>
            ) : (
              <>
                {accountType === "user" ? <UserPlus size={18} /> : <Store size={18} />}
                <span>Create {accountType === "user" ? "User" : "Seller"}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminCreateAccounts;