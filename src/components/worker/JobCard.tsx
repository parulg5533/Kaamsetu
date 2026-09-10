'use client';

import React from 'react';
import { MapPin, Clock, Utensils, CheckCircle2 } from 'lucide-react';
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

  return (
    <div className="job-card">
      <div className="job-header">
        <div>
          <div className="job-title">{job.title}</div>
          <div className="business-sub">
            <span>{job.business.business_name}</span>
            <span>·</span>
            <span>⭐ {job.business.rating}</span>
            <span>({job.business.jobs_completed} {t.jobsCompleted})</span>
          </div>
        </div>
        <div className="wage-badge">
          ₹{job.wage}/{lang === 'hi' ? 'दिन' : 'day'}
        </div>
      </div>

      <div className="job-meta-grid">
        <div className="meta-chip distance">
          <MapPin size={13} />
          {job.distance_km} {lang === 'hi' ? 'किमी दूर' : 'km away'} ({job.locality})
        </div>

        <div className="meta-chip">
          <Clock size={13} />
          {job.job_date} · {job.start_time} - {job.end_time}
        </div>

        {job.food_provided && (
          <div className="meta-chip food">
            <Utensils size={13} />
            {t.foodProvided}
          </div>
        )}
      </div>

      {job.description && (
        <div className="job-description">{job.description}</div>
      )}

      <div className="job-actions">
        {isApplied ? (
          <div className="btn-applied">
            <CheckCircle2 size={16} />
            <span>{t.appliedWaiting}</span>
          </div>
        ) : isAccepted ? (
          <div className="btn-confirmed">
            <CheckCircle2 size={16} />
            <span>{t.jobConfirmed}</span>
          </div>
        ) : (
          <button
            type="button"
            className="btn-apply"
            onClick={() => onApply(job.id)}
            disabled={loading}
          >
            {t.applyNow}
          </button>
        )}
      </div>
    </div>
  );
};
