import { useState } from "react";
import { Star, ShieldAlert, MessageCircle, EyeOff, Eye, User, Calendar, Trash2, AlertTriangle, Undo2, Flag, Info } from "lucide-react";

const AdminReviewCard = ({ review, onActionClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReplyExpanded, setIsReplyExpanded] = useState(false); // NEW: State for Seller Reply

  const isHidden = review.status === "hidden";
  const isFlagged = review.report?.reported;
  const hasUnhideRequest = review.unhideRequested;

  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star 
        key={index} 
        size={14} 
        fill={index < review.rating ? "#F59E0B" : "transparent"} 
        color={index < review.rating ? "#F59E0B" : "#D1D5DB"} 
      />
    ));
  };

  const formattedDate = review.createdAt 
    ? new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : "Recently";

  // Read More / Show Less Logic for Main Comment
  const maxChars = 120;
  const isLong = review.comment && review.comment.length > maxChars;
  const displayText = isExpanded ? review.comment : review.comment?.slice(0, maxChars) + (isLong ? "..." : "");

  // Read More / Show Less Logic for Seller Reply
  const replyText = review.sellerReply?.text || "";
  const isReplyLong = replyText.length > maxChars;
  const displayReplyText = isReplyExpanded ? replyText : replyText.slice(0, maxChars) + (isReplyLong ? "..." : "");

  return (
    <div className={`ar-card ${isHidden ? "is-hidden" : ""} ${isFlagged && !isHidden ? "is-flagged" : ""}`}>
      
      {/* NEW: UNHIDE REQUEST BANNER */}
      {hasUnhideRequest && isHidden && (
        <div className="ar-unhide-request-banner">
          <Info size={14} />
          <span>User requested unhide on {new Date(review.unhideRequestedAt).toLocaleDateString()}</span>
        </div>
      )}

      <div className="ar-card-header">
        <div className="ar-user-info">
          <div className="ar-avatar">
            <User size={16} />
          </div>
          <div className="ar-user-details">
            <span className="ar-user-name">{review.user?.name || "Anonymous User"}</span>
            <span className="ar-date"><Calendar size={12} /> {formattedDate}</span>
          </div>
        </div>
        
        <div className="ar-badges">
          {isHidden && <span className="ar-badge badge-hidden"><EyeOff size={12}/> Hidden</span>}
          {isFlagged && !isHidden && <span className="ar-badge badge-flagged"><AlertTriangle size={12}/> Flagged</span>}
        </div>
      </div>

      <div className="ar-rating-row">
        <div className="ar-stars">{renderStars()}</div>
        <span className="ar-rating-number">{review.rating}.0</span>
      </div>

      <div className="ar-review-content">
        {/* ADDED wordBreak to prevent spam from breaking layout */}
        <p style={{ margin: 0, display: 'inline', wordBreak: 'break-word', overflowWrap: 'break-word' }}>"{displayText}"</p>
        {isLong && (
          <button className="ar-read-more-btn" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      <div className="ar-context-boxes">
        {review.report?.reported && (
          <div className="ar-box ar-box-danger">
            <div className="ar-box-header">
              <ShieldAlert size={14} />
              <strong>Reported Reason</strong>
            </div>
            <p style={{ wordBreak: 'break-word' }}>{review.report.reason || "Violation of community guidelines."}</p>
          </div>
        )}

        {review.sellerReply?.text && (
          <div className="ar-box ar-box-info">
            <div className="ar-box-header">
              <MessageCircle size={14} />
              <strong>Seller Reply</strong>
            </div>
            {/* UPDATED: Applied truncating logic and wordBreak here */}
            <p style={{ margin: 0, display: 'inline', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              {displayReplyText}
            </p>
            {isReplyLong && (
              <button className="ar-read-more-btn" onClick={() => setIsReplyExpanded(!isReplyExpanded)} style={{ marginLeft: '6px' }}>
                {isReplyExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* --- AdminReviewCard.jsx Footer --- */}
<div className="ar-card-footer">
  <div className="ar-footer-left" style={{ display: 'flex', gap: '8px', width: '100%' }}>
    
    {/* 1. RESTORE / HIDE BUTTON */}
    {!isHidden ? (
      <button onClick={() => onActionClick(review, 'hide')} className="ar-btn ar-btn-warning">
        <EyeOff size={16} />
        <span>Hide</span>
      </button>
    ) : (
      <button onClick={() => onActionClick(review, 'restore')} className="ar-btn ar-btn-success">
        <Eye size={16} />
        <span>Restore</span>
      </button>
    )}

    {/* 2. FLAG / UNFLAG TOGGLE (In the middle) */}
    {!isFlagged ? (
      <button 
        onClick={() => onActionClick(review, 'flag')} 
        className="ar-btn ar-btn-flag-outline"
      >
        <Flag size={16} />
        <span>Flag</span>
      </button>
    ) : (
      <button 
        onClick={() => onActionClick(review, 'unflag')} 
        className="ar-btn ar-btn-unflag"
      >
        <Undo2 size={16} />
        <span>Unflag</span>
      </button>
    )}
    
    {/* 3. DELETE BUTTON (Pushed to the far right) */}
    <button 
      onClick={() => onActionClick(review, 'delete')} 
      className="ar-btn ar-btn-danger-outline" 
      style={{ marginLeft: 'auto' }}
    >
      <Trash2 size={16} />
      <span>Delete</span>
    </button>
  </div>
</div>
    </div>
  );
};

export default AdminReviewCard;