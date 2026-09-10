'use client';

import React from 'react';
import { X, Star } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

interface RatingModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  target: {
    jobId: string;
    toUserId: string;
    toName: string;
    role: string;
  } | null;
  ratingValue: number;
  onChangeRating: (val: number) => void;
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  comment: string;
  onChangeComment: (comment: string) => void;
  onSubmitReview: () => void;
  loading: boolean;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  lang,
  isOpen,
  onClose,
  target,
  ratingValue,
  onChangeRating,
  selectedTag,
  onSelectTag,
  comment,
  onChangeComment,
  onSubmitReview,
  loading,
}) => {
  if (!isOpen || !target) return null;

  const workerTags = lang === 'hi' 
    ? ['समय पर आए (Punctual)', 'मेहनती (Hardworking)', 'सभ्य व्यवहार (Polite)', 'तेज़ काम (Fast)']
    : ['Punctual', 'Hardworking', 'Polite', 'Quick Learner'];

  const customerTags = lang === 'hi'
    ? ['समय पर भुगतान (Paid On Time)', 'अच्छा व्यवहार (Respectful & Kind)', 'साफ निर्देश दिए (Clear Instructions)', 'सुरक्षित माहौल (Safe Environment)']
    : ['Paid On Time', 'Respectful & Kind', 'Clear Instructions', 'Safe Environment'];

  const activeTags = target.role === 'WORKER' ? workerTags : customerTags;

  return (
    <div className="bottom-sheet-overlay" role="dialog" aria-modal="true">
      <div className="bottom-sheet-container" style={{ maxHeight: '85vh' }}>
        <div className="sheet-handle-bar" />
        
        <div className="sheet-header">
          <div>
            <div className="sheet-title">
              {lang === 'hi' ? `${target.toName} को रेटिंग दें` : `Rate ${target.toName}`}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {lang === 'hi' ? 'काम पूरा होने पर आपसी विश्वास बढ़ाएं' : 'Build mutual reputation for completed work'}
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* 1-5 Star Picker */}
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              className={`star-btn ${ratingValue >= num ? 'active' : ''}`}
              onClick={() => onChangeRating(num)}
              aria-label={`${num} Stars`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Feedback chips */}
        <div className="tag-chips">
          {activeTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-chip ${selectedTag === tag ? 'selected' : ''}`}
              onClick={() => onSelectTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label">
            {lang === 'hi' ? 'कोई विशेष टिप्पणी (ऐच्छिक)' : 'Optional Feedback'}
          </label>
          <textarea
            className="form-textarea"
            rows={2}
            value={comment}
            onChange={(e) => onChangeComment(e.target.value)}
            placeholder={
              lang === 'hi'
                ? 'अपने अनुभव के बारे में बताएं...'
                : 'Share your experience...'
            }
          />
        </div>

        <button
          type="button"
          className="btn-apply"
          onClick={onSubmitReview}
          disabled={loading}
        >
          {loading
            ? (lang === 'hi' ? 'जमा कर रहे हैं...' : 'Submitting...')
            : (lang === 'hi' ? 'रेटिंग सबमिट करें ✓' : 'Submit Rating & Update Trust Profile')}
        </button>
      </div>
    </div>
  );
};
