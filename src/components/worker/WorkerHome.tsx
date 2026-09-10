'use client';

import React, { useState } from 'react';
import { Briefcase, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { JobCard, NearbyJob } from './JobCard';
import { ApplicationsList, WorkerApplication } from './ApplicationsList';

interface WorkerProfile {
  id: string;
  name: string;
  phone: string;
  city: string;
  locality: string;
  experience_years: number;
  expected_wage: number;
  availability: string;
  rating: number;
  rating_count: number;
  jobs_completed: number;
  attendance_rate: number;
  skills: Array<{ id: string; name: string }>;
}

interface WorkerHomeProps {
  lang: Language;
  workerProfile: WorkerProfile | null;
  availability: string;
  onSetAvailability: (status: string) => void;
  nearbyJobs: NearbyJob[];
  applications: WorkerApplication[];
  onApplyJob: (jobId: string) => void;
  onConfirmCompleted: (jobId: string) => void;
  onRateBusiness: (businessId: string, businessName: string, jobId: string) => void;
  loading: boolean;
}

export const WorkerHome: React.FC<WorkerHomeProps> = ({
  lang,
  workerProfile,
  availability,
  onSetAvailability,
  nearbyJobs,
  applications,
  onApplyJob,
  onConfirmCompleted,
  onRateBusiness,
  loading,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'NEARBY' | 'APPLICATIONS'>('NEARBY');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. Daily Availability Toggle Box */}
      <div className="worker-avail-box">
        <div className="avail-title">{t.canIGetWork}</div>
        <div className="avail-grid">
          <button
            type="button"
            className={`avail-btn ${availability === 'AVAILABLE_TODAY' ? 'active-today' : ''}`}
            onClick={() => onSetAvailability('AVAILABLE_TODAY')}
          >
            {t.availableToday}
          </button>
          <button
            type="button"
            className={`avail-btn ${availability === 'AVAILABLE_TOMORROW' ? 'active-tomorrow' : ''}`}
            onClick={() => onSetAvailability('AVAILABLE_TOMORROW')}
          >
            {t.availableTomorrow}
          </button>
          <button
            type="button"
            className={`avail-btn ${availability === 'UNAVAILABLE' ? 'active-off' : ''}`}
            onClick={() => onSetAvailability('UNAVAILABLE')}
          >
            {t.notAvailable}
          </button>
        </div>
      </div>

      {/* 2. Worker Stats Summary Strip */}
      {workerProfile && (
        <div style={{ padding: '0 20px', display: 'flex', gap: '8px' }}>
          <div
            style={{
              flex: 1,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{t.earningsEst}</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fbbf24' }}>
              ₹{workerProfile.expected_wage}/{lang === 'hi' ? 'दिन' : 'day'}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lang === 'hi' ? 'आपकी रेटिंग व काम' : 'Rating & Trust'}</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399' }}>
              ⭐ {workerProfile.rating} ({workerProfile.jobs_completed} {t.jobsCompleted})
            </span>
          </div>
        </div>
      )}

      {/* 3. Sub-navigation tabs */}
      <div style={{ padding: '0 20px', display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className={`avail-btn ${activeTab === 'NEARBY' ? 'active-today' : ''}`}
          style={{ flex: 1, padding: '10px' }}
          onClick={() => setActiveTab('NEARBY')}
        >
          💼 {t.jobsNearYouHeading.split(' (')[0]} ({nearbyJobs.length})
        </button>
        <button
          type="button"
          className={`avail-btn ${activeTab === 'APPLICATIONS' ? 'active-tomorrow' : ''}`}
          style={{ flex: 1, padding: '10px' }}
          onClick={() => setActiveTab('APPLICATIONS')}
        >
          📋 {t.myApplicationsHeading.split(' और ')[0]} ({applications.length})
        </button>
      </div>

      {/* 4. Feed Content */}
      <div className="feed-content">
        {activeTab === 'NEARBY' ? (
          loading ? (
            <>
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </>
          ) : nearbyJobs.length === 0 ? (
            <div className="empty-state">
              <Briefcase size={36} />
              <p style={{ fontWeight: 700 }}>{t.noJobsNear}</p>
            </div>
          ) : (
            nearbyJobs.map((job) => (
              <JobCard
                key={job.id}
                lang={lang}
                job={job}
                onApply={onApplyJob}
                loading={loading}
              />
            ))
          )
        ) : (
          <ApplicationsList
            lang={lang}
            applications={applications}
            onConfirmCompleted={onConfirmCompleted}
            onRateBusiness={onRateBusiness}
          />
        )}
      </div>
    </div>
  );
};
