'use client';

import React, { useState } from 'react';
import { Briefcase, CheckCircle2, Clock, MapPin, Sparkles, Phone, MessageSquare, ShieldCheck, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { JobCard, NearbyJob } from './JobCard';
import { WorkerApplication } from './ApplicationsList';

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
  const [showAppliedDrawer, setShowAppliedDrawer] = useState(false);

  const isAvailable = availability === 'AVAILABLE_TODAY';

  // Confirmed jobs (ACCEPTED or COMPLETED) that require immediate worker attention
  const confirmedApps = applications.filter(
    (a) => a.status === 'ACCEPTED' || a.status === 'COMPLETED'
  );

  // Pending applications awaiting customer confirmation
  const pendingApps = applications.filter((a) => a.status === 'APPLIED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 1. EMOTIONALLY OBVIOUS AVAILABILITY TOGGLE */}
      <div className={`worker-today-card ${isAvailable ? 'available' : 'off'}`}>
        <div>
          <div className="worker-today-title">{t.aajKaamChahiye}</div>
          <div className="worker-today-sub">
            {isAvailable ? t.availableSub : t.offSub}
          </div>
        </div>

        <button
          type="button"
          className={`avail-toggle-btn ${isAvailable ? 'on' : 'off'}`}
          onClick={() =>
            onSetAvailability(isAvailable ? 'UNAVAILABLE' : 'AVAILABLE_TODAY')
          }
          aria-label="Toggle availability"
        >
          {isAvailable ? (
            <>
              <span>🟢</span>
              <span>{lang === 'hi' ? 'उपलब्ध हूँ ✓' : 'Available ✓'}</span>
            </>
          ) : (
            <>
              <span>🔴</span>
              <span>{lang === 'hi' ? 'आज छुट्टी' : 'Off Today'}</span>
            </>
          )}
        </button>
      </div>

      {/* 2. CONFIRMED WORK BANNER (Direct loop closure: Call Customer & Do Work) */}
      {confirmedApps.map((app) => (
        <div key={app.id} className="confirmed-job-banner">
          <div className="confirmed-banner-header">
            <div className="confirmed-banner-title">
              <CheckCircle2 size={18} />
              <span>{t.confirmedWorkHeading}</span>
            </div>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                background: '#10b981',
                color: '#000',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              {app.status === 'COMPLETED' ? (lang === 'hi' ? 'काम पूरा ✓' : 'Completed ✓') : (lang === 'hi' ? 'पक्का हुआ' : 'Confirmed')}
            </span>
          </div>

          <div className="confirmed-banner-body">
            <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#fff' }}>
              {app.job.title}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#93c5fd', marginTop: '2px' }}>
              {lang === 'hi' ? 'काम देने वाला:' : 'Customer:'}{' '}
              <strong style={{ color: '#fff' }}>
                {app.job.business.owner_name || app.job.business.business_name}
              </strong>{' '}
              · ₹{app.job.wage}/{lang === 'hi' ? 'दिन' : 'day'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
              📍 {app.job.locality} · 🕒 {app.job.start_time} - {app.job.end_time}
            </div>
          </div>

          <div className="confirmed-banner-actions">
            {app.job.business.phone && (
              <>
                <a
                  href={`tel:${app.job.business.phone}`}
                  className="btn-call"
                  style={{ flex: 1, minHeight: '40px', fontSize: '0.84rem' }}
                >
                  <Phone size={15} /> {t.callNow} ({app.job.business.phone})
                </a>
                <a
                  href={`https://wa.me/91${app.job.business.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-whatsapp"
                  style={{ minHeight: '40px', padding: '0 14px' }}
                >
                  <MessageSquare size={16} />
                </a>
              </>
            )}

            {!app.worker_confirmed_completed && (
              <button
                type="button"
                className="btn-apply"
                style={{
                  background: '#10b981',
                  color: '#000',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  minHeight: '40px',
                  flex: 1,
                }}
                onClick={() => onConfirmCompleted(app.job.id)}
              >
                <CheckCircle2 size={15} />
                {t.markCompleted}
              </button>
            )}

            <button
              type="button"
              className="btn-apply"
              style={{
                background: '#3b82f6',
                color: '#fff',
                fontSize: '0.8rem',
                minHeight: '40px',
                flex: 1,
              }}
              onClick={() =>
                onRateBusiness(
                  app.job.business.id,
                  app.job.business.business_name,
                  app.job.id
                )
              }
            >
              ⭐ {t.rateUser}
            </button>
          </div>
        </div>
      ))}

      {/* 3. PENDING APPLICATIONS DRAWER TRIGGER (Non-intrusive) */}
      {pendingApps.length > 0 && (
        <div style={{ padding: '0 20px' }}>
          <button
            type="button"
            onClick={() => setShowAppliedDrawer((prev) => !prev)}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '10px 14px',
              color: '#fbbf24',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <span>
              📋 {pendingApps.length} {lang === 'hi' ? 'आवेदन भेजे गए हैं (स्वीकृति का इंतज़ार)' : 'Applied jobs (Waiting for confirmation)'}
            </span>
            {showAppliedDrawer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAppliedDrawer && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {pendingApps.map((app) => (
                <div
                  key={app.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                      {app.job.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {app.job.locality} · ₹{app.job.wage}/{lang === 'hi' ? 'दिन' : 'day'}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#fbbf24',
                      background: 'rgba(245, 158, 11, 0.12)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {t.appliedWaiting}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. IMMEDIATELY: JOBS NEAR YOU FEED */}
      <div className="section-header" style={{ paddingBottom: '4px' }}>
        <div>
          <div className="section-title">
            <Briefcase size={18} color="#f59e0b" />
            <span>
              {nearbyJobs.length} {t.jobsNearYouCount}
            </span>
          </div>
          <div className="section-sub">
            {lang === 'hi' ? 'सत्यापित काम सीधे ग्राहकों से' : 'Direct verified work from local customers'}
          </div>
        </div>
      </div>

      {/* 5. JOB CARDS FEED */}
      <div className="feed-content" style={{ paddingTop: 0 }}>
        {loading ? (
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
        )}
      </div>
    </div>
  );
};
