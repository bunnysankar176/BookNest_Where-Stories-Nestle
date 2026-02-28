import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getProfile, updateProfile } from "../../services/authService";
import {
  User, Mail, Lock, Eye, EyeOff,
  CheckCircle, AlertCircle, Save, Pencil, X, Camera,
  Trash2
} from "lucide-react";
import {
  getAddresses, addAddress, updateAddress, setDefaultAddress, deleteAddress
} from "../../services/profileService";
import "../../styles/Profile.css";

function ProfileForm() {
  const { user, setUser } = useContext(AuthContext);
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    isDefault: false,
  });

  const [profileData, setProfileData] = useState({
    name: "", email: "", avatar: null
  });

  const [formData, setFormData] = useState({
    name: "", email: "", password: ""
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false); 
  const avatarInputRef = useRef(null);

  const [editMode, setEditMode]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [message, setMessage]     = useState({ text: "", type: "" });

  const isAddressValid =
    newAddress.fullName &&
    newAddress.phone &&
    newAddress.line1 &&
    newAddress.city &&
    newAddress.state &&
    newAddress.pincode &&
    newAddress.country;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await getProfile();
        setProfileData({
          name: data.name || "",
          email: data.email || "",
          avatar: data.avatar || null,
        });
        setFormData({
          name: data.name || "",
          email: data.email || "",
          password: "",
        });
        if (data.avatar) setAvatarPreview(data.avatar);
      } catch (err) {
        setMessage({ text: "Failed to load profile.", type: "error" });
      }
    };

   const fetchAddresses = async () => {
  try {
    const data = await getAddresses();
    setAddresses(data);
  } catch (err) {
    console.error("Failed to fetch addresses:", err);
  } finally {
    setLoading(false);
  }
};
    fetchProfileData();
    fetchAddresses();
  }, []);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const resetAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setNewAddress({
      fullName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      country: "",
      isDefault: false,
    });
  };

 const handleSaveAddress = async () => {
  try {
    if (editingAddressId) {
      const data = await updateAddress(editingAddressId, newAddress);
      setAddresses(data.addresses);
    } else {
      const data = await addAddress(newAddress);
      setAddresses(data.addresses);
    }
    resetAddressForm();
  } catch (error) {
    console.error(error);
  }
};


  const handleEditAddress = (addr) => {
    setNewAddress(addr);
    setEditingAddressId(addr._id);
    setShowAddressForm(true);
  };

const handleSetDefault = async (id) => {
  try {
    const data = await setDefaultAddress(id);
    setAddresses(data.addresses);
  } catch (error) {
    console.error(error);
  }
};

const handleDeleteAddress = async (id) => {
  try {
    const data = await deleteAddress(id);
    setAddresses(data.addresses);
  } catch (error) {
    console.error(error);
  }
};


  const handleAvatarClick = () => {
    if (editMode) avatarInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarRemoved(false);
  };

  const handleRemoveAvatar = (e) => {
    e.stopPropagation();
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarRemoved(true);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleEdit = () => {
    setFormData({ ...profileData, password: "" });
    setConfirmPassword("");
    setPasswordError("");
    setMessage({ text: "", type: "" });
    setShowNewPw(false);
    setShowConfirmPw(false);
    setAvatarFile(null);
    setAvatarRemoved(false);
    setEditMode(true);
  };

  const handleCancel = () => {
    setFormData({ ...profileData, password: "" });
    setConfirmPassword("");
    setPasswordError("");
    setMessage({ text: "", type: "" });
    setAvatarFile(null);
    setAvatarRemoved(false);
    setAvatarPreview(profileData.avatar || null);
    setEditMode(false);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (passwordError) setPasswordError("");
    if (message.text) setMessage({ text: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setMessage({ text: "", type: "" });

    if (formData.password) {
      if (!confirmPassword) {
        setPasswordError("Please confirm your new password.");
        return;
      }
      if (formData.password !== confirmPassword) {
        setPasswordError("Passwords do not match. Please try again.");
        return;
      }
      if (formData.password.length < 6) {
        setPasswordError("Password must be at least 6 characters.");
        return;
      }
    }

    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("email", formData.email);

      if (formData.password){ 
        payload.append("password", formData.password);
      }
      if (avatarRemoved) {
        payload.append("avatarRemoved", "true"); 
      } else if (avatarFile) {
        payload.append("avatar", avatarFile); 
      }

      const data = await updateProfile(payload, { headers: { "Content-Type": "multipart/form-data" } });
      setUser(data.user);
      localStorage.setItem("booknest_user", JSON.stringify(data.user));

      let finalAvatar = profileData.avatar;
      if (avatarRemoved) finalAvatar = null;
      if (avatarFile) finalAvatar = avatarPreview;
      if (data.user?.avatar) finalAvatar = data.user.avatar;

      const newProfileData = { ...formData, avatar: finalAvatar, password: "" };
      setProfileData(newProfileData);
      setAvatarPreview(finalAvatar);
      setFormData((prev) => ({ ...prev, password: "" }));
      setConfirmPassword("");
      setAvatarFile(null);
      setAvatarRemoved(false);
      setEditMode(false);
      setMessage({ text: "Profile updated successfully!", type: "success" });
    } catch (err) {
      console.error(err);
      setMessage({
        text: err.response?.data?.message || "Failed to update profile.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const isSeller = user?.role === "seller";
  const isAdmin  = user?.role === "admin";
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === formData.password;
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== formData.password;

  if (loading) return <div className="profile-page"><div className="profile-loading"><div className="profile-spinner" /><p>Loading...</p></div></div>;

  const MainContentWrapper = editMode ? 'form' : 'div';
  const wrapperProps = editMode ? { className: "profile-main-column", onSubmit: handleSubmit, noValidate: true } : { className: "profile-main-column" };

  return (
    <div className="profile-page">
      <div className="profile-container">

        <aside className="profile-avatar-card">
          <div
            className={`profile-avatar${editMode ? " profile-avatar--editable" : ""}`}
            onClick={handleAvatarClick}
            title={editMode ? "Click to change photo" : ""}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="profile-avatar-img" />
            ) : (
              <span>{getInitials(profileData.name)}</span>
            )}
            
            {editMode && (
              <div className="profile-avatar-overlay">
                <Camera size={18} />
                <span>Change</span>
              </div>
            )}
          </div>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="profile-avatar-input"
          />

          {editMode && avatarPreview && (
            <button 
              type="button" 
              className="pf-remove-avatar-btn" 
              onClick={handleRemoveAvatar}
              title="Remove Profile Picture"
            >
              <Trash2 size={14} /> Remove Picture
            </button>
          )}

          <div className="profile-avatar-info">
            <h2 className="profile-display-name">{profileData.name || "—"}</h2>
            <p className="profile-display-email">{profileData.email}</p>
          </div>
          <span className={`profile-role-badge${isSeller ? " seller" : isAdmin ? " admin" : ""}`}>
         {isSeller ? "Seller Account" : isAdmin ? "Admin Account" : "Customer Account"}
        </span>
        </aside>

        <MainContentWrapper {...wrapperProps}>

          {message.text && (
            <div className={`profile-message profile-message--${message.type}`} style={{ marginBottom: '1.5rem' }}>
              {message.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="profile-section-card">
            <div className="profile-form-header">
              <div className="profile-form-header-text">
                <h3>{isSeller ? "Seller Profile" : "My Profile"}</h3>
                <p>Personal account details.</p>
              </div>
              {!editMode && (
                <button className="pf-edit-btn" onClick={handleEdit} type="button">
                  <Pencil size={14} /> Edit Profile
                </button>
              )}
              {editMode && <span className="pf-editing-badge">Editing Mode</span>}
            </div>

            {!editMode ? (
              <div className="pf-view">
                <div className="pf-view-field">
                  <div className="pf-view-icon"><User size={15} /></div>
                  <div className="pf-view-content">
                    <span className="pf-view-label">Full Name</span>
                    <span className="pf-view-value">{profileData.name || "—"}</span>
                  </div>
                </div>
                <div className="pf-view-field">
                  <div className="pf-view-icon"><Mail size={15} /></div>
                  <div className="pf-view-content">
                    <span className="pf-view-label">Email Address</span>
                    <span className="pf-view-value">{profileData.email || "—"}</span>
                  </div>
                </div>
                <div className="pf-view-field">
                  <div className="pf-view-icon"><Lock size={15} /></div>
                  <div className="pf-view-content">
                    <span className="pf-view-label">Password</span>
                    <span className="pf-view-value pf-password-dots">●●●●●●●●</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="profile-form-fields">
                <div className="pf-field">
                  <label className="pf-label">Full Name</label>
                  <div className="pf-input-wrap">
                    <User size={15} className="pf-icon" />
                    <input className="pf-input" type="text" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                </div>
                <div className="pf-field">
                  <label className="pf-label">Email Address</label>
                  <div className="pf-input-wrap">
                    <Mail size={15} className="pf-icon" />
                    <input className="pf-input" type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>

                <div className="pf-section-label-small">
                  Change Password <span style={{fontWeight:'400', color:'var(--text-light)'}}>(Optional)</span>
                </div>

                <div className="pf-field">
                  <div className="pf-input-wrap">
                    <Lock size={15} className="pf-icon" />
                    <input 
                      className="pf-input pf-input--has-action" 
                      type={showNewPw ? "text" : "password"} 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      placeholder="New password" 
                    />
                    <button type="button" className="pf-toggle-pw" onClick={() => setShowNewPw(!showNewPw)}>
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {formData.password.length > 0 && (
                  <div className="pf-field">
                    <div className="pf-input-wrap">
                      <Lock size={15} className="pf-icon" />
                      <input 
                        className={`pf-input pf-input--has-action ${passwordsMismatch ? "pf-input--error" : ""} ${passwordsMatch ? "pf-input--ok" : ""}`} 
                        type={showConfirmPw ? "text" : "password"} 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        placeholder="Confirm new password" 
                      />
                      <button type="button" className="pf-toggle-pw" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                        {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      
                      {confirmPassword.length > 0 && (
                        <div className="pf-match-icon" style={{ right: '2.8rem' }}>
                          {passwordsMatch ? <CheckCircle size={15} className="pf-match-ok" /> : <AlertCircle size={15} className="pf-match-err" />}
                        </div>
                      )}
                    </div>

                    {confirmPassword.length > 0 && (
                      <span className={`pf-field-hint${passwordsMatch ? " ok" : " err"}`}>
                        {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                      </span>
                    )}
                  </div>
                )}
                
                {/* MOVED THE ACTIONS HERE (BELOW THE PROFILE INPUTS) */}
                <div className="pf-global-actions" style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                  <button type="button" className="pf-cancel-btn" onClick={handleCancel} disabled={saving}>
                    <X size={15} /> Cancel
                  </button>
                  <button type="submit" className="pf-submit-btn" disabled={saving}>
                    {saving ? <><div className="pf-btn-spinner" />Saving...</> : <><Save size={16} />Save Changes</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="profile-section-card">
            <div className="profile-form-header">
              <div className="profile-form-header-text">
                <h3>Saved Addresses</h3>
                <p>Manage delivery addresses.</p>
              </div>
              <button
                type="button"
                className="pf-edit-btn"
                onClick={() => {
                  resetAddressForm();
                  setShowAddressForm(!showAddressForm);
                }}
              >
                + Add Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <p style={{ color: "var(--text-light)" }}>No saved addresses.</p>
            ) : (
              addresses.map((addr) => (
                <div key={addr._id} className="address-card" style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid var(--border-light)", borderRadius: "var(--radius)" }}>
                  <div>
                    <strong>{addr.fullName}</strong>
                    {addr.isDefault && (
                      <span className="default-badge" style={{ marginLeft: "0.5rem", fontSize: "0.75rem", background: "var(--primary-subtle)", color: "var(--primary)", padding: "0.2rem 0.5rem", borderRadius: "100px" }}>Default</span>
                    )}
                    <p style={{ margin: "0.5rem 0", color: "var(--text-gray)", fontSize: "0.875rem" }}>
                      {addr.line1}, {addr.line2 && `${addr.line2}, `}
                      {addr.city}, {addr.state} - {addr.pincode}, {addr.country}
                    </p>
                    <p style={{ margin: "0", color: "var(--text-dark)", fontSize: "0.875rem" }}>{addr.phone}</p>
                  </div>

                  <div className="address-actions" style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    <button type="button" onClick={() => handleEditAddress(addr)} style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", cursor: "pointer", border: "1px solid var(--border)", borderRadius: "4px", background: "transparent" }}>Edit</button>
                    {!addr.isDefault && (
                      <button type="button" onClick={() => handleSetDefault(addr._id)} style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", cursor: "pointer", border: "1px solid var(--border)", borderRadius: "4px", background: "transparent" }}>
                        Set Default
                      </button>
                    )}
                    
                    {/* Updated Delete Button logic */}
                    <button 
                      type="button" 
                      onClick={() => !addr.isDefault && handleDeleteAddress(addr._id)} 
                      disabled={addr.isDefault}
                      style={{ 
                        padding: "0.3rem 0.6rem", 
                        fontSize: "0.8rem", 
                        cursor: addr.isDefault ? "not-allowed" : "pointer", 
                        border: "1px solid rgba(239,68,68,0.3)", 
                        borderRadius: "4px", 
                        background: "transparent", 
                        color: addr.isDefault ? "var(--text-light)" : "var(--danger)",
                        opacity: addr.isDefault ? 0.6 : 1
                      }}>
                      Delete
                    </button>
                  </div>
                  
                  {/* NEW DISCLAIMER MESSAGE FOR DEFAULT ADDRESS */}
                  {addr.isDefault && (
                     <p style={{ marginTop: "0.75rem", marginBottom: "0", fontSize: "0.75rem", color: "var(--text-light)", fontStyle: "italic" }}>
                       * Default address can be modified but not deleted.
                     </p>
                  )}
                </div>
              ))
            )}

            {showAddressForm && (
              <div className="address-form" style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", background: "var(--bg-light)", padding: "1.25rem", borderRadius: "var(--radius)" }}>
                <h4 style={{ margin: "0 0 0.5rem 0" }}>{editingAddressId ? "Edit Address" : "Add New Address"}</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <input className="pf-input" placeholder="Full Name" value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} />
                  <input className="pf-input" placeholder="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
                </div>
                <input className="pf-input" placeholder="Address Line 1" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} />
                <input className="pf-input" placeholder="Address Line 2 (Optional)" value={newAddress.line2 || ""} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <input className="pf-input" placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                  <input className="pf-input" placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <input className="pf-input" placeholder="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                  <input className="pf-input" placeholder="Country" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} />
                </div>
                
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                  <input type="checkbox" checked={newAddress.isDefault} onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })} />
                  Set as default address
                </label>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button type="button" onClick={handleSaveAddress} disabled={!isAddressValid} className="pf-submit-btn" style={{ flex: 1, padding: "0.6rem" }}>
                    {editingAddressId ? "Update Address" : "Save Address"}
                  </button>
                  <button type="button" onClick={resetAddressForm} className="pf-cancel-btn" style={{ flex: 1, padding: "0.6rem" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </MainContentWrapper>
      </div>
    </div>
  );
}

export default ProfileForm;