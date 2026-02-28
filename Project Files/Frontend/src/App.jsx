import { Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/common/Navbar";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/common/ProtectedRouteFixed";
import RoleBasedRoute from "./components/common/RoleBasedRoute";
import Books from "./pages/Books";
import BookDetails from "./pages/BookDetails";
import MiniCart from "./components/MiniCart";

// Unified Dashboard
import Dashboard from "./pages/commonpages/Dashboard";
// common files for Admin & Seller 
import AddBook from "./pages/commonpages/AddBook";
import InventoryManagement from "./pages/commonpages/InventoryManagement";
import ManageBooks from "./pages/commonpages/ManageBooks";
import EditBook from "./pages/commonpages/EditBook";

// Admin
import AdminStats from "./pages/admin/AdminStats";
import ManageAccounts from "./pages/admin/ManageAccounts";
import ManageSellers from "./pages/admin/ManageSellers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCreateAccounts from "./pages/admin/AdminCreateAccounts";
import EditAccounts from "./pages/admin/EditAccounts"; 
import AdminReviews from "./pages/admin/AdminReviews";

// Seller
import SellerStats from "./pages/seller/SellerStats";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerReviews from "./pages/seller/SellerReviews";

// User
import UserStats from "./pages/user/UserStats";
import Cart from "./pages/user/Cart";
import OrderHistory from "./pages/user/OrderHistory";
import Checkout from "./pages/user/Checkout";
import Payment from "./pages/user/Payment";
import History from "./pages/user/History";

function App() {
  return (
    <>
      <Navbar />
      <MiniCart />
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/:id" element={<BookDetails />} />
        
        {/* Profile Route (User & Seller) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN ROUTES ================= */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["admin"]}>
                <Dashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminStats />} />
          <Route path="stats" element={<AdminStats />} />
          <Route path="manage-accounts" element={<ManageAccounts />} />
          <Route path="sellers" element={<ManageSellers />} />
          <Route path="manage-books" element={<ManageBooks />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="add-book" element={<AddBook />} />
          <Route path="edit-book/:id" element={<EditBook />} />
          <Route path="create-account" element={<AdminCreateAccounts />} />
          <Route path="edit-account/:id" element={<EditAccounts />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="manage-reviews" element={<AdminReviews />} />
        </Route>

        {/* ================= SELLER ROUTES ================= */}

        <Route
          path="/seller"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["seller"]}>
                <Dashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<SellerStats />} />
          <Route path="stats" element={<SellerStats />} />
          <Route path="add-book" element={<AddBook />} /> 
          <Route path="manage-books" element={<ManageBooks />} />
          <Route path="edit-book/:id" element={<EditBook />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="inventory" element={<InventoryManagement />} /> 
          <Route path="manage-reviews" element={<SellerReviews />} /> 
        </Route>

        {/* ================= USER ROUTES ================= */}

        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={["user"]}>
                <Outlet/>
              </RoleBasedRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<UserStats />} />
          <Route path="stats" element={<UserStats />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="payment" element={<Payment />} />
          <Route path="history" element={<History />} />
        </Route>

        <Route path="*" element={<NotFound />} />

      </Routes>
    </>
  );
}

export default App;