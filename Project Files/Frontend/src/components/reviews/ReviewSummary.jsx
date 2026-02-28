import { useEffect, useState } from "react";
import { getRatingDistribution } from "../../services/reviewService";
import RatingSummary from "./RatingSummary";

const ReviewSummary = ({ bookId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
  const fetch = async () => {
    try {
      setLoading(true);
      const res = await getRatingDistribution(bookId);
      setData(res);
    } catch (e) {
      console.error("Failed to fetch rating summary");
    } finally {
      setLoading(false);
    }
  };

  if (bookId) fetch();
}, [bookId]);

 if (loading) return <div className="summary-loading">Loading ratings...</div>;
if (!data) return null;
  return <RatingSummary average={data.average} totalReviews={data.totalReviews} distribution={data.distribution} />;
};
export default ReviewSummary;