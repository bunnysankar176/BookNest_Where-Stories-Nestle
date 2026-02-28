import { Star } from "lucide-react";
import "../../styles/Reviews.css";

const RatingDistribution = ({ distribution, totalReviews }) => {
  return (
    <div className="distribution-container">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] || 0;
        const percent = totalReviews > 0 
  ? Math.round((count / totalReviews) * 100)
  : 0;
        return (
          <div key={star} className="distribution-row">
            <div className="star-label">{star} <Star size={12} fill="#5A6282" stroke="none" /></div>
            <div className="bar-bg"><div className="bar-fill" style={{ width: `${percent}%` }} /></div>
            <span className="count-text">{count}</span>
          </div>
        );
      })}
    </div>
  );
};
export default RatingDistribution;