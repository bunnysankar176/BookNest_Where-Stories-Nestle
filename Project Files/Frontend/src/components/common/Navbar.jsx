import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Package, 
  ChevronDown, 
  Menu, 
  X,
  AlertTriangle,
  History 
} from "lucide-react";
import "../../styles/Navbar.css";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setUserMenuOpen(false); 
    setShowLogoutConfirm(true); 
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // 2. FIXED: Exact match for the Home ('/') path so it doesn't stay highlighted everywhere
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          
          {/* BRAND SECTION */}
          <Link to="/" className="nav-brand" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-logo-wrapper">
              <img
                src="BookNestLogo.png" 
                alt="BookNest" 
                className="brand-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="logo-fallback">B</div>

              {/* --- NEW: Hover Popup Logo --- */}
              <div className="logo-popup">
                <img src="BookNestLogo.png" alt="BookNest Detailed Logo" />
              </div>
            </div>
            
            <div className="brand-text">
              <span className="brand-title">BookNest</span>
              <span className="brand-tagline">Where stories nestle</span>
            </div>
          </Link>

          {/* MOBILE MENU TOGGLE */}
          <div 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </div>

          {/* LINKS SECTION */}
          <div className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
            <Link 
              className={`nav-link ${isActive('/') ? 'active' : ''}`} 
              to="/"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            <Link 
              className={`nav-link ${isActive('/books') ? 'active' : ''}`} 
              to="/books"
              onClick={() => setMobileMenuOpen(false)}
            >
              Books
            </Link>

            {user?.role === "user" && (
              <Link 
                className={`nav-link nav-cart ${isActive('/user/cart') ? 'active' : ''}`} 
                to="/user/cart"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingCart size={20} className="nav-icon" />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="cart-count">{cartCount > 99 ? '99+' : cartCount}</span>
                )}
              </Link>
            )}

            {user && (
              <>
                {(user.role === 'admin' || user.role === 'seller') && (
                  <Link 
                    className={`nav-link ${
                    location.pathname.startsWith(user.role === 'admin' ? '/admin' : '/seller') ? 'active' : '' }`}
                    to={user.role === 'admin' ? '/admin' : '/seller'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard size={18} className="nav-icon" />
                    Dashboard
                  </Link>
                )}

                {user.role === 'user' && (
                  <Link 
                    className={`nav-link ${isActive('/user/orders') ? 'active' : ''}`}
                    to="/user/orders"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package size={18} className="nav-icon" />
                    My Orders
                  </Link>
                )}
              </>
            )}

            {!user ? (
              <Link 
                className="nav-link btn-login" 
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            ) : (
              <div 
                className="user-menu-container"
                ref={dropdownRef}
              >
                <button 
                  className={`btn-user-menu ${userMenuOpen ? 'active' : ''}`}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="user-avatar">
                    {/* 3. ADDED: Profile Avatar check */}
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile" className="avatar-img" />
                    ) : user.name ? (
                      user.name.charAt(0).toUpperCase()
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <span className="user-name">{user.name?.split(' ')[0] || 'User'}</span>
                  <ChevronDown size={14} className={`dropdown-chevron ${userMenuOpen ? 'rotate' : ''}`} />
                </button>
                
                <div className={`user-dropdown ${userMenuOpen ? 'show' : ''}`}>
                  <div className="dropdown-header">
                    <span className="dropdown-user-name">{user.name}</span>
                    <span className="dropdown-user-email">{user.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  
                  <Link 
                    to="/profile" 
                    className="dropdown-item"
                    onClick={() => { setMobileMenuOpen(false); setUserMenuOpen(false); }}
                  >
                    <User size={16} /> Profile
                  </Link>

                  {/* 4. ADDED: History Dropdown only for regular users */}
                  {user.role === 'user' && (
                    <Link 
                      to="/user/history" 
                      className="dropdown-item"
                      onClick={() => { setMobileMenuOpen(false); setUserMenuOpen(false); }}
                    >
                      <History size={16} /> History
                    </Link>
                  )}

                  <button className="dropdown-item logout" onClick={handleLogoutClick}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* CUSTOM LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="logout-icon-wrapper">
              <LogOut size={32} />
            </div>
            <h3>Sign Out?</h3>
            <p>Are you sure you want to log out of your account?</p>
            <div className="logout-actions">
              <button className="btn-cancel" onClick={cancelLogout}>Cancel</button>
              <button className="btn-confirm-logout" onClick={confirmLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;