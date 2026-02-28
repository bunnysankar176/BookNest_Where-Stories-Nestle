import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "../../styles/Auth.css";

function Register() {
  const { register, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(""); 
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const responseData = await register(form);
      navigate("/login", { 
        state: { 
          successMessage: responseData?.message || "Registration successful! Please log in." 
        } 
      });
      
    } catch (err) {
      let errorMessage = "Registration failed. Please try again.";
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err; 
      }

      setError(errorMessage);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        
        <div className="auth-banner">
          <div className="banner-circle circle-1"></div>
          <div className="banner-circle circle-2"></div>

          <div className="banner-content">
            <h1 style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '20px' }}>
              BookNest
            </h1>
            <p style={{ fontSize: '1.25rem', lineHeight: '1.6', opacity: 0.9, fontWeight: '400' }}>
              "Sell the stories you’ve finished and fund the adventures you’ve yet to start."
            </p>
          </div>
          
          <div className="banner-footer-text">
            © {new Date().getFullYear()} BookNest Inc.
          </div>
        </div>

        <div className="auth-form-container">
          <div className="form-header">
            <h3>Create Account</h3>
            <p className="sub-text">Join the community for free.</p>
          </div>

          {error && (
            <div className="error-message">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                className={`form-control ${error ? "input-error" : ""}`}
                type="text"
                name="name"
                placeholder="Ben Tennyson"
                required
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                className={`form-control ${error ? "input-error" : ""}`}
                type="email"
                name="email"
                placeholder="ben10@example.com"
                required
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrap">
                <input
                  className={`form-control ${error ? "input-error" : ""}`}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  required
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>I want to...</label>
              <div className="role-switch">
                <button
                  type="button"
                  className={`role-btn ${form.role === 'user' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, role: 'user' })}
                >
                  Buy Books
                </button>
                <button
                  type="button"
                  className={`role-btn ${form.role === 'seller' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, role: 'seller' })}
                >
                  Sell Books
                </button>
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Creating Account..." : `Register as ${form.role === 'user' ? 'Buyer' : 'Seller'}`}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;