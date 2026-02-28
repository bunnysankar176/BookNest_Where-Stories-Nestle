import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBook } from "../../services/bookService";
import ImageManager from "../../components/ImageManager";
import { Save, ArrowLeft, Loader2, BookOpen, CheckCircle, AlertTriangle } from "lucide-react";
import "../../styles/AddBook.css";

function AddBook() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get current user to determine routing dynamically
  const currentUser = JSON.parse(localStorage.getItem("booknest_user"));
  const userRole = currentUser?.role || "admin"; 

  // Professional Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    genre: "",
    price: "",
    stock: "",
    description: ""
  });
  const [images, setImages] = useState([]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setUploadProgress(0);

    // Simulate upload progress up to 90% while waiting for backend
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.floor(Math.random() * 15 + 5);
      });
    }, 200);

    try {
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "genre") {
          data.append(
            "genre",
            JSON.stringify(
              formData.genre ? formData.genre.split(",").map((g) => g.trim()) : []
            )
          );
        } else {
          data.append(key, formData[key]);
        }
      });

      images.forEach((img) => {
        if (img.file) data.append("images", img.file);
      });

      const cover = images.find((img) => img.isCover);
      if (cover?.id) {
        data.append("coverImageId", cover.id);
      }

      await createBook(data);
      
      clearInterval(progressInterval);
      setUploadProgress(100); // Complete the progress bar
      showToast("Book published successfully!", "success");
      
      // Delay navigation slightly so user sees 100% and success message
      setTimeout(() => {
        // Dynamic routing based on role
        const basePath = userRole === "admin" ? "/admin" : "/seller";
        navigate(`${basePath}/manage-books`);
      }, 1500);

    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setSaving(false);
      console.error("Failed to add book:", error);
      showToast(error.response?.data?.message || "Failed to add the book. Please try again.", "error");
    }
  };

  return (
    <div className="ab-wrapper">
      
      {/* PROFESSIONAL TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`ab-toast ab-toast-${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* UPLOAD PROGRESS OVERLAY */}
      {saving && (
        <div className="ab-upload-overlay">
          <div className="ab-upload-box">
            <Loader2 className="ab-spin-large" size={40} />
            <h3>Publishing Book...</h3>
            <p>Please wait while we upload the images and details.</p>
            <div className="ab-progress-bar-bg">
              <div 
                className="ab-progress-bar-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="ab-progress-text">{Math.min(uploadProgress, 99)}%</span>
          </div>
        </div>
      )}

      <div className="ab-header">
        <button onClick={() => navigate(-1)} className="ab-back-btn" type="button">
          <ArrowLeft size={20} />
          <span>Back to Library</span>
        </button>
      </div>

      <div className="ab-card">
        <div className="ab-card-header">
          <div className="ab-title-wrapper">
            <BookOpen className="ab-title-icon" size={28} />
            <div>
              <h1 className="ab-title">Add New Book</h1>
              <p className="ab-subtitle">Enter information, pricing, and media for the new title.</p>
            </div>
          </div>
        </div>

        <form className="ab-form" onSubmit={handleSubmit}>
          <div className="ab-form-grid">
            <div className="ab-input-group">
              <label htmlFor="title">Book Title *</label>
              <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Harry Potter"
              />
            </div>

            <div className="ab-input-group">
              <label htmlFor="author">Author Name *</label>
              <input
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                placeholder="e.g. J. K. Rowling"
              />
            </div>

            <div className="ab-input-group">
              <label htmlFor="category">Category</label>
              <input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Fiction"
              />
            </div>

            <div className="ab-input-group">
              <label htmlFor="genre">Genres (comma separated)</label>
              <input
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                placeholder="e.g. Fantasy, Adventure, Drama"
              />
            </div>

            <div className="ab-input-group">
              <label htmlFor="price">Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                onWheel={(e) => e.target.blur()} /* Prevents scroll wheel from changing value */
                required
                placeholder="0.00"
              />
            </div>

            <div className="ab-input-group">
              <label htmlFor="stock">Inventory Stock *</label>
              <input
                type="number"
                min="0"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                onWheel={(e) => e.target.blur()} /* Prevents scroll wheel from changing value */
                required
                placeholder="0"
              />
            </div>
          </div>

          <div className="ab-input-group ab-full-width">
            <label htmlFor="description">Book Description</label>
            <textarea
              id="description"
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter a captivating synopsis..."
            />
          </div>

          <div className="ab-media-section">
            <label>Book Images & Cover</label>
            <div className="ab-image-manager-wrapper">
              <ImageManager onChange={setImages} />
            </div>
          </div>

          <div className="ab-form-actions">
            <button type="button" onClick={() => navigate(-1)} className="ab-cancel-btn" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="ab-save-btn" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="ab-spin" size={18} />
                  Uploading...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Publish Book
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBook;