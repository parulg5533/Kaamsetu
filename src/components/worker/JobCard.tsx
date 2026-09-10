'use client';

import React from 'react';
import { MapPin, Clock, Utensils, CheckCircle2, Zap, Star } from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { Card, Badge, StatusBadge, Button } from '@/components/ui';

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
  const isAccepted =
    job.my_application_status === 'ACCEPTED' || job.my_application_status === 'COMPLETED';

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
    <Card interactive elevation="glow" className="job-card" role="article" aria-label={`Job ${job.title}`}>
      {/* 1. Header: Title, Customer info, Daily Wage */}
      <div className="job-header">
        <div>
          <h3 className="job-title">{job.title}</h3>
          <div className="business-sub">
            <span className="business-name">{job.business.business_name}</span>
            <span className="bullet-sep">·</span>
            <span className="business-rating">
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              {job.business.rating}
            </span>
            <span className="business-jobs">
              ({job.business.jobs_completed} {t.jobsCompleted})
            </span>
          </div>
        </div>
        <div className="wage-badge">
          ₹{job.wage}/{lang === 'hi' ? 'दिन' : 'day'}
        </div>
      </div>

      {/* 2. Metadata Chips (Distance, Timing, Meals) */}
      <div className="job-meta-grid">
        <Badge variant="info" icon={<MapPin size={13} />}>
          {job.distance_km} {lang === 'hi' ? 'किमी दूर' : 'km away'} ({job.locality})
        </Badge>

        <Badge variant="default" icon={<Clock size={13} />}>
          {timingBadge}
        </Badge>

        {job.food_provided && (
          <Badge variant="success" icon={<Utensils size={13} />}>
            {t.foodProvided}
          </Badge>
        )}
      </div>

      {/* 3. Job Description */}
      {job.description && (
        <p className="job-description">{job.description}</p>
      )}

      {/* 4. Action CTA */}
      <div className="job-actions">
        {isApplied ? (
          <StatusBadge
            status="applied"
            label={t.appliedWaiting}
            className="btn-status-full"
          />
        ) : isAccepted ? (
          <StatusBadge
            status="confirmed"
            label={t.jobConfirmed}
            className="btn-status-full"
          />
        ) : (
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={<Zap size={16} />}
            onClick={() => onApply(job.id)}
            disabled={loading}
          >
            {t.applyNow}
          </Button>
        )}
      </div>
    </Card>
  );
};
