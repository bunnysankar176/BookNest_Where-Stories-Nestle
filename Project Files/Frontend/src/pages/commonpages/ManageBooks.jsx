import { useEffect, useState, useMemo } from "react";
import { getDashboardBooks, deleteBook } from "../../services/bookService";
import { useNavigate } from "react-router-dom";
import { 
  Search, BookOpen, Trash2, AlertTriangle, 
  ChevronLeft, ChevronRight, Edit, User, Store 
} from "lucide-react";
import "../../styles/ManageBooks.css";

function ManageBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Get current user to determine UI elements dynamically
  const currentUser = JSON.parse(localStorage.getItem("booknest_user"));
  const userRole = currentUser?.role || "admin";
  const basePath = userRole === "admin" ? "/admin" : "/seller";

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  
  const [previewImage, setPreviewImage] = useState({ url: null, x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    try {
      const data = await getDashboardBooks();
      setBooks(data);
    } catch (err) {
      setError("Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = useMemo(() => {
    if (!searchTerm) return books;
    return books.filter(book => 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userRole === "admin" && book.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [books, searchTerm, userRole]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

 
const getBookImage = (book) => {
  if (!book) return null;
  if (book.images && book.images.length > 0) return book.images[0].url || book.images[0];
  if (book.coverImage) return book.coverImage.url || book.coverImage;
  if (book.image) return book.image.url || book.image;
  return null;
};

  const confirmDelete = (book) => {
    setBookToDelete(book);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!bookToDelete) return;
    try {
      await deleteBook(bookToDelete._id);
      setBooks(books.filter(b => b._id !== bookToDelete._id));
      setShowDeleteModal(false);
      setBookToDelete(null);
    } catch (err) {
      alert("Failed to delete the book.");
    }
  };

  const handleMouseMove = (e, url) => {
    if (url) {
      const imageWidth = 200; 
      const imageHeight = 280; 
      const offset = 20;

      let x = e.clientX + offset;
      let y = e.clientY + offset;

      if (x + imageWidth > window.innerWidth) {
        x = e.clientX - imageWidth - offset;
      }

      if (y + imageHeight > window.innerHeight) {
        y = e.clientY - imageHeight - offset;
      }

      setPreviewImage({ url, x, y });
    }
  };

  const handleMouseLeave = () => {
    setPreviewImage({ url: null, x: 0, y: 0 });
  };

  if (loading) return <div className="mb-loader"><div className="mb-spinner"></div></div>;
  if (error) return <div className="mb-empty-state">{error}</div>;

  return (
    <div className="mb-container">
      
      <div className="mb-header-card">
        <div className="mb-header-title">
          <div className="mb-icon-wrapper mb-bg-green-light mb-text-green">
            <BookOpen size={24} />
          </div>
          <div>
            <h2>{userRole === "admin" ? "Manage Books" : "My Books"}</h2>
            <p>{userRole === "admin" ? "View, search, and manage the platform's book inventory." : "View, search, and manage your book inventory."}</p>
          </div>
        </div>

        <div className="mb-search-box">
          <Search size={18} className="mb-search-icon" />
          <input 
            type="text" 
            placeholder={userRole === "admin" ? "Search title, author, or seller..." : "Search title or author..."} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="mb-table-card">
        <div className="mb-table-responsive">
          <table className="mb-table">
            <thead>
              <tr>
                <th>Book Details</th>
                <th>Author</th>
                {userRole === "admin" && <th>Seller</th>}
                <th>Price</th>
                <th className="mb-text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBooks.length > 0 ? (
                paginatedBooks.map(book => (
                  <tr key={book._id}>
                    <td>
                      <div className="mb-book-info">
                        <div 
                          className="mb-book-img"
                          onMouseMove={(e) => handleMouseMove(e, getBookImage(book))}
                          onMouseLeave={handleMouseLeave}
                        >
                          {getBookImage(book) ? (
                            <img src={getBookImage(book)} alt={book.title} />
                          ) : (
                            <div className="mb-placeholder">B</div>
                          )}
                        </div>
                        <div className="mb-book-texts">
                          <strong>{book.title}</strong>
                          <span className="mb-id">ID: {book._id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="mb-author-badge">
                        <User size={14} />
                        <span>{book.author}</span>
                      </div>
                    </td>
                    
                    {userRole === "admin" && (
                      <td>
                        <div className="mb-seller-badge">
                          <Store size={14} />
                          <span>{book.seller?.name || "Unknown"}</span>
                        </div>
                      </td>
                    )}
                    
                    <td><strong className="mb-price">₹{book.price}</strong></td>
                    <td className="mb-text-right">
                      <div className="mb-actions">
                        <button className="mb-btn-action mb-btn-edit" onClick={() => navigate(`${basePath}/edit-book/${book._id}`)} title="Edit Book">
                          <Edit size={16} />
                        </button>
                        <button className="mb-btn-action mb-btn-delete" onClick={() => confirmDelete(book)} title="Delete Book">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={userRole === "admin" ? "5" : "4"} className="mb-empty-state">No books found matching your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-mobile-grid">
        {paginatedBooks.map(book => (
          <div key={book._id} className="mb-mobile-card">
            <div className="mb-mobile-card-top">
              <div 
                className="mb-book-img"
                onTouchStart={(e) => handleMouseMove(e.touches[0], getBookImage(book))}
                onTouchEnd={handleMouseLeave}
              >
                {getBookImage(book) ? ( <img src={getBookImage(book)} alt={book.title} /> ) : ( <div className="mb-placeholder">B</div> )}
              </div>
              <div className="mb-book-texts">
                <strong>{book.title}</strong>
                <div className="mb-author-badge mb-mt-1">
                  <User size={12} /><span>{book.author}</span>
                </div>
                <span className="mb-price-mobile">₹{book.price}</span>
              </div>
            </div>
            <div className="mb-mobile-card-bottom">
              
              {userRole === "admin" ? (
                <div className="mb-seller-badge">
                  <Store size={14} />
                  <span>{book.seller?.name || "Unknown"}</span>
                </div>
              ) : (
                <div></div> /* Empty div to push actions to the right */
              )}

              <div className="mb-mobile-actions">
                <button className="mb-btn-action mb-btn-edit" onClick={() => navigate(`${basePath}/edit-book/${book._id}`)}>
                  <Edit size={16} />
                </button>
                <button className="mb-btn-action mb-btn-delete" onClick={() => confirmDelete(book)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mb-pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={18} /> Prev</button>
          <span className="mb-page-info">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next <ChevronRight size={18} /></button>
        </div>
      )}

      {showDeleteModal && (
        <div className="mb-modal-backdrop">
          <div className="mb-modal">
            <div className="mb-modal-icon mb-bg-red-light mb-text-red">
              <AlertTriangle size={32} />
            </div>
            <h3>Delete Book?</h3>
            <p>Please confirm the details below before proceeding. This action cannot be undone.</p>
            
            <div className="mb-modal-details">
              <div className="mb-detail-row">
                <span className="mb-detail-label">Title</span>
                <span className="mb-detail-value">{bookToDelete?.title}</span>
              </div>
              <div className="mb-detail-row">
                <span className="mb-detail-label">Author</span>
                <span className="mb-detail-value">{bookToDelete?.author}</span>
              </div>
              
              {userRole === "admin" && (
                <div className="mb-detail-row">
                  <span className="mb-detail-label">Seller</span>
                  <span className="mb-detail-value mb-text-primary">{bookToDelete?.seller?.name || 'Unknown'}</span>
                </div>
              )}
              
              <div className="mb-detail-row">
                <span className="mb-detail-label">Book ID</span>
                <span className="mb-detail-value mb-font-mono">{bookToDelete?._id}</span>
              </div>
            </div>

            <div className="mb-modal-actions">
              <button className="mb-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="mb-btn-confirm-danger" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {previewImage.url && (
        <div 
          className="mb-image-preview-popup" 
          style={{ left: previewImage.x, top: previewImage.y }}
        >
          <img src={previewImage.url} alt="Book Cover Preview" />
        </div>
      )}
    </div>
  );
}

export default ManageBooks;