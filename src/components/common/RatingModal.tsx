'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { Language } from '@/lib/translations';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { FeedbackTag } from '@/lib/status';

interface RatingModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  target: {
    applicationId: string;
    toName: string;
    role: 'WORKER' | 'BUSINESS';
  } | null;
  ratingValue: number;
  onChangeRating: (val: number) => void;
  selectedTag: FeedbackTag | null;
  onSelectTag: (tag: FeedbackTag | null) => void;
  comment: string;
  onChangeComment: (comment: string) => void;
  onSubmitReview: () => void;
  loading: boolean;
}

// Display labels for the stable FEEDBACK_TAGS keys. Keys are sent to the API; labels are display-only.
const TAG_LABELS: Record<FeedbackTag, { en: string; hi: string }> = {
  PUNCTUAL: { en: 'Punctual', hi: 'समय पर आए' },
  HARDWORKING: { en: 'Hardworking', hi: 'मेहनती' },
  SKILLED: { en: 'Skilled', hi: 'कुशल' },
  POLITE: { en: 'Polite', hi: 'सभ्य व्यवहार' },
  PAID_ON_TIME: { en: 'Paid On Time', hi: 'समय पर भुगतान' },
  FAIR_WORKLOAD: { en: 'Fair Workload', hi: 'उचित काम का बोझ' },
  GOOD_FOOD: { en: 'Good Food', hi: 'अच्छा खाना' },
  RESPECTFUL: { en: 'Respectful', hi: 'सम्मानजनक व्यवहार' },
};

const WORKER_TAGS: FeedbackTag[] = ['PUNCTUAL', 'HARDWORKING', 'SKILLED', 'POLITE'];
const BUSINESS_TAGS: FeedbackTag[] = ['PAID_ON_TIME', 'FAIR_WORKLOAD', 'GOOD_FOOD', 'RESPECTFUL'];

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

  const activeTags = target.role === 'WORKER' ? WORKER_TAGS : BUSINESS_TAGS;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'hi' ? 'समीक्षा व रेटिंग दें' : 'Rate & Leave a Review'}
      subtitle={lang === 'hi' ? `${target.toName} के साथ अपने अनुभव का मूल्यांकन करें` : `Share your experience with ${target.toName}`}
      footer={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={loading}
            className="btn btn-primary"
            style={{ flex: 1.6 }}
            onClick={onSubmitReview}
          >
            <span>{loading ? (lang === 'hi' ? 'सबमिट हो रहा है...' : 'Submitting...') : (lang === 'hi' ? 'समीक्षा सबमिट करें ✓' : 'Submit Review ✓')}</span>
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
        {/* Star Rating Select */}
        <div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {lang === 'hi' ? 'रेटिंग चुनें' : 'Select Rating'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChangeRating(star)}
                aria-label={lang === 'hi' ? `5 में से ${star} स्टार` : `${star} of 5 stars`}
                aria-pressed={ratingValue === star}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  transform: ratingValue >= star ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <Star
                  size={32}
                  fill={ratingValue >= star ? '#f59e0b' : '#e2e8f0'}
                  color={ratingValue >= star ? '#f59e0b' : '#cbd5e1'}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Tags */}
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {lang === 'hi' ? 'मुख्य विशेषता चुनें:' : 'What stood out?'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            {activeTags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectTag(isSelected ? null : tag)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                    backgroundColor: isSelected ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                    color: isSelected ? 'var(--text-inverse)' : 'var(--text-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {TAG_LABELS[tag][lang === 'hi' ? 'hi' : 'en']}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Comment */}
        <div>
          <textarea
            rows={3}
            placeholder={lang === 'hi' ? 'अतिरिक्त टिप्पणी (वैकल्पिक)...' : 'Write a brief comment (optional)...'}
            value={comment}
            onChange={(e) => onChangeComment(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.86rem',
              resize: 'none',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>
      </div>
    </BottomSheet>
  );
};
