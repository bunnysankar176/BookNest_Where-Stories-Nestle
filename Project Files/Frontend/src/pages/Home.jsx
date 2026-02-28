import { useEffect, useState, useRef, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getHomepageData } from "../services/bookService";
import BookCard from "../components/books/BookCard";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Home.css";

// --- HELPER FUNCTIONS ---

const getBookImage = (book) => {
  if (!book) return null;
  if (book.images && Array.isArray(book.images) && book.images.length > 0) {
    const firstImg = book.images[0];
    if (firstImg && typeof firstImg === 'object' && firstImg.url) return firstImg.url;
    if (typeof firstImg === 'string') return firstImg;
  }
  if (book.coverImage && typeof book.coverImage === 'string') return book.coverImage;
  if (book.coverImage && book.coverImage.url) return book.coverImage.url;
  if (book.image) return book.image;
  return null;
};

const scrollElement = (ref, direction) => {
  if (ref.current) {
    const scrollAmount = 320;
    ref.current.scrollBy({ 
      left: direction === 'left' ? -scrollAmount : scrollAmount, 
      behavior: 'smooth' 
    });
  }
};

const score = (b) => {
  // Checks for ratingsAverage or rating
  const avg = Number(b.ratingsAverage) || Number(b.rating) || 0;
  // Safely checks for ratingsCount, numReviews, or the length of the reviews array
  const count = Number(b.ratingsCount) || Number(b.numReviews) || (b.reviews ? b.reviews.length : 0);
  return avg * Math.log(1 + count);
};

// --- NEW HELPER FOR REVIEW COUNT ---
const getReviewCount = (book) => {
  return Number(book.ratingsCount) || Number(book.numReviews) || (book.reviews ? book.reviews.length : 0);
};

// --- COMPONENT: SectionSlider ---
const SectionSlider = ({ title, subtitle, link, items, scrollRef, isAuto = false, onHoverStart, onHoverEnd, handleBookNavigation }) => {
  return (
    <section 
        className="content-section" 
        onMouseEnter={onHoverStart} 
        onMouseLeave={onHoverEnd}
    >
      <div className="section-header">
        <div className="section-title-group">
          <h2 className="section-title-simple">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        {link && (
          <Link to={link} className="view-all-link">
            <span>View all</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        )}
      </div>
      
      <div className="slider-wrapper">
        {!isAuto && (
          <button className="slider-btn left" onClick={() => scrollElement(scrollRef, 'left')} aria-label="Scroll left">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}
        
        <div className={`books-slider ${isAuto ? 'auto-slide' : ''}`} ref={scrollRef}>
          {items.map((book) => (
            <div 
                key={book._id} 
                className="book-slide-item clickable-card"
                onClick={() => handleBookNavigation(book._id)}
            >
               <BookCard book={book} imageUrl={getBookImage(book)} badge={isAuto ? "NEW" : null} />
            </div>
          ))}
        </div>

        {!isAuto && (
          <button className="slider-btn right" onClick={() => scrollElement(scrollRef, 'right')} aria-label="Scroll right">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}
      </div>
    </section>
  );
};

// --- MAIN COMPONENT: Home ---

function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubscribePopup, setShowSubscribePopup] = useState(false);

const [newArrivals, setNewArrivals] = useState([]);
const [mostReviewed, setMostReviewed] = useState([]);
const [topRated, setTopRated] = useState([]);
const [stats, setStats] = useState({ totalBooks: 0, displayReviews: "0" });
  
  // Selection states for capsules
  const [activeGenre, setActiveGenre] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  
  const [isPaused, setIsPaused] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  // Scroll Refs
  const latestRef = useRef(null);
  const topPicksRef = useRef(null);
  const communityRef = useRef(null);
  const filterBooksRef = useRef(null);
  const genreTabsRef = useRef(null);
  const categoryTabsRef = useRef(null);

useEffect(() => {
  const fetch = async () => {
    try {
      const data = await getHomepageData();
      
      setNewArrivals(data.newArrivals || []);
      setMostReviewed(data.mostReviewed || []);
      setTopRated(data.topRated || []);
      
      // ✅ FIX: Catch the stats from the backend
      if (data.stats) {
        const tr = data.stats.totalReviews || 0;
        setStats({
          totalBooks: data.stats.totalBooks || 0,
          displayReviews: tr > 1000 ? `${(tr / 1000).toFixed(1)}k+` : tr.toString()
        });
      }

      // ✅ FIX: Set the books array using the lightweight data so Categories/Genres work
      setBooks(data.booksForFilters || []);
      
    } catch (err) {
      console.error("Failed to load homepage books", err);
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, []);

  // AUTO SLIDE for Latest Additions (Pauses on Hover)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (latestRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = latestRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 50) {
           latestRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
           latestRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [books, isPaused]);

  // Close search if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setSearchResults([]); 
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef]);

  // --- DATA PROCESSING: GENRES & CATEGORIES ---
  const genreMap = {};
  const categoryMap = {};

  books.forEach(b => {
    // Process Genres
    let rawGenres = [];
    if (b.genre) Array.isArray(b.genre) ? rawGenres.push(...b.genre) : rawGenres.push(b.genre);
    if (b.genres) Array.isArray(b.genres) ? rawGenres.push(...b.genres) : rawGenres.push(b.genres);
    
    rawGenres.forEach(val => {
        if (typeof val === 'string') {
            val.split(',').forEach(part => {
                const cleanGenre = part.trim();
                if (cleanGenre && (!genreMap[cleanGenre] || !genreMap[cleanGenre].some(existing => existing._id === b._id))) {
                    if (!genreMap[cleanGenre]) genreMap[cleanGenre] = [];
                    genreMap[cleanGenre].push(b);
                }
            });
        }
    });

    // Process Categories
    let rawCategories = [];
    if (b.category) Array.isArray(b.category) ? rawCategories.push(...b.category) : rawCategories.push(b.category);
    if (b.categories) Array.isArray(b.categories) ? rawCategories.push(...b.categories) : rawCategories.push(b.categories);

    rawCategories.forEach(val => {
        if (typeof val === 'string') {
            val.split(',').forEach(part => {
                const cleanCategory = part.trim();
                if (cleanCategory && (!categoryMap[cleanCategory] || !categoryMap[cleanCategory].some(existing => existing._id === b._id))) {
                    if (!categoryMap[cleanCategory]) categoryMap[cleanCategory] = [];
                    categoryMap[cleanCategory].push(b);
                }
            });
        }
    });
  });

  const allGenres = Object.keys(genreMap);
  const allCategories = Object.keys(categoryMap);
  
  // Combine for search
  const allFilters = [...new Set([...allGenres, ...allCategories])];

  const defaultGenres = allGenres.slice(0, 10);
  const defaultCategories = allCategories.slice(0, 10);

  // Navigation Guard logic
  const handleBookNavigation = (bookId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role === "admin" || user.role === "seller") {
      navigate(`/${user.role}/edit-book/${bookId}`);
    } else {
      navigate(`/books/${bookId}`);
    }
  };

  // Search Logic
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim() === "") {
        setSearchResults([]);
    } else {
        const matches = allFilters.filter(g => g.toLowerCase().includes(term.toLowerCase()));
        setSearchResults(matches);
    }
  };

  const selectFilter = (item) => {
    if (allGenres.includes(item)) {
        setActiveGenre(item);
        setActiveCategory(null); // Reset the other
    } else if (allCategories.includes(item)) {
        setActiveCategory(item);
        setActiveGenre(null); // Reset the other
    }
    
    setSearchTerm("");
    setSearchResults([]);
    setIsSearchOpen(false); 
  };

  const handleSubscribe = () => {
    setShowSubscribePopup(true);
    setTimeout(() => {
      setShowSubscribePopup(false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loading-spinner"></div>
        <p>Loading your library...</p>
      </div>
    );
  }

  // Determine what books to show if a capsule is active
  let activeBooks = [];
  if (activeGenre) activeBooks = genreMap[activeGenre];
  if (activeCategory) activeBooks = categoryMap[activeCategory];

  // Temporary calculations for Hero Stats until moved to backend
  const totalReviewsCount = books.reduce((acc, book) => acc + getReviewCount(book), 0);
  const displayReviews = totalReviewsCount > 1000 ? `${(totalReviewsCount / 1000).toFixed(1)}k+` : totalReviewsCount;

  return (
    <div className="home-container">
      <style>{`
        /* INTERNAL STYLES FOR SEARCH UI & FOOTER */
        .section-title-simple { font-size: 2rem; font-weight: 700; color: #1a1a1a; margin-bottom: 0.5rem; line-height: 1.2; }
        .genre-search-wrapper { position: relative; display: flex; align-items: center; height: 40px; }
        .genre-search-btn { width: 40px; height: 40px; border-radius: 50%; border: 1px solid #e2e8f0; background: white; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .genre-search-btn:hover { background: #f8fafc; border-color: #cbd5e1; color: #334155; }
        
        .genre-search-input-container { position: absolute; right: 0; top: 0; display: flex; align-items: center; background: white; border: 1px solid #6366f1; border-radius: 20px; padding: 0 10px; width: 240px; height: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); animation: slideLeft 0.2s ease-out; z-index: 100; }
        .genre-search-input { border: none; outline: none; width: 100%; font-size: 0.9rem; color: #1e293b; background: transparent; }
        .search-close-icon { cursor: pointer; color: #94a3b8; padding: 4px; min-width: 24px; }
        .search-close-icon:hover { color: #ef4444; }
        .search-suggestions { position: absolute; top: 110%; right: 0; width: 240px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-height: 200px; overflow-y: auto; z-index: 110; }
        .suggestion-item { padding: 10px 14px; font-size: 0.9rem; color: #475569; cursor: pointer; transition: background 0.1s; display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; }
        .suggestion-item:last-child { border-bottom: none; }
        .suggestion-item:hover { background: #f8fafc; color: #6366f1; }
        .suggestion-count { font-size: 0.75rem; background: #f1f5f9; padding: 2px 6px; border-radius: 10px; color: #64748b; }
        
        /* FOOTER STYLES */
        .home-footer {
            background-color: #1A1A2E;
            color: #8888aa;
            text-align: center;
            padding: 2rem 1rem;
            margin-top: auto;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        .home-footer p { margin: 0; font-size: 0.95rem; }

        /* GRID SECTION TITLE */
        .grid-section-title {
            font-size: 1.5rem;
            color: #334155;
            margin: 2rem 0 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e2e8f0;
        }

        /* CUSTOM SUBSCRIBE POPUP */
        .custom-subscribe-popup {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-12px);
          background-color: white;
          color: #ef4444;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
          border: 1px solid #fecaca;
          animation: popupFadeIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          z-index: 50;
          pointer-events: none;
        }
        .custom-subscribe-popup::after {
          content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
          border-width: 6px; border-style: solid; border-color: white transparent transparent transparent;
        }
        .custom-subscribe-popup::before {
          content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
          border-width: 7px; border-style: solid; border-color: #fecaca transparent transparent transparent; z-index: -1;
        }

        @keyframes slideLeft { from { opacity: 0; width: 40px; } to { opacity: 1; width: 240px; } }
        @keyframes popupFadeIn { from { opacity: 0; transform: translateX(-50%) translateY(5px); } to { opacity: 1; transform: translateX(-50%) translateY(-12px); } }

        /* MOBILE FIX FOR SEARCH LAYOUT */
        @media (max-width: 640px) {
            .mobile-search-expand {
                width: calc(100vw - 3rem) !important;
                max-width: 320px;
                animation: slideLeftMobile 0.2s ease-out !important;
            }
            .search-suggestions {
                width: calc(100vw - 3rem) !important;
                max-width: 320px;
            }
            @keyframes slideLeftMobile { 
                from { opacity: 0; width: 40px; } 
                to { opacity: 1; width: calc(100vw - 3rem); max-width: 320px; } 
            }
            
            .section-title-simple {
                font-size: 1.5rem !important; 
            }
            .section-subtitle {
                font-size: 0.9rem !important;
            }
        }
      `}</style>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-badge"><span className="badge-dot"></span>Curated Collection</span>
            <h1 className="hero-title">Discover Stories That <span className="gradient-text"> Transform Minds</span></h1>
            <p className="hero-description">Explore our carefully curated collection of {books.length}+ exceptional titles.</p>
            <div className="hero-actions">
              <Link to="/books" className="btn-primary">
                <span>Explore Collection</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            {topRated.slice(0, 3).map((book, index) => (
              <div key={book._id} className={`hero-card card-${index + 1}`}>
                 <div 
                    style={{position:'relative', width:'100%', height:'100%', cursor: 'pointer'}}
                    onClick={() => handleBookNavigation(book._id)}
                 >
                    {getBookImage(book) ? <img src={getBookImage(book)} alt={book.title} className="hero-card-image" /> : 
                    <div className="hero-card-placeholder">
                        <span className="placeholder-title">{book.title}</span>
                    </div>
                    }
                    <div className="card-shine"></div>
                 </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-stats">
            <div className="stat-item">
               <span className="stat-number">{stats.totalBooks.toLocaleString()}+</span>
               <span className="stat-label">Curated Books</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
               <span className="stat-number">{allCategories.length}+</span>
               <span className="stat-label">Categories</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
               <span className="stat-number">{stats.displayReviews}+</span>
               <span className="stat-label">Community Reviews</span>
            </div>
        </div>
      </section>

      {/* 1. LATEST ADDITIONS */}
      <SectionSlider 
        title="Latest Additions" 
        subtitle="Freshly added to our shelves"
        link="/books?filter=new"
        items={newArrivals}
        scrollRef={latestRef}
        isAuto={true}
        onHoverStart={() => setIsPaused(true)}
        onHoverEnd={() => setIsPaused(false)}
        handleBookNavigation={handleBookNavigation}
      />

      {/* 2. TOP PICKS */}
      <div className="alt-bg">
          <SectionSlider 
            title="Top Picks" 
            subtitle="Books our community loves the most"
            link="/books?sort=rating"
            items={topRated}
            scrollRef={topPicksRef}
            handleBookNavigation={handleBookNavigation}
          />
      </div>

      {/* 3. COMMUNITY FAVORITES */}
      <SectionSlider 
        title="Community Favorites" 
        subtitle="Books generating the most conversation"
        link="/books?sort=reviews"
        items={mostReviewed}
        scrollRef={communityRef}
        handleBookNavigation={handleBookNavigation}
      />

      {/* 4. EXPLORE CATEGORIES & GENRES SECTION */}
      <section className="content-section alt-bg">
        <div className="section-header">
          {/* UPDATED HEADER LAYOUT FOR MOBILE COMPATIBILITY */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '1rem' }}>
            <div className="section-title-group" style={{ flex: 1, minWidth: 0 }}>
                <h2 className="section-title-simple" style={{ marginBottom: '0.25rem' }}>Explore Categories/Genres</h2>
                <p className="section-subtitle" style={{ margin: 0 }}>Find books that match your interests</p>
            </div>
            
            <div className="genre-search-wrapper" ref={searchRef} style={{ margin: 0, flexShrink: 0 }}>
              {isSearchOpen ? (
                  <div className="genre-search-input-container mobile-search-expand" style={{ right: 0, left: 'auto' }}>
                      <input type="text" className="genre-search-input" placeholder="Search categories/genres..." autoFocus value={searchTerm} onChange={handleSearchChange} />
                      <svg className="search-close-icon" onClick={() => setIsSearchOpen(false)} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      {searchResults.length > 0 && (
                          <div className="search-suggestions" style={{ right: 0, left: 'auto' }}>
                              {searchResults.map(res => (
                                  <div key={res} className="suggestion-item" onClick={() => selectFilter(res)}>
                                      <span>{res}</span>
                                      <span className="suggestion-count">
                                          {genreMap[res] ? genreMap[res].length : categoryMap[res]?.length}
                                      </span>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              ) : (
                  <button className="genre-search-btn" onClick={() => setIsSearchOpen(true)} title="Search">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="genres-container">
          
          {/* CATEGORY TABS CAPSULES */}
          {defaultCategories.length > 0 && (
            <div className="tabs-scroll-wrapper" style={{marginBottom: '1rem'}}>
               <button className="slider-btn small left" onClick={() => scrollElement(categoryTabsRef, 'left')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg></button>
               <div className="genre-tabs scrollable" ref={categoryTabsRef}>
                  {defaultCategories.map((cat) => (
                    <button
                      key={cat}
                      className={`genre-tab ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => {
                          setActiveCategory(activeCategory === cat ? null : cat);
                          setActiveGenre(null); // Deselect genre if category is clicked
                      }}
                    >
                      <span className="genre-name">{cat}</span>
                      <span className="genre-count">{categoryMap[cat]?.length || 0}</span>
                    </button>
                  ))}
              </div>
              <button className="slider-btn small right" onClick={() => scrollElement(categoryTabsRef, 'right')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg></button>
            </div>
          )}

          {/* GENRE TABS CAPSULES */}
          <div className="tabs-scroll-wrapper">
             <button className="slider-btn small left" onClick={() => scrollElement(genreTabsRef, 'left')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg></button>
             <div className="genre-tabs scrollable" ref={genreTabsRef}>
                {defaultGenres.map((genre) => (
                  <button
                    key={genre}
                    className={`genre-tab ${activeGenre === genre ? 'active' : ''}`}
                    onClick={() => {
                        setActiveGenre(activeGenre === genre ? null : genre);
                        setActiveCategory(null); // Deselect category if genre is clicked
                    }}
                  >
                    <span className="genre-name">{genre}</span>
                    <span className="genre-count">{genreMap[genre]?.length || 0}</span>
                  </button>
                ))}
            </div>
            <button className="slider-btn small right" onClick={() => scrollElement(genreTabsRef, 'right')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg></button>
          </div>

          {/* CONDITIONAL RENDER: Show books if capsule selected, otherwise show grouped grids */}
          <div className="genre-content">
            {(activeGenre || activeCategory) ? (
              <div className="slider-wrapper">
                  <button className="slider-btn left" onClick={() => scrollElement(filterBooksRef, 'left')}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg></button>
                  <div className="books-slider" ref={filterBooksRef}>
                    {activeBooks.map((book) => (
                      <div 
                         key={book._id} 
                         className="book-slide-item clickable-card"
                         onClick={() => handleBookNavigation(book._id)}
                      >
                           <BookCard book={book} imageUrl={getBookImage(book)} />
                      </div>
                    ))}
                  </div>
                  <button className="slider-btn right" onClick={() => scrollElement(filterBooksRef, 'right')}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg></button>
              </div>
            ) : (
              <>
                {/* DEFAULT VIEW: CATEGORY CARDS */}
                <h3 className="grid-section-title">Categories</h3>
                <div className="genres-grid" style={{marginBottom: '3rem'}}>
                  {defaultCategories.slice(0, 8).map((cat) => (
                    <Link key={cat} to={`/books?category=${encodeURIComponent(cat)}`} className="genre-card">
                      <div className="genre-card-header">
                        <div className="genre-icon-wrapper"><svg className="genre-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></div>
                        <div className="genre-info"><h4 className="genre-name">{cat}</h4><p className="genre-book-count">{categoryMap[cat]?.length || 0} books</p></div>
                      </div>
                      <div className="genre-preview">
                         {categoryMap[cat]?.slice(0, 3).map((b, i) => (
                           <div key={b._id} className="mini-book" style={{ zIndex: 3-i }}>
                             {getBookImage(b) ? <img src={getBookImage(b)} alt="" loading="lazy" /> : 
                               <div className="mini-placeholder"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
                             }
                           </div>
                         ))}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* DEFAULT VIEW: GENRE CARDS */}
                <h3 className="grid-section-title">Genres</h3>
                <div className="genres-grid">
                  {defaultGenres.slice(0, 8).map((genre) => (
                    <Link key={genre} to={`/books?genre=${encodeURIComponent(genre)}`} className="genre-card">
                      <div className="genre-card-header">
                        <div className="genre-icon-wrapper"><svg className="genre-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
                        <div className="genre-info"><h4 className="genre-name">{genre}</h4><p className="genre-book-count">{genreMap[genre]?.length || 0} books</p></div>
                      </div>
                      <div className="genre-preview">
                         {genreMap[genre]?.slice(0, 3).map((b, i) => (
                           <div key={b._id} className="mini-book" style={{ zIndex: 3-i }}>
                             {getBookImage(b) ? <img src={getBookImage(b)} alt="" loading="lazy" /> : 
                               <div className="mini-placeholder"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
                             }
                           </div>
                         ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* NEWSLETTER SECTION */}
      <section className="newsletter-section">
        <div className="newsletter-background"></div>
        <div className="newsletter-content">
            <div className="newsletter-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
            <h2 className="newsletter-title">Stay in the Loop</h2>
            <p className="newsletter-desc">Get notified about new arrivals, exclusive deals, and curated recommendations</p>
            <div className="newsletter-form" style={{ position: 'relative' }}>
                <div className="input-wrapper">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <input type="email" placeholder="Enter your email address" className="newsletter-input" />
                </div>
                
                <div style={{ position: 'relative' }}>
                    <button className="btn-primary newsletter-btn" onClick={handleSubscribe}>
                        <span>Subscribe</span>
                    </button>
                    
                    {showSubscribePopup && (
                        <div className="custom-subscribe-popup">
                            This function is in implement stage
                        </div>
                    )}
                </div>
            </div>
            <p className="newsletter-privacy">We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
          <p>&copy; {new Date().getFullYear()} BookNest. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;