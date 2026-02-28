import { useEffect, useState, useRef } from "react";
import { Link, Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { getSellers } from "../../services/adminService";
import { 
  LayoutDashboard, BookOpen, Menu, X, LogOut, 
  ChevronRight, Package, BookPlus, 
  UserPlus, UserCog, UserCheck, Settings, Star
} from "lucide-react";
import "../../styles/Dashboard.css";

function Dashboard() {
  const [pendingSellers, setPendingCount] = useState(0);
  const [animateBadge, setAnimateBadge] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Initialize user role directly from local storage
  const currentUser = JSON.parse(localStorage.getItem("booknest_user"));
  const [userRole, setUserRole] = useState(currentUser?.role || null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const prevCountRef = useRef(0);

  useEffect(() => {
    // 1. Check if user is logged in AND is either an admin or seller
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "seller")) {
      navigate("/");
      return;
    }
    
    // 2. Only fetch pending sellers if the user is an admin
    if (currentUser.role === "admin") {
      fetchPendingSellers();
      const intervalId = setInterval(fetchPendingSellers, 5000);
      return () => clearInterval(intervalId);
    }
  }, [navigate]);

  const fetchPendingSellers = async () => {
    try {
      const sellers = await getSellers();
      const pending = sellers.filter((s) => s.status === "pending");
      const newCount = pending.length;
      
      if (newCount > prevCountRef.current) {
        setAnimateBadge(true);
        setTimeout(() => setAnimateBadge(false), 600);
      }
      
      prevCountRef.current = newCount;
      setPendingCount(newCount);
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem("booknest_user");
    navigate("/login");
  };

  const getPageTitle = () => {
    if (location.pathname.includes("add-book")) return "Add New Book";
    if (location.pathname.includes("create-account")) return "Create Accounts";
    if (location.pathname.includes("manage-accounts")) return "Manage Accounts";
    if (location.pathname.includes("sellers")) return "Seller Approvals";
    if (location.pathname.includes("manage-books") || location.pathname.includes("books")) return userRole === "admin" ? "Manage Books" : "My Books";
    if (location.pathname.includes("orders")) return "Manage Orders";
    if (location.pathname.includes("inventory")) return "Inventory"; 
    if (location.pathname.includes("manage-reviews") || location.pathname.includes("reviews")) return "Reviews & Ratings"; 
    return "Dashboard Overview";
  };

  // Prevent rendering if the role isn't set yet
  if (!userRole) return null;

  // Determine the base routing path. 
  // Change "/seller" to "/admin" if your app uses the exact same routes for both roles.
  const basePath = userRole === "admin" ? "/admin" : "/seller";

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      <div 
        className={`dash-overlay ${isMobileOpen ? 'active' : ''}`} 
        onClick={() => setIsMobileOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`dash-sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="dash-sidebar-header">
          <div className="dash-brand">
            {userRole === "admin" ? "ADMIN PANEL" : "SELLER PANEL"}
          </div>
          
          <button className="mobile-close-btn" onClick={() => setIsMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="dash-nav">
          {/* SHARED: Overview */}
          <NavLink to={basePath} end className={({isActive}) => `dash-nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </NavLink>
          
          {/* SHARED: Orders */}
          <NavLink to={`${basePath}/orders`} className={({isActive}) => `dash-nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
            <Package size={20} />
            <span>Orders</span>
          </NavLink>

          {/* ADMIN ONLY: Accounts */}
          {userRole === "admin" && (
            <NavLink to={`${basePath}/manage-accounts`} className={({isActive}) => `dash-nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
              <UserCog size={20} />
              <span>Accounts</span>
            </NavLink>
          )}
          
          {/* ADMIN ONLY: Seller Approvals */}
          {userRole === "admin" && (
            <NavLink to={`${basePath}/sellers`} className={({isActive}) => `dash-nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
              <UserCheck size={20} />
              <span className="flex-grow">Seller Approvals</span>
              
              {pendingSellers > 0 && (
                <div 
                  className="dash-badge-container" 
                  title={`${pendingSellers} pending seller${pendingSellers > 1 ? 's' : ''} awaiting approval`}
                >
                  <div className="dash-badge-pulse"></div>
                  <span className={`dash-badge ${animateBadge ? 'badge-pop' : ''}`}>
                    {pendingSellers}
                  </span>
                </div>
              )}
            </NavLink>
          )}
          
          {/* SHARED: Books (Name changes dynamically) */}
          <NavLink to={`${basePath}/manage-books`} className={({isActive}) => `dash-nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
            <BookOpen size={20} />
            <span>{userRole === "admin" ? "Books" : "My Books"}</span>
          </NavLink>

          {/* SHARED: Inventory */}
          <NavLink to={`${basePath}/inventory`} className={({isActive}) => `dash-nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
            <Settings size={20} />
            <span>Inventory</span>
          </NavLink>

          {/* SHARED: Add Books */}
          <NavLink to={`${basePath}/add-book`} className={({isActive}) => `dash-nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
            <BookPlus size={20} />
            <span>Add Books</span>
          </NavLink>

          {/* ADMIN ONLY: Create Accounts */}
          {userRole === "admin" && (
            <NavLink to={`${basePath}/create-account`} className={({isActive}) => `dash-nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
              <UserPlus size={20} />
              <span>Create Accounts</span>
            </NavLink>
          )}

          {/* SHARED: Reviews & Ratings */}
          <NavLink to={`${basePath}/manage-reviews`} className={({isActive}) => `dash-nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
            <Star size={20} />
            <span>Reviews & Ratings</span>
          </NavLink>
        </nav>

        <div className="dash-sidebar-footer">
          <button className="dash-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dash-main">
        <header className="dash-top-header">
          <div className="dash-header-left">
            <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="dash-breadcrumbs">
              <span className="text-muted">{userRole === "admin" ? "Admin" : "Seller"}</span>
              <ChevronRight size={14} className="mx-2 text-muted" />
              <span className="font-weight-600">{getPageTitle()}</span>
            </div>
          </div>
          
          <div className="dash-header-right">
            <Link to="/" className="back-to-store-btn">Back to Store</Link>
          </div>
        </header>

        <div className="dash-content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;