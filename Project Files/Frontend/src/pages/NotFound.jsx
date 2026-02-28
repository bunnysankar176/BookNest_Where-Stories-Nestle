import { Link } from "react-router-dom";
import { Home, BookX } from "lucide-react";

function NotFound() {
  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "2rem",
      backgroundColor: "#f8fafc",
      color: "#1e293b"
    }}>
      <div style={{ 
        color: "#7B6FDB", 
        marginBottom: "1rem",
        animation: "bounce 2s infinite" 
      }}>
        <BookX size={100} strokeWidth={1} />
      </div>

      <h1 style={{ 
        fontSize: "6rem", 
        fontWeight: "900", 
        margin: "0", 
        lineHeight: "1",
        color: "#1e293b",
        letterSpacing: "-2px"
      }}>
        404
      </h1>

      <h2 style={{ 
        fontSize: "2rem", 
        fontWeight: "700", 
        margin: "1rem 0",
        color: "#334155"
      }}>
        Page Not Found
      </h2>

      <p style={{ 
        maxWidth: "480px", 
        fontSize: "1.1rem", 
        color: "#64748b", 
        lineHeight: "1.6",
        marginBottom: "2.5rem" 
      }}>
        Oops! It looks like the book you're searching for hasn't been written yet, 
        or it might have been moved to a different shelf.
      </p>

      <Link 
        to="/" 
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          backgroundColor: "#7B6FDB",
          color: "white",
          padding: "14px 32px",
          borderRadius: "100px",
          textDecoration: "none",
          fontWeight: "600",
          fontSize: "1rem",
          boxShadow: "0 10px 25px -5px rgba(123, 111, 219, 0.4)",
          transition: "transform 0.2s ease"
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
      >
        <Home size={20} />
        Back to Home
      </Link>
    </div>
  );
}

export default NotFound;