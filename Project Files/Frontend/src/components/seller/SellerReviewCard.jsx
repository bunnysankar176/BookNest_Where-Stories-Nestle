import { useState, useEffect } from "react";
import { 
  replyToReview, 
  updateReviewReply 
} from "../../services/reviewService";
import { 
  Flag, Send, Loader2, Edit2, Trash2, Undo2, Calendar, Star 
} from "lucide-react";

const SellerReviewCard = ({ review, refresh, showToast, onActionClick }) => {
  const existingReply = review.sellerReply?.text || review.reply?.message || "";
  const hasReply = existingReply.trim().length > 0;

  const [reply, setReply] = useState(existingReply);
  const [sending, setSending] = useState(false);
  const [isEditingReply, setIsEditingReply] = useState(false);
  
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);

  useEffect(() => {
    setReply(existingReply);
  }, [existingReply]);

  const isReported = review.status === 'flagged' || review.report?.reported;
  
  // Extract first letter of user for the avatar
  const avatarLetter = review.user?.name ? review.user.name.charAt(0).toUpperCase() : "?";

  // Format Date
  const formattedDate = review.createdAt 
    ? new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : "Recently";

  // --- Actions ---
  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      setSending(true);
      if (hasReply) {
        await updateReviewReply(review._id, { text: reply });
        showToast("Your reply has been updated successfully.");
      } else {
        await replyToReview(review._id, { text: reply }); 
        showToast("Your reply has been published successfully.");
      }
      setIsEditingReply(false);
      refresh();
    } catch (err) {
      showToast("We encountered an issue saving your reply. Please try again later.", "error");
    } finally {
      setSending(false);
    }
  };

  // --- Truncation Logic ---
  const MAX_LENGTH = 140;
  
  const commentShouldTruncate = review.comment && review.comment.length > MAX_LENGTH;
  const displayedComment = isCommentExpanded || !commentShouldTruncate 
      ? review.comment 
      : review.comment.slice(0, MAX_LENGTH) + "...";

  const replyShouldTruncate = existingReply && existingReply.length > MAX_LENGTH;
  const displayedReply = isReplyExpanded || !replyShouldTruncate
      ? existingReply
      : existingReply.slice(0, MAX_LENGTH) + "...";

  // --- Star Renderer ---
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

  return (
    <div 
      className={`sr-card ${isReported ? 'sr-flagged-card' : ''}`}
      style={{ 
        border: isReported ? '1px solid #fecaca' : '1px solid var(--dash-border, #e2e8f0)', 
        background: isReported ? '#fffbfb' : 'white',
        transition: 'all 0.3s ease',
        padding: '1.5rem',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* ── CARD HEADER (FIXED LAYOUT) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        
        {/* Left Side: Avatar & Info */}
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '50%', 
            background: 'var(--ao-primary-light, #eef2ff)', color: 'var(--ao-primary, #4f46e5)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 
          }}>
            {avatarLetter}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {review.user?.name || "Unknown Customer"}
            </h4>
            
            {/* Date & Book Title */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> {formattedDate}
              </span>
              <span>•</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                on <strong style={{ color: '#0f172a' }}>{review.book?.title}</strong>
              </span>
            </div>
          </div>
        </div>
        
        {/* Right Side: Flags & Actions */}
        <div style={{ flexShrink: 0 }}>
          {isReported ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #fca5a5' }}>
                <Flag size={12} fill="currentColor" /> FLAGGED
              </div>
              <button 
                onClick={() => onActionClick('unflag', review)}
                title="Remove Flag"
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', transition: '0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'}
                onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
              >
                <Undo2 size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onActionClick('report', review)} 
              title="Report this review as inappropriate"
              style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px', transition: '0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
              onMouseOut={(e) => e.currentTarget.style.color = '#cbd5e1'}
            >
              <Flag size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* ── RATING ROW WITH NUMBER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {renderStars()}
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
          {Number(review.rating).toFixed(1)}
        </span>
      </div>
      
      {/* ── USER COMMENT ── */}
      <div style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.5', fontStyle: 'italic', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        "{displayedComment}"
        {commentShouldTruncate && (
          <span onClick={() => setIsCommentExpanded(!isCommentExpanded)} style={{ color: 'var(--ao-primary, #4f46e5)', fontWeight: 600, cursor: 'pointer', marginLeft: '6px', fontSize: '0.85rem', fontStyle: 'normal' }}>
            {isCommentExpanded ? "Show Less" : "Read More"}
          </span>
        )}
      </div>

      {/* ── SELLER REPLY UI ── */}
      {hasReply && !isEditingReply ? (
        <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid var(--ao-primary, #4f46e5)', marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Reply</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setIsEditingReply(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 500 }} onMouseOver={e=>e.currentTarget.style.color='var(--ao-primary)'} onMouseOut={e=>e.currentTarget.style.color='#64748b'}>
                <Edit2 size={12} /> Edit
              </button>
              <button onClick={() => onActionClick('deleteReply', review)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 500 }} onMouseOver={e=>e.currentTarget.style.color='#ef4444'} onMouseOut={e=>e.currentTarget.style.color='#64748b'}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
          
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', wordBreak: 'break-word', overflowWrap: 'anywhere', display: 'inline' }}>
            {displayedReply}
          </p>
          {replyShouldTruncate && (
            <span onClick={() => setIsReplyExpanded(!isReplyExpanded)} style={{ color: 'var(--ao-primary, #4f46e5)', fontWeight: 600, cursor: 'pointer', marginLeft: '6px', fontSize: '0.85rem', display: 'inline-block' }}>
              {isReplyExpanded ? "Show Less" : "Read More"}
            </span>
          )}
        </div>
      ) : (
        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a public reply..."
            rows="3"
            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'vertical', fontSize: '0.9rem', color: '#0f172a', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            {hasReply && (
              <button onClick={() => { setIsEditingReply(false); setReply(existingReply); }} style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
                Cancel
              </button>
            )}
            <button 
              onClick={handleReply} 
              disabled={sending || !reply.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: reply.trim() ? 'var(--ao-primary, #4f46e5)' : '#cbd5e1', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: reply.trim() ? 'pointer' : 'not-allowed', transition: '0.2s' }}
            >
              {sending ? <Loader2 size={14} className="sr-spin" /> : <Send size={14} />} 
              {hasReply ? "Update" : "Post Reply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerReviewCard;
