'use client';

import React from 'react';
import { MapPin, Clock, Utensils, Star, Zap, Check } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

export interface NearbyJob {
  id: string;
  title: string;
  description: string;
  skill_name: string;
  skill_id: string;
  wage: number;
  food_provided: boolean;
  job_date: string;
  start_time: string;
  end_time: string;
  locality: string;
  workers_required: number;
  workers_accepted: number;
  distance_km: number;
  business: {
    id: string;
    business_name: string;
    business_type?: string;
    locality?: string;
    rating?: number;
    jobs_completed?: number;
  };
  my_application_status: string | null;
  application_id: string | null;
}

interface JobCardProps {
  lang: Language;
  job: NearbyJob;
  onApply: (jobId: string) => void;
  loading: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  lang,
  job,
  onApply,
  loading,
}) => {
  const t = translations[lang];
  const isApplied = job.my_application_status === 'APPLIED';
  const isAccepted = job.my_application_status === 'ACCEPTED';

  return (
    <div className="job-item">
      {/* Header: Title & Wage */}
      <div className="job-header-row">
        <div>
          <h3 className="job-title">{job.title}</h3>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{job.business.business_name}</span>
            {job.business.rating && job.business.rating > 0 && (
              <>
                <span>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--text-primary)', fontWeight: 700 }}>
                  <Star size={11} fill="#f59e0b" color="#f59e0b" />
                  {job.business.rating}
                </span>
              </>
            )}
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
        {isApplied ? (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--brand-accent-hover)',
              textAlign: 'center',
            }}
          >
            {lang === 'hi' ? 'आवेदन भेजा गया · स्वीकृति की प्रतीक्षा' : 'Applied · Waiting for customer'}
          </div>
        ) : isAccepted ? (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--brand-success-subtle)',
              border: '1px solid var(--brand-success)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--brand-success)',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Check size={16} />
            <span>{lang === 'hi' ? 'काम पक्का हुआ ✓' : 'Job Accepted & Confirmed ✓'}</span>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', minHeight: '38px', fontSize: '0.86rem' }}
            onClick={() => onApply(job.id)}
            disabled={loading}
          >
            <Zap size={15} />
            <span>{lang === 'hi' ? 'आवेदन करें (Apply Now)' : 'Apply for this Job'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
