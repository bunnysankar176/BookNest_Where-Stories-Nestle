import { useState, useContext,useEffect } from "react";
import { AuthContext } from "../../context/AuthContext"; 
import { useNavigate, Link, useLocation } from "react-router-dom"; 
import { Eye, EyeOff } from "lucide-react";
import "../../styles/Auth.css"; 

function Login() {
  const { login, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || "");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(""); 
  };

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg("");
      }, 80000); 

      
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg(""); 
    
    try {
      const data = await login(form.email, form.password);
      if (data.role === "admin") {
        navigate("/admin");
      } else if (data.role === "seller") {
        navigate("/seller"); 
      } else {
        navigate("/");
      }
      
    } catch (err) {
      let errorMessage = "Something went wrong. Please try again.";

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
              Welcome Back
            </h1>
            <p style={{ fontSize: '1.25rem', lineHeight: '1.6', opacity: 0.9, fontWeight: '400' }}>
              "There is no friend as loyal as a book. Sign in to continue your journey."
            </p>
          </div>
          
          <div className="banner-footer-text">
            © {new Date().getFullYear()} BookNest. All rights reserved.
          </div>
        </div>

        <div className="auth-form-container">
          <div className="form-header">
            <h3>Login to BookNest</h3>
            <p className="sub-text">Enter your details below.</p>
          </div>

          {/* 5. ADD SUCCESS MESSAGE RENDER BLOCK */}
          {successMsg && (
            <div className="success-message">
              <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

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

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
