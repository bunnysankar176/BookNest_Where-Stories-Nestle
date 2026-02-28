import { useState } from "react";
import { Star } from "lucide-react";
import "../../styles/Reviews.css";

const StarRating = ({ rating, setRating }) => {
  const [hover, setHover] = useState(null);

  return (
    <div
      className="star-rating-input"
      role="radiogroup"
      aria-label="Star Rating"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={32}
          role="radio"
          aria-checked={rating === star}
          tabIndex={0}
          className={`star-icon ${(hover || rating) >= star ? "filled" : ""}`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          onClick={() => setRating(rating === star ? 0 : star)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setRating(star);
            }
          }}
        />
      ))}
    </div>
  );
};
export default StarRating;