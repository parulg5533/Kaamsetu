'use client';

import React from 'react';
import { MapPin, Clock, Utensils, CheckCircle2, Zap } from 'lucide-react';
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
    business_type: string;
    locality: string;
    rating: number;
    jobs_completed: number;
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
  const isAccepted = job.my_application_status === 'ACCEPTED' || job.my_application_status === 'COMPLETED';

  // Compute clean duration
  const getDurationHours = (start: string, end: string) => {
    try {
      const [startH] = start.split(':').map(Number);
      const [endH] = end.split(':').map(Number);
      if (!isNaN(startH) && !isNaN(endH)) {
        const diff = endH - startH;
        if (diff > 0) return `${diff} ${lang === 'hi' ? 'घंटे' : 'hours'}`;
      }
    } catch (e) {}
    return `${start} - ${end}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = job.job_date === todayStr;
  const timingBadge = `${isToday ? (lang === 'hi' ? 'आज' : 'Today') : (lang === 'hi' ? 'कल' : 'Tomorrow')} • ${getDurationHours(job.start_time, job.end_time)}`;

  return (
    <div className="job-card">
      <div className="job-header">
        <div>
          <div className="job-title" style={{ fontSize: '1.08rem', fontWeight: 800 }}>
            {job.title}
          </div>
          <div className="business-sub" style={{ marginTop: '3px' }}>
            <span>{job.business.business_name}</span>
            <span>·</span>
            <span>⭐ {job.business.rating}</span>
            <span>({job.business.jobs_completed} {t.jobsCompleted})</span>
          </div>
        </div>
        <div className="wage-badge" style={{ fontSize: '1.05rem', padding: '6px 12px' }}>
          ₹{job.wage}/{lang === 'hi' ? 'दिन' : 'day'}
        </div>
      </div>

      <div className="job-meta-grid" style={{ margin: '4px 0' }}>
        <div className="meta-chip distance" style={{ fontWeight: 700 }}>
          <MapPin size={13} />
          📍 {job.distance_km} {lang === 'hi' ? 'किमी दूर' : 'km away'} ({job.locality})
        </div>

        <div className="meta-chip" style={{ fontWeight: 600 }}>
          <Clock size={13} />
          {timingBadge}
        </div>

        {job.food_provided && (
          <div className="meta-chip food" style={{ fontWeight: 600 }}>
            <Utensils size={13} />
            🍲 {t.foodProvided}
          </div>
        )}
      </div>

      {job.description && (
        <div className="job-description" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          {job.description}
        </div>
      )}

      <div className="job-actions" style={{ marginTop: '6px' }}>
        {isApplied ? (
          <div
            className="btn-applied"
            style={{ width: '100%', minHeight: '46px', fontSize: '0.88rem', fontWeight: 700 }}
          >
            <CheckCircle2 size={18} />
            <span>{t.appliedWaiting}</span>
          </div>
        ) : isAccepted ? (
          <div
            className="btn-confirmed"
            style={{ width: '100%', minHeight: '46px', fontSize: '0.88rem', fontWeight: 700 }}
          >
            <CheckCircle2 size={18} />
            <span>{t.jobConfirmed}</span>
          </div>
        ) : (
          <button
            type="button"
            className="btn-apply"
            onClick={() => onApply(job.id)}
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '46px',
              fontSize: '0.92rem',
              fontWeight: 800,
              background: 'var(--primary)',
              color: '#000',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            }}
          >
            <Zap size={16} />
            {t.applyNow}
          </button>
        )}
      </div>
    </div>
  );
};
