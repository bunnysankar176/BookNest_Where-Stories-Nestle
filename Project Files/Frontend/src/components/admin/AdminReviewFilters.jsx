import { LayoutGrid, AlertTriangle, EyeOff, Search, Info } from "lucide-react";

const AdminReviewFilters = ({ filter, setFilter, searchTerm, setSearchTerm, resultCount, isBookView }) => {
  return (
    <div className="ar-filter-wrapper">
      <div className="ar-search-container">
        <Search size={18} className="ar-search-icon" />
        <input 
          type="text" 
          placeholder="Search by book, user, or comment..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ar-search-input"
        />
      </div>

      <div className="ar-filter-bar">
        <button
          className={`ar-filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          <LayoutGrid size={16} />
          <span className="hide-mobile">All</span>
        </button>

        <button
          className={`ar-filter-btn ${filter === "unhide_requests" ? "active unhide" : ""}`}
          onClick={() => setFilter("unhide_requests")}
        >
          <Info size={16} />
          <span className="hide-mobile">Unhide Requests</span>
        </button>

        <button
          className={`ar-filter-btn ${filter === "flagged" ? "active flagged" : ""}`}
          onClick={() => setFilter("flagged")}
        >
          <AlertTriangle size={16} />
          <span className="hide-mobile">Flagged</span>
        </button>

        <button
          className={`ar-filter-btn ${filter === "hidden" ? "active hidden" : ""}`}
          onClick={() => setFilter("hidden")}
        >
          <EyeOff size={16} />
          <span className="hide-mobile">Hidden</span>
        </button>
      </div>
      
      <div className="ar-results-count">
        Showing <strong>{resultCount}</strong> {isBookView ? (resultCount === 1 ? 'book' : 'books') : (resultCount === 1 ? 'review' : 'reviews')}
      </div>
    </div>
  );
};

export default AdminReviewFilters;