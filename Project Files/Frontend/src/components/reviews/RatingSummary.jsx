import RatingDistribution from "./RatingDistribution";
import { Star } from "lucide-react";
import "../../styles/Reviews.css";

const RatingSummary = ({ average, totalReviews, distribution }) => {
  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>{average?.toFixed(1) || "0.0"}</h2>
        <div className="ro-rating" style={{color:'#f59e0b', margin:'0.5rem 0'}}>
           {[...Array(5)].map((_, i) => {
  const starValue = i + 1;
  const filled = average >= starValue;

  return (
    <Star
      key={i}
      size={24}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
    />
  );
})}
        </div>
        <div className="summary-sub">{totalReviews || 0} Global Ratings</div>
      </div>
      <RatingDistribution distribution={distribution || {}} totalReviews={totalReviews || 0} />
    </div>
  );
};
export default RatingSummary;