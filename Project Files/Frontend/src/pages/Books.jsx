import { useEffect, useState, useMemo, useContext } from "react";
import { getAllBooks, getBookFilters } from "../services/bookService"; // ✅ Updated Imports
import BookCard from "../components/books/BookCard";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Search, Grid, List, X, 
  ChevronLeft, ChevronRight, Star, Filter, 
  ChevronDown, ChevronUp, ArrowRight,
  BookX
} from "lucide-react";
import "../styles/Books.css";

// --- HELPER MOVED OUTSIDE FOR MEMORY EFFICIENCY ---
const getBookImage = (book) => {
  if (book.images && Array.isArray(book.images) && book.images.length > 0) {
      const firstImg = book.images[0];
      if (typeof firstImg === 'string') return firstImg;
      if (typeof firstImg === 'object' && firstImg.url) return firstImg.url;
  }
  if (book.coverImage?.trim()) return book.coverImage;
  if (book.image?.trim()) return book.image;
  return null;
};

// --- Internal Component for List Item ---
const BookListItem = ({ book, handleBookNavigation  }) => {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 140;
  const isLongDescription = book.description && book.description.length > maxLength;

  const genres = Array.isArray(book.genre) 
    ? book.genre 
    : (book.genre ? [book.genre] : []);

  if (book.genres && Array.isArray(book.genres)) {
    book.genres.forEach(g => { if(!genres.includes(g)) genres.push(g) });
  }

  return (
    <div className={`book-list-card ${expanded ? 'expanded' : ''}`}>
      <div className="list-img-wrapper">
        {getBookImage(book) ? (
          <img src={getBookImage(book)} alt={book.title} />
        ) : (
          <div className="placeholder">B</div>
        )}
      </div>
      
      <div className="list-info">
        <div className="list-header-row">
          <div>
            <h3 className="list-title">{book.title}</h3>
            <p className="list-author">by {book.author}</p>
          </div>
          <div className="list-price-block">
            <span className="list-price">₹{book.price}</span>
          </div>
        </div>

        <div className="list-meta-row">
          <span className="list-rating">
            <Star size={14} fill="#F59E0B" color="#F59E0B" /> 
            {book.ratingsAverage?.toFixed(1) || "0.0"}
          </span>
          <div className="list-genres">
            {genres.slice(0, 3).map((g, i) => (
              <span key={i} className="list-genre-badge">{g}</span>
            ))}
            {genres.length > 3 && <span className="list-genre-badge">+{genres.length - 3}</span>}
          </div>
        </div>

        <div className="list-desc-container">
          <p className="list-desc">
            {expanded || !isLongDescription 
              ? book.description 
              : `${book.description.substring(0, maxLength)}...`
            }
          </p>
          
          {isLongDescription && (
            <button 
              className="desc-toggle-btn"
              onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }}
            >
              {expanded ? "Show Less" : "Read More"} 
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        <div className="list-action-row">
          <button 
            className="btn-view-details-outline"
            onClick={() => handleBookNavigation(book._id)}
          >
            View Details <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // URL Params Syncing
  const [searchParams] = useSearchParams();
  const initialGenre = searchParams.get('genre') || "all";
  const initialCategory = searchParams.get('category') || "all";
  const initialTab = searchParams.get('genre') ? 'genre' : 'category';

  // Filters State
  const [searchInput, setSearchInput] = useState(""); 
  const [debouncedSearch, setDebouncedSearch] = useState(""); 
  
  const [filterTab, setFilterTab] = useState(initialTab);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState([0, 2000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  
  // Sidebar Options State (Fetched from backend)
  const [filterData, setFilterData] = useState({ categories: [], genres: [] });

  // UI State
  const [viewMode, setViewMode] = useState("grid");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [listSearch, setListSearch] = useState("");
  const [isListSearchOpen, setIsListSearchOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  // --- 1. FETCH SIDEBAR FILTERS ON LOAD ---
  useEffect(() => {
    getBookFilters().then(data => setFilterData({
      categories: data.categories || [],
      genres: data.genres || []
    }));
  }, []);

  // --- 2. DEBOUNCE SEARCH & PRICE INPUT ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500); 
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ✅ ADD THIS NEW EFFECT
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 500); // Waits half a second after you let go of the slider
    return () => clearTimeout(timer);
  }, [priceRange]);

// --- 3. FETCH BOOKS WHEN FILTERS OR PAGE CHANGES ---
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          category: selectedCategory,
          genre: selectedGenre,
          minPrice: debouncedPriceRange[0], 
          maxPrice: debouncedPriceRange[1], 
          minRating: minRating,
          sortBy: sortBy
        };

        const data = await getAllBooks(params);
        setBooks(data.books || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError("Failed to fetch books.");
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [currentPage, debouncedSearch, selectedCategory, selectedGenre, debouncedPriceRange[0], debouncedPriceRange[1], minRating, sortBy]);


  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedGenre, debouncedPriceRange[0], debouncedPriceRange[1], minRating, sortBy]);

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCategory("all");
    setSelectedGenre("all");
    setPriceRange([0, 2000]);
    setMinRating(0);
    setSortBy("newest");
    setListSearch("");
  };

  // Sidebar dynamic list
  const currentList = filterTab === 'category' ? filterData.categories : filterData.genres;
  const displayedItems = listSearch.trim() 
    ? currentList.filter(item => item.toLowerCase().includes(listSearch.toLowerCase()))
    : currentList;

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookNavigation = (bookId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user?.role === "admin" || user?.role === "seller") {
      navigate(`/${user.role}/edit-book/${bookId}`);
    } else {
      navigate(`/books/${bookId}`);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 3) {
            pages.push(1, 2, 3, 4, "...", totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
        }
    }
    return pages;
  };

  return (
    <div className="books-page">
      <div className="books-container">
        
        {/* SIDEBAR TOGGLE */}
        <button 
          className={`sidebar-toggle-btn ${isSidebarOpen ? 'open' : 'closed'}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Collapse Filters" : "Expand Filters"}
        >
          {isSidebarOpen ? <ChevronLeft size={20} /> : <Filter size={20} />}
        </button>

        {/* LEFT SIDEBAR */}
        <aside className={`books-sidebar ${isSidebarOpen ? 'visible' : 'hidden'}`}>
          <div className="sidebar-header">
            <h3>Filters</h3>
            <button className="reset-btn" onClick={clearFilters}>Reset</button>
          </div>

          <div className="sidebar-content">
            <div className="filter-group">
              
              <div className="filter-tabs">
                <button 
                  className={`filter-tab-btn ${filterTab === 'category' ? 'active' : ''}`}
                  onClick={() => { setFilterTab('category'); setListSearch(""); setIsListSearchOpen(false); }}
                >
                  Categories
                </button>
                <button 
                  className={`filter-tab-btn ${filterTab === 'genre' ? 'active' : ''}`}
                  onClick={() => { setFilterTab('genre'); setListSearch(""); setIsListSearchOpen(false); }}
                >
                  Genres
                </button>
              </div>

              <div className="filter-header" style={{marginTop: '15px'}}>
                <h4>{filterTab === 'category' ? 'Select Category' : 'Select Genre'}</h4>
                <div className={`genre-search-wrapper ${isListSearchOpen ? 'active' : ''}`}>
                    {isListSearchOpen ? (
                        <div className="genre-search-input-box">
                            <input 
                                autoFocus
                                type="text" 
                                placeholder={`Find ${filterTab}...`} 
                                value={listSearch}
                                onChange={(e) => setListSearch(e.target.value)}
                            />
                            <X size={14} className="close-search" onClick={() => {setIsListSearchOpen(false); setListSearch("");}} />
                        </div>
                    ) : (
                        <button className="genre-search-icon" onClick={() => setIsListSearchOpen(true)}>
                            <Search size={16} />
                        </button>
                    )}
                </div>
              </div>

              <div className="genre-options scrollable-options">
                <label className={`genre-radio ${(filterTab === 'category' ? selectedCategory : selectedGenre) === "all" ? "active" : ""}`}>
                  <input 
                    type="radio" 
                    name="filterSelection" 
                    value="all" 
                    checked={(filterTab === 'category' ? selectedCategory : selectedGenre) === "all"} 
                    onChange={() => filterTab === 'category' ? setSelectedCategory("all") : setSelectedGenre("all")} 
                  />
                  <span className="radio-circle"></span>
                  <span className="genre-name">All {filterTab === 'category' ? 'Categories' : 'Genres'}</span>
                </label>
                
                {displayedItems.map(item => {
                  const isSelected = filterTab === 'category' ? selectedCategory === item : selectedGenre === item;
                  return (
                    <label key={item} className={`genre-radio ${isSelected ? "active" : ""}`}>
                      <input 
                        type="radio" 
                        name="filterSelection" 
                        value={item} 
                        checked={isSelected} 
                        onChange={() => filterTab === 'category' ? setSelectedCategory(item) : setSelectedGenre(item)} 
                      />
                      <span className="radio-circle"></span>
                      <span className="genre-name">{item}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="filter-group">
              <h4>Price Range</h4>
              <div className="price-slider-container">
                <div className="price-labels">
                  <span>₹{priceRange[0]}</span>
                  <span>₹{priceRange[1]}+</span>
                </div>
                <input 
                  type="range" min="0" max="2000" step="50"
                  value={priceRange[1]} 
                  onChange={e => setPriceRange([0, Number(e.target.value)])}
                  className="range-slider"
                />
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-header">
                <h4>Rating</h4>
                {minRating > 0 && <span className="rating-label">{minRating}+ Stars</span>}
              </div>
              <div className="star-filter-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    className={`star-btn ${minRating >= star ? 'filled' : ''}`}
                    onClick={() => setMinRating(minRating === star ? 0 : star)}
                  >
                    <Star size={24} fill={minRating >= star ? "#F59E0B" : "none"} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <main className={`books-main ${isSidebarOpen ? 'shrunk' : 'expanded'}`}>
          
          <div className="books-topbar">
            <div className="search-bar-wrapper">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                placeholder="Search by title, author..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <div className="controls-right">
              <div className="sort-dropdown">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              <div className="view-toggle">
                <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
                  <Grid size={18} />
                </button>
                <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="books-results">
            {/* ✅ FIX: Only show big spinner if loading AND we have 0 books in state */}
            {loading && books.length === 0 ? (
              <div className="books-loader" style={{ height: '400px' }}><div className="spinner"></div></div>
            ) : books.length === 0 ? (
              <div className="no-results-container">
                <div className="no-results-icon">
                  <BookX size={64} strokeWidth={1} />
                </div>
                <h3>No Matches Found</h3>
                <p>We couldn't find any books matching your current filters. <br/> Try searching for something else or adjust the filters.</p>
                <button className="btn-clear-filters" onClick={clearFilters}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                {/* ✅ FIX: Added the style prop for the soft-load dimming effect */}
                <div 
                  className={viewMode === 'grid' ? 'books-grid' : 'books-list'}
                  style={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s ease-in-out' }}
                >
                  {books.map((book) => (
                    viewMode === 'grid' ? (
                      <div 
                        key={book._id}
                        className="clickable-card"
                        onClick={() => handleBookNavigation(book._id)}
                      >
                        <BookCard book={book} imageUrl={getBookImage(book)} />
                      </div>
                    ) : (
                      <BookListItem 
                        key={book._id} 
                        book={book} 
                        handleBookNavigation={handleBookNavigation}
                      />
                    )
                  ))}
                </div>

                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <div className="pagination-container">
                    <button 
                      className="pagination-btn prev"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={18} /> Prev
                    </button>

                    <div className="pagination-numbers">
                      {getPageNumbers().map((number, index) => (
                        <button
                          key={index}
                          className={`page-number ${number === currentPage ? 'active' : ''} ${number === '...' ? 'dots' : ''}`}
                          onClick={() => number !== '...' && paginate(number)}
                          disabled={number === '...'}
                        >
                          {number}
                        </button>
                      ))}
                    </div>

                    <button 
                      className="pagination-btn next"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}

export default Books;