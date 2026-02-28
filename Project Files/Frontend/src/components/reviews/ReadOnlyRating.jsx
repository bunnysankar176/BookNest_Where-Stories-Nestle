import { Star } from "lucide-react";
import "../../styles/ReadOnlyRating.css";


const ReadOnlyRating = ({ value = 0, size = 20, showNumber = true }) => {
  const normalizedValue = Math.round(value * 2) / 2;
  return (
    <div className="rating-container">
      {[1, 2, 3, 4, 5].map((star) => {
        let fill = 0;

        if (normalizedValue >= star) fill = 100;
        else if (normalizedValue >= star - 0.5) fill = 50;

        return (
          <div
            key={star}
            className="star-wrapper"
            style={{ width: size, height: size }}
          >
            <Star size={size} className="star-bg" />
            <div
              className="star-fill"
              style={{ width: `${fill}%` }}
            >
              <Star size={size} fill="#ffc107" stroke="#ffc107" />
            </div>
          </div>
        );
      })}
      {showNumber && (
  <span className="rating-number">{normalizedValue.toFixed(1)}</span>
)}
    </div>
  );
};

export default ReadOnlyRating;
