import { useState, useEffect } from "react";
import StarRating from "./StarRating";
import { addReview, updateReview, checkReviewEligibility } from "../../services/reviewService";
import { AlertCircle, CheckCircle, Save, Loader, Edit2, Trash2 } from "lucide-react";
import "../../styles/Reviews.css";

const AddReview = ({ bookId, onReviewAdded, existingReview, onDeleteReview, startInEditMode = false, onCancelEdit }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // FIX 3: Initialize with prop and sync it
  const [isEditing, setIsEditing] = useState(startInEditMode);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [eligibilityMsg, setEligibilityMsg] = useState("Only customers who purchased this book can leave a review.");

  // FIX 3: Ensure edit mode stays synced if clicked from the review list
  useEffect(() => {
    setIsEditing(startInEditMode);
  }, [startInEditMode]);

  useEffect(() => {
    if(existingReview && !startInEditMode) { setLoading(false); return; } 
    const fetchEligibility = async () => {
      try {
        const data = await checkReviewEligibility(bookId);
        setEligible(data.eligible);
        if (!data.eligible && data.message) setEligibilityMsg(data.message);
      } catch (error) { console.error("Eligibility check failed"); } 
      finally { setLoading(false); }
    };
    fetchEligibility();
  }, [bookId, existingReview, startInEditMode]);

  const handleSubmit = async () => {
    if (submitting) return; 
    if (!rating) { setErrorMsg("Please select a rating."); return; }

    try {
      setSubmitting(true);
      setErrorMsg("");

      if (existingReview) {
        await updateReview(existingReview._id, { rating, comment });
      } else {
        await addReview({ bookId, rating, comment });
        setRating(0);
        setComment("");
      }

      if (onReviewAdded) onReviewAdded();
      setIsEditing(false);
      if (onCancelEdit) onCancelEdit(); 

    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Operation failed"); 
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (onCancelEdit) onCancelEdit();
  };

  if (loading) return <div className="review-loading"><Loader className="spinner-icon"/> Checking eligibility...</div>;

  return (
    <div className="review-form-container">
      {existingReview && isEditing && <h3 className="form-title">Edit Your Review</h3>}

      {!eligible && !existingReview ? (
        <div className="eligibility-alert">
          <AlertCircle size={20} />
          <span>{eligibilityMsg}</span>
        </div>
      ) : existingReview && !isEditing ? (
        <div className="locked-review-section">
          <div className="locked-content">
            <CheckCircle size={28} className="success-icon" />
            <div className="locked-text">
              <h4>Review Submitted</h4>
              <p>You have already shared your thoughts on this book. Thank you for your feedback!</p>
            </div>
          </div>
          <div className="locked-actions">
            <button className="btn-pill btn-edit-action" onClick={() => setIsEditing(true)}>
              <Edit2 size={16} /> Edit
            </button>
            <button className="btn-pill btn-delete-action" onClick={onDeleteReview}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      ) : (
        <>
          {errorMsg && (
            <div className="error-box"><AlertCircle size={16} /><span>{errorMsg}</span></div>
          )}
          
          <div className="add-review-form">
            <StarRating rating={rating} setRating={setRating} />
            <div className="input-group">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you think about the book?"
              />
            </div>

            {/* FIX 2: Simple UI Buttons */}
            <div className="form-actions-row">
              <button 
                className={existingReview ? "btn-update-simple" : "submit-btn"} 
                onClick={handleSubmit} 
                disabled={submitting}
              >
                {submitting ? <Loader size={18} className="animate-spin" /> : (!existingReview && <Save size={18} />)}
                {existingReview ? "Update" : "Submit Review"}
              </button>
              
              {isEditing && (
                <button className="btn-cancel-simple" onClick={handleCancel}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddReview;