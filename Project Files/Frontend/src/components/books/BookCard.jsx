import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ArrowRight } from "lucide-react";
// 1. Import the service to get live stats
import { getRatingDistribution } from "../../services/reviewService"; 
import "../../styles/BookCard.css";

function BookCard({ book, imageUrl, badge }) {
  // 2. Initialize state with the DB value, fallback to 0
  const [ratingValue, setRatingValue] = useState(Number(book?.ratingsAverage) || 0);

  const mainImage =
    imageUrl ||
    (book?.images && book.images.length > 0 ? book.images[0].url : "") ||
    book?.coverImage ||
    book?.image ||
    "";

  // 3. Fetch the LIVE rating to guarantee it matches BookDetails exactly
  useEffect(() => {
    const fetchLiveRating = async () => {
      if (!book?._id) return;
      try {
        const stats = await getRatingDistribution(book._id);
        if (stats && typeof stats.average === 'number') {
          setRatingValue(stats.average);
        }
      } catch (error) {
        console.error("Failed to fetch live rating for card", error);
      }
    };
    fetchLiveRating();
  }, [book?._id]);

  const hasRating = ratingValue > 0;

  return (
    <Link to={`/books/${book?._id}`} className="book-card">
      
      {/* Image Section */}
      <div className="book-card-image">
        {mainImage ? (
          <img src={mainImage} alt={book?.title || "Book Cover"} loading="lazy" />
        ) : (
          <div className="image-placeholder">
            <span>No Cover</span>
          </div>
        )}
        {badge === "NEW" && <span className="new-badge">New</span>}
      </div>

      {/* Content Section */}
      <div className="book-card-content">
        
        {/* Title & Author */}
        <div>
           <h3 className="book-title" title={book?.title}>{book?.title}</h3>
           <p className="book-author">{book?.author}</p>
        </div>

        {/* Footer (Pushed to bottom) */}
        <div className="book-footer">
          <div className="book-rating">
            <Star 
              size={14} 
              fill={hasRating ? "#fbbf24" : "none"} 
              color={hasRating ? "#fbbf24" : "currentColor"}
              strokeWidth={2} 
            />
            {/* Display the live fetched rating */}
            <span>{ratingValue.toFixed(1)}</span>
          </div>
          <span className="book-price">₹{book?.price || 0}</span>
        </div>

        {/* Button */}
        <button className="book-card-btn">
          View Details
          <ArrowRight size={16} />
        </button>

      </div>
    </Link>
  );
}

export default BookCard;