import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Lock,
  Truck,
  MapPin,
  Plus,
  Edit2,
  X,
  CheckCircle2
} from "lucide-react";
import {
  getAddresses,
  addAddress,
  updateAddress
} from "../../services/profileService";
import "../../styles/Checkout.css";

function Checkout() {
  const { cartItems, totalPrice } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [modalData, setModalData] = useState({
    _id: null,
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    isDefault: false
  });

 useEffect(() => {
  const fetchAddresses = async () => {
    try {
      const data = await getAddresses();

      if (Array.isArray(data)) {
        setSavedAddresses(data);

        const defaultAddr = data.find(addr => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
        } else if (data.length > 0) {
          setSelectedAddressId(data[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to load addresses:", error);
    }
  };

  if (user) fetchAddresses();
}, [user]);

  const openAddModal = () => {
    setModalError("");
    setModalData({
      _id: null,
      fullName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      isDefault: savedAddresses.length === 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (address, e) => {
    e.stopPropagation(); 
    setModalError("");
    setModalData({ ...address });
    setIsModalOpen(true);
  };

  const handleModalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setModalData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (modalError) setModalError("");
  };

  const validateModal = () => {
    const { fullName, phone, line1, city, state, country, pincode } = modalData;
    if (!fullName || !phone || !line1 || !city || !state || !country || !pincode) {
      return "Please fill in all required fields.";
    }
    if (phone.length < 10) return "Please enter a valid phone number.";
    return null;
  };

 const handleSaveAddress = async () => {
  const error = validateModal();
  if (error) {
    setModalError(error);
    return;
  }

  setIsSaving(true);

  try {
    const isEdit = !!modalData._id;
    let data;

    if (isEdit) {
      data = await updateAddress(modalData._id, modalData);
      setSelectedAddressId(modalData._id);
    } else {
      data = await addAddress(modalData);
      const newAddr = data.addresses[data.addresses.length - 1];
      setSelectedAddressId(newAddr._id);
    }

    setSavedAddresses(data.addresses);
    setIsModalOpen(false);
  } catch (err) {
    setModalError(err.response?.data?.message || "Something went wrong.");
  } finally {
    setIsSaving(false);
  }
};


  const handleProceedPayment = () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address to proceed.");
      return;
    }

    navigate("/user/payment", {
      state: {
        cartItems,
        totalPrice,
        addressId: selectedAddressId,
      },
    });
  };

  const getBookImage = (book) =>
    book.coverImage?.trim() ||
    book.image?.trim() ||
    book.images?.[0]?.url ||
    null;

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <ShoppingBag size={64} className="empty-icon-circle" />
          <h3>Your bag is empty</h3>
          <p>Looks like you haven't added any books to your cart yet.</p>
          <Link to="/books" className="checkout-browse-btn">
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        
        <div className="checkout-header">
          <h1 className="checkout-title">Secure Checkout</h1>
          <p className="checkout-subtitle">Review your order details and select a shipping destination.</p>
        </div>

        <div className="checkout-layout">

          {/* LEFT COLUMN: ADDRESS SELECTION */}
          <div className="checkout-left">
            <div className="checkout-section">
              <div className="checkout-section-header">
                <h2><MapPin size={20} /> Delivery Address</h2>
                <button className="add-address-btn-text" onClick={openAddModal}>
                  <Plus size={16} /> Add New
                </button>
              </div>

              <div className="address-list">
                {savedAddresses.length === 0 ? (
                  <div className="no-address-box">
                    <p>You don't have any saved addresses.</p>
                    <button className="btn-outline" onClick={openAddModal}>
                      Add an Address
                    </button>
                  </div>
                ) : (
                  savedAddresses.map(addr => {
                    const isSelected = selectedAddressId === addr._id;
                    return (
                      <div 
                        key={addr._id} 
                        className={`address-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedAddressId(addr._id)}
                      >
                        <div className="address-card-header">
                          <div className="address-name-wrap">
                            <span className="address-name">{addr.fullName}</span>
                            {addr.isDefault && <span className="badge-default">Default</span>}
                          </div>
                          <button 
                            className="address-edit-btn" 
                            onClick={(e) => openEditModal(addr, e)}
                            title="Edit Address"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                        <p className="address-phone">{addr.phone}</p>
                        <p className="address-text">
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                        </p>
                        <p className="address-text">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="address-text">{addr.country}</p>
                        
                        {isSelected && (
                          <div className="address-selected-icon">
                            <CheckCircle2 size={20} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <div className="checkout-right">
            <div className="checkout-summary-card">
              <h2 className="summary-title">
                Order Summary <span className="summary-count">({itemCount} items)</span>
              </h2>

              <div className="checkout-items-scroll">
                {cartItems.map((item) => {
                  const book = item.book;
                  const img = getBookImage(book);

                  return (
                    <div key={item._id} className="checkout-item">
                      <div className="checkout-item-image">
                        {img ? <img src={img} alt={book.title} /> : <div className="img-placeholder" />}
                        <span className="checkout-qty-badge">{item.quantity}</span>
                      </div>
                      <div className="checkout-item-info">
                        <strong className="checkout-item-title">{book.title}</strong>
                        <div className="checkout-item-price-wrap">
                          <span className="checkout-item-price">
                            ₹{(book.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="checkout-price-rows">
                <div className="checkout-price-row">
                  <span>Subtotal</span>
                  <span>₹{Number(totalPrice).toFixed(2)}</span>
                </div>
                <div className="checkout-price-row">
                  <span>Shipping</span>
                  <span className="checkout-free">Free</span>
                </div>
              </div>

              <div className="checkout-total">
                <span className="checkout-total-label">Total to Pay</span>
                <span className="checkout-total-value">₹{Number(totalPrice).toFixed(2)}</span>
              </div>

              <button
                className="checkout-pay-btn"
                onClick={handleProceedPayment}
                disabled={!selectedAddressId}
              >
                Proceed to Payment <ArrowRight size={18} />
              </button>

              <div className="trust-box">
                <div className="trust-item"><Lock size={15} /> Secure Checkout</div>
                <div className="trust-item"><Truck size={15} /> Free Delivery</div>
                <div className="trust-item"><ShieldCheck size={15} /> Buyer Protection</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalData._id ? "Edit Address" : "Add New Address"}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {modalError && <div className="modal-error">{modalError}</div>}
              
              <div className="modal-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="fullName" value={modalData.fullName} onChange={handleModalChange} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="text" name="phone" value={modalData.phone} onChange={handleModalChange} placeholder="10-digit number" />
                </div>
                
                <div className="form-group full-width">
                  <label>Address Line 1 *</label>
                  <input type="text" name="line1" value={modalData.line1} onChange={handleModalChange} placeholder="House No, Building, Street" />
                </div>
                <div className="form-group full-width">
                  <label>Address Line 2 (Optional)</label>
                  <input type="text" name="line2" value={modalData.line2} onChange={handleModalChange} placeholder="Locality, Area, Landmark" />
                </div>

                <div className="form-group">
                  <label>City *</label>
                  <input type="text" name="city" value={modalData.city} onChange={handleModalChange} placeholder="City" />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input type="text" name="state" value={modalData.state} onChange={handleModalChange} placeholder="State" />
                </div>

                <div className="form-group">
                  <label>Pincode *</label>
                  <input type="text" name="pincode" value={modalData.pincode} onChange={handleModalChange} placeholder="Zip/Pincode" />
                </div>
                <div className="form-group">
                  <label>Country *</label>
                  <input type="text" name="country" value={modalData.country} onChange={handleModalChange} placeholder="Country" />
                </div>
                
                <div className="form-group full-width checkbox-group">
                  <label>
                    <input type="checkbox" name="isDefault" checked={modalData.isDefault} onChange={handleModalChange} />
                    Set as default delivery address
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveAddress} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Address"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Checkout;