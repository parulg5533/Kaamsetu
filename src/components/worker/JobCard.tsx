'use client';

import React from 'react';
import { MapPin, Clock, Utensils, Star, Zap, Check } from 'lucide-react';
import { Language } from '@/lib/translations';
import type { ApplicationStatus } from '@/lib/status';
import type { NearbyJob } from '@/lib/types/worker';

export type { NearbyJob } from '@/lib/types/worker';

/** What the worker can do with a job, derived from their own application on it. */
export type JobActionState = 'APPLY' | 'APPLIED' | 'HIRED' | 'FILLED' | 'DONE';

export function getJobActionState(status: ApplicationStatus | null): JobActionState {
  switch (status) {
    case 'APPLIED':
      return 'APPLIED';
    case 'ACCEPTED':
    case 'IN_PROGRESS':
      return 'HIRED';
    case 'REJECTED':
      return 'FILLED';
    case 'COMPLETED':
      return 'DONE';
    default:
      // null (no application) or WITHDRAWN: the worker may apply.
      return 'APPLY';
  }
}

const ACTION_LABELS: Record<JobActionState, { en: string; hi: string }> = {
  APPLY: { en: 'Apply for this Job', hi: 'आवेदन करें (Apply Now)' },
  APPLIED: { en: 'Applied · Waiting for customer', hi: 'आवेदन भेजा गया · स्वीकृति की प्रतीक्षा' },
  HIRED: { en: 'Hired ✓', hi: 'काम मिल गया ✓' },
  FILLED: { en: 'Position filled', hi: 'यह पद भर गया है' },
  DONE: { en: 'Completed ✓', hi: 'काम पूरा हुआ ✓' },
};

export function getJobActionLabel(state: JobActionState, lang: Language): string {
  return lang === 'hi' ? ACTION_LABELS[state].hi : ACTION_LABELS[state].en;
}

/** Business rating, or "New" until the business has at least one review. */
export const BusinessRating: React.FC<{ lang: Language; rating: number; ratingCount: number }> = ({
  lang,
  rating,
  ratingCount,
}) => {
  if (ratingCount < 1) {
    return (
      <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>
        {lang === 'hi' ? 'नया' : 'New'}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--text-primary)', fontWeight: 700 }}>
      <Star size={11} fill="#f59e0b" color="#f59e0b" />
      {rating.toFixed(1)}
    </span>
  );
};

export const InvitedBadge: React.FC<{ lang: Language }> = ({ lang }) => (
  <span
    style={{
      display: 'inline-flex',
      alignSelf: 'flex-start',
      fontSize: '0.7rem',
      fontWeight: 800,
      padding: '2px 8px',
      borderRadius: '999px',
      backgroundColor: 'var(--brand-success-subtle)',
      color: 'var(--brand-success)',
      marginBottom: '4px',
    }}
  >
    {lang === 'hi' ? 'आपको बुलाया' : 'Invited you'}
  </span>
);

function statusBoxStyle(state: Exclude<JobActionState, 'APPLY'>): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.82rem',
    fontWeight: 700,
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  };
  if (state === 'HIRED') {
    return {
      ...base,
      backgroundColor: 'var(--brand-success-subtle)',
      border: '1px solid var(--brand-success)',
      color: 'var(--brand-success)',
    };
  }
  if (state === 'APPLIED') {
    return {
      ...base,
      backgroundColor: 'var(--bg-subtle)',
      border: '1px solid var(--border-subtle)',
      color: 'var(--brand-accent-hover)',
    };
  }
  return {
    ...base,
    backgroundColor: 'var(--bg-subtle)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-muted)',
  };
}

export interface JobCardProps {
  lang: Language;
  job: NearbyJob;
  onApply: (jobId: string) => void;
  onWithdrawJob?: (jobId: string) => void;
  loading: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  lang,
  job,
  onApply,
  onWithdrawJob,
  loading,
}) => {
  const actionState = getJobActionState(job.my_application_status);

  return (
    <div className="job-item">
      {/* Header: Title & Wage */}
      <div className="job-header-row">
        <div>
          {job.is_invited && <InvitedBadge lang={lang} />}
          <h3 className="job-title">{job.title}</h3>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{job.business.business_name}</span>
            <span>·</span>
            <BusinessRating lang={lang} rating={job.business.rating} ratingCount={job.business.rating_count} />
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="job-wage">₹{job.wage}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'hi' ? '/दिन' : '/day'}</div>
        </div>
      </div>

      {/* Meta details: Distance, shift hours, meals */}
      <div className="job-meta-row">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <MapPin size={12} color="var(--brand-accent)" />
          <span>{job.distance_km} km ({job.locality})</span>
        </span>
        <span>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <Clock size={12} />
          <span>{job.start_time} - {job.end_time}</span>
        </span>
        {job.food_provided && (
          <>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--brand-success)' }}>
              <Utensils size={12} />
              <span>{lang === 'hi' ? 'खाना मिलेगा' : 'Food provided'}</span>
            </span>
          </>
        )}
      </div>

      {job.description && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {job.description}
        </p>
      )}

      {/* Action Button */}
      <div style={{ marginTop: '4px' }}>
        {actionState === 'APPLY' ? (
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', minHeight: '38px', fontSize: '0.86rem' }}
            onClick={() => onApply(job.id)}
            disabled={loading}
          >
            <Zap size={15} />
            <span>{getJobActionLabel(actionState, lang)}</span>
          </button>
        ) : (
          <div style={statusBoxStyle(actionState)}>
            {actionState === 'HIRED' && <Check size={16} />}
            <span>{getJobActionLabel(actionState, lang)}</span>
          </div>
        )}

        {actionState === 'APPLIED' && onWithdrawJob && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', minHeight: '38px', fontSize: '0.86rem', marginTop: '8px' }}
            onClick={() => onWithdrawJob(job.id)}
            disabled={loading}
          >
            <span>{lang === 'hi' ? 'आवेदन वापस लें' : 'Withdraw'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
