import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookById, updateBook } from "../../services/bookService";
import ImageManager from "../../components/ImageManager";
import { Save, ArrowLeft, Loader2, BookOpen, Pencil, CheckCircle, AlertTriangle } from "lucide-react";
import "../../styles/EditBook.css";

function EditBook() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Get current user to determine routing dynamically
  const currentUser = JSON.parse(localStorage.getItem("booknest_user"));
  const userRole = currentUser?.role || "admin";
  const basePath = userRole === "admin" ? "/admin" : "/seller";

  const [formData, setFormData] = useState({});
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Professional Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    loadBook();
  }, []);

  const loadBook = async () => {
    try {
      setLoading(true);
      const book = await getBookById(id);
      setFormData({
        ...book,
        genre: book.genre?.join(", ")
      });
      setImages(book.images || []);
    } catch (error) {
      console.error("Failed to load book:", error);
      showToast("Error loading book details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadBook();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const data = new FormData();
    const allowedFields = ["title", "author", "category", "description", "price", "stock", "genre"];

    allowedFields.forEach(key => {
      if (formData[key] !== undefined) {
        if (key === "genre") {
          data.append(
            "genre",
            JSON.stringify(formData.genre ? formData.genre.split(",").map(g => g.trim()) : [])
          );
        } else {
          data.append(key, formData[key]);
        }
      }
    });

    const newFiles = images.filter(img => img.file);
    newFiles.forEach(img => data.append("images", img.file));

    const reordered = images
      .filter(img => img.public_id)
      .map(img => ({ url: img.preview, public_id: img.public_id, isCover: img.isCover }));

    data.append("reorderImages", JSON.stringify(reordered));

    const cover = images.find(img => img.isCover);
    if (cover?.public_id) {
      data.append("coverImageId", cover.public_id);
    }

    try {
      await updateBook(id, data);
      showToast("Book updated successfully!", "success");
      setIsEditing(false);
      loadBook();
    } catch (error) {
      console.error("Failed to update book:", error);
      showToast(error.response?.data?.message || "Failed to save changes. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="eb-loading-screen">
        <Loader2 className="eb-spin" size={48} />
        <p>Loading book details...</p>
      </div>
    );
  }

  return (
    <div className="eb-wrapper">

      {/* PROFESSIONAL TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`eb-toast eb-toast-${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="eb-header">
        <button onClick={() => navigate(`${basePath}/manage-books`)} className="eb-back-btn" type="button">
          <ArrowLeft size={20} />
          <span>Back to Library</span>
        </button>
      </div>

      <div className="eb-card">
        <div className="eb-card-header">
          <div className="eb-title-wrapper">
            <BookOpen className="eb-title-icon" size={28} />
            <div>
              <div className="eb-title-header">
                <h1 className="eb-title">Book Details</h1>
                <span className={`eb-status-badge ${isEditing ? 'edit' : 'view'}`}>
                  {isEditing ? 'Edit Mode' : 'View Mode'}
                </span>
              </div>
              <p className="eb-subtitle">
                {isEditing ? "Update information, pricing, and media for this title." : "Viewing information, pricing, and media for this title."}
              </p>
            </div>
          </div>
          
          {!isEditing && (
            <button type="button" onClick={() => setIsEditing(true)} className="eb-edit-toggle-btn">
              <Pencil size={18} />
              Edit
            </button>
          )}
        </div>

        <form className="eb-form" onSubmit={handleSubmit}>
          <div className="eb-form-grid">
            
            <div className="eb-input-group">
              <label htmlFor="title">Book Title {isEditing && "*"}</label>
              {isEditing ? (
                <input id="title" name="title" value={formData.title || ""} onChange={handleChange} required placeholder="e.g. Attack on Titan" />
              ) : (
                <div className="eb-view-text">{formData.title || "-"}</div>
              )}
            </div>

            <div className="eb-input-group">
              <label htmlFor="author">Author Name</label>
              {isEditing ? (
                <input id="author" name="author" value={formData.author || ""} onChange={handleChange} placeholder="e.g. Hajime Isayama" />
              ) : (
                <div className="eb-view-text">{formData.author || "-"}</div>
              )}
            </div>

            <div className="eb-input-group">
              <label htmlFor="category">Category</label>
              {isEditing ? (
                <input id="category" name="category" value={formData.category || ""} onChange={handleChange} placeholder="e.g. Manga" />
              ) : (
                <div className="eb-view-text">{formData.category || "-"}</div>
              )}
            </div>

            <div className="eb-input-group">
              <label htmlFor="genre">Genres (comma separated)</label>
              {isEditing ? (
                <input id="genre" name="genre" value={formData.genre || ""} onChange={handleChange} placeholder="e.g. Action, Dark Fantasy" />
              ) : (
                <div className="eb-view-text">{formData.genre || "-"}</div>
              )}
            </div>

            <div className="eb-input-group">
              <label htmlFor="price">Price (₹)</label>
              {isEditing ? (
                <input 
                  type="number" 
                  step="0.01" 
                  id="price" 
                  name="price" 
                  value={formData.price || ""} 
                  onChange={handleChange} 
                  onWheel={(e) => e.target.blur()} 
                  placeholder="0.00" 
                />
              ) : (
                <div className="eb-view-text">₹{formData.price || "0.00"}</div>
              )}
            </div>

            <div className="eb-input-group">
              <label htmlFor="stock">Inventory Stock</label>
              {isEditing ? (
                <input 
                  type="number" 
                  id="stock" 
                  name="stock" 
                  value={formData.stock || ""} 
                  onChange={handleChange} 
                  onWheel={(e) => e.target.blur()} 
                  placeholder="0" 
                />
              ) : (
                <div className="eb-view-text">{formData.stock || "0"}</div>
              )}
            </div>
          </div>

          <div className="eb-input-group eb-full-width">
            <label htmlFor="description">Book Description</label>
            {isEditing ? (
              <textarea id="description" name="description" rows="5" value={formData.description || ""} onChange={handleChange} placeholder="Enter a captivating synopsis..." />
            ) : (
              <div className="eb-view-text multiline">{formData.description || "No description provided."}</div>
            )}
          </div>

          <div className="eb-media-section">
            <label>Book Images & Cover</label>
            <div className={`eb-image-manager-wrapper ${!isEditing ? 'eb-view-only-media' : ''}`}>
              <ImageManager existing={images} onChange={setImages} />
            </div>
          </div>

          {isEditing && (
            <div className="eb-form-actions">
              <button type="button" onClick={handleCancel} className="eb-cancel-btn">Cancel</button>
              <button type="submit" className="eb-save-btn" disabled={saving}>
                {saving ? (
                  <><Loader2 className="eb-spin" size={18} /> Saving...</>
                ) : (
                  <><Save size={18} /> Save Changes</>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default EditBook;