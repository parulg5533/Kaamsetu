'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Phone,
  MessageSquare,
  Map as MapIcon,
  List as ListIcon,
  Check,
  Star,
  Zap,
} from 'lucide-react';
import { Language } from '@/lib/translations';
import { AVAILABILITY, type Availability } from '@/lib/status';
import { NearbyJob, JobCard, BusinessRating, InvitedBadge, getJobActionState, getJobActionLabel } from './JobCard';
import { GoogleMap, MapMarkerItem } from '@/components/map/GoogleMap';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { WorkerApplication } from '@/lib/types/worker';

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
  skills: Array<{ id: string; name: string }>;
}

export interface WorkerHomeProps {
  lang: Language;
  workerProfile: WorkerProfile | null;
  availability: string;
  onSetAvailability: (status: Availability) => void;
  nearbyJobs: NearbyJob[];
  applications: WorkerApplication[];
  userLocation?: { lat: number; lng: number; locality: string; isLive: boolean };
  onApplyJob: (jobId: string) => void;
  onWithdrawJob?: (jobId: string) => void;
  /** Marks the worker's side of a job as finished for one application. Resolves when the request settles. */
  onConfirmCompleted: (applicationId: string) => Promise<void>;
  onRateBusiness: (businessId: string, businessName: string, applicationId: string) => void;
  onOpenMessages?: () => void;
  loading: boolean;
}

const AVAILABILITY_OPTIONS: Array<{ value: Availability; en: string; hi: string }> = [
  { value: 'AVAILABLE_TODAY', en: 'Today', hi: 'आज' },
  { value: 'AVAILABLE_TOMORROW', en: 'Tomorrow', hi: 'कल' },
  { value: 'UNAVAILABLE', en: 'Off', hi: 'बंद' },
];

const AVAILABILITY_HINTS: Record<Availability, { en: string; hi: string }> = {
  AVAILABLE_TODAY: {
    en: 'Nearby customers can discover and hire you',
    hi: 'आपकी प्रोफ़ाइल पास के ग्राहकों को दिखाई दे रही है',
  },
  AVAILABLE_TOMORROW: {
    en: 'Customers will see you as available from tomorrow',
    hi: 'कल से ग्राहकों को आप उपलब्ध दिखेंगे',
  },
  UNAVAILABLE: {
    en: 'Off duty — you will not receive work notifications',
    hi: 'छुट्टी पर — नए काम की सूचना नहीं मिलेगी',
  },
};

const isAvailability = (value: string): value is Availability =>
  (AVAILABILITY as readonly string[]).includes(value);

interface ConfirmedJobBannerProps {
  lang: Language;
  app: WorkerApplication;
  completing: boolean;
  onConfirmCompleted: (applicationId: string) => void;
  onOpenMessages?: () => void;
}

const ConfirmedJobBanner: React.FC<ConfirmedJobBannerProps> = ({
  lang,
  app,
  completing,
  onConfirmCompleted,
  onOpenMessages,
}) => {
  const { business } = app.job;
  const isInProgress = app.status === 'IN_PROGRESS';

  return (
    <div
      style={{
        margin: '12px 16px 0 16px',
        padding: '14px',
        backgroundColor: 'var(--brand-primary)',
        color: 'var(--text-inverse)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#34d399' }}>
          <CheckCircle2 size={16} />
          <span>{lang === 'hi' ? 'काम पक्का हुआ' : 'Job Confirmed'}</span>
        </div>
        <div style={{ fontSize: '0.96rem', fontWeight: 800 }}>
          ₹{app.job.wage}/{lang === 'hi' ? 'दिन' : 'day'}
        </div>
      </div>

      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{app.job.title}</div>
        <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '2px' }}>
          {lang === 'hi' ? 'ग्राहक:' : 'Customer:'}{' '}
          <strong style={{ color: '#ffffff' }}>
            {business.owner_name || business.business_name}
          </strong>{' '}
          · {app.job.locality}
        </div>
      </div>

      {/* Unlocked Phone & WhatsApp Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {business.phone ? (
          <>
            <a
              href={`tel:${business.phone}`}
              className="btn"
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                color: 'var(--brand-primary)',
                textDecoration: 'none',
                fontSize: '0.82rem',
                minHeight: '36px',
              }}
            >
              <Phone size={14} />
              <span>Call ({business.phone})</span>
            </a>
            <a
              href={`https://wa.me/91${business.phone}`}
              target="_blank"
              rel="noreferrer"
              className="btn"
              style={{
                backgroundColor: '#25D366',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '8px 14px',
                fontSize: '0.82rem',
                minHeight: '36px',
              }}
              aria-label="WhatsApp"
            >
              <MessageSquare size={14} />
            </a>
          </>
        ) : (
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
            {lang === 'hi' ? 'संपर्क नंबर अनलॉक हो रहा है...' : 'Contact unlocking...'}
          </div>
        )}
      </div>

      {isInProgress ? (
        <button
          type="button"
          className="btn btn-accent"
          style={{ width: '100%', fontSize: '0.82rem', minHeight: '36px', marginTop: '10px' }}
          onClick={() => onConfirmCompleted(app.id)}
          disabled={app.worker_confirmed || completing}
        >
          <Check size={14} />
          <span>
            {app.worker_confirmed
              ? (lang === 'hi' ? 'ग्राहक की प्रतीक्षा' : 'Waiting for customer')
              : (lang === 'hi' ? 'काम पूरा हुआ' : 'Mark finished')}
          </span>
        </button>
      ) : (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
            {lang === 'hi'
              ? 'काम शुरू करने के लिए आगमन कोड दिखाएँ: ग्राहक से 4 अंकों का कोड माँगें'
              : 'Show arrival code to start: ask the customer for the 4-digit code'}
          </div>
          {onOpenMessages && (
            <button
              type="button"
              className="btn"
              style={{ width: '100%', fontSize: '0.82rem', minHeight: '36px', backgroundColor: 'rgba(255,255,255,0.12)', color: '#ffffff' }}
              onClick={onOpenMessages}
            >
              <MessageSquare size={14} />
              <span>{lang === 'hi' ? 'मैसेज खोलें' : 'Go to Messages'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const WorkerHome: React.FC<WorkerHomeProps> = ({
  lang,
  availability,
  onSetAvailability,
  nearbyJobs,
  applications,
  userLocation = { lat: 31.6340, lng: 74.8723, locality: 'Amritsar', isLive: false },
  onApplyJob,
  onWithdrawJob,
  onConfirmCompleted,
  onRateBusiness,
  onOpenMessages,
  loading,
}) => {
  const [activeView, setActiveView] = useState<'map' | 'list'>('map');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [completingAppId, setCompletingAppId] = useState<string | null>(null);

  const currentAvailability: Availability = isAvailability(availability) ? availability : 'UNAVAILABLE';

  // Derived from the live list so the preview reflects the latest application status.
  const selectedJob = useMemo(
    () => nearbyJobs.find((j) => j.id === selectedJobId) ?? null,
    [nearbyJobs, selectedJobId]
  );

  // Accepted / in-progress work shows in the banner; finished work goes to "Recent work".
  const confirmedApps = useMemo(
    () => applications.filter((a) => a.status === 'ACCEPTED' || a.status === 'IN_PROGRESS'),
    [applications]
  );
  const completedApps = useMemo(
    () => applications.filter((a) => a.status === 'COMPLETED'),
    [applications]
  );

  const jobMapMarkers = useMemo<MapMarkerItem[]>(
    () =>
      nearbyJobs.map((j) => ({
        id: j.id,
        lat: j.latitude,
        lng: j.longitude,
        title: j.title,
        priceLabel: `₹${j.wage}`,
        subtitle: `${j.locality} · ${j.distance_km} km`,
      })),
    [nearbyJobs]
  );

  const mapCenter = useMemo(
    () => ({ lat: userLocation.lat, lng: userLocation.lng }),
    [userLocation.lat, userLocation.lng]
  );

  const handleSelectJobMarker = useCallback((marker: MapMarkerItem) => {
    setSelectedJobId(marker.id);
  }, []);

  const handleConfirmCompleted = async (applicationId: string) => {
    setCompletingAppId(applicationId);
    try {
      await onConfirmCompleted(applicationId);
    } finally {
      setCompletingAppId(null);
    }
  };

  const selectedActionState = selectedJob
    ? getJobActionState(selectedJob.my_application_status)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* 1. "Aaj Kaam Chahiye?" availability: Today / Tomorrow / Off */}
      <div className="worker-availability-card">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="avail-question">
            {lang === 'hi' ? 'आज काम चाहिए?' : 'Need work today?'}
          </div>
          <div className="avail-subtext">
            {lang === 'hi' ? AVAILABILITY_HINTS[currentAvailability].hi : AVAILABILITY_HINTS[currentAvailability].en}
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label={lang === 'hi' ? 'उपलब्धता' : 'Availability'}
          style={{
            display: 'flex',
            flexShrink: 0,
            gap: '4px',
            padding: '4px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {AVAILABILITY_OPTIONS.map((opt) => {
            const checked = opt.value === currentAvailability;
            const activeColor = opt.value === 'UNAVAILABLE' ? 'var(--text-muted)' : 'var(--brand-primary)';
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => {
                  if (!checked) onSetAvailability(opt.value);
                }}
                style={{
                  minHeight: '34px',
                  padding: '0 10px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: checked ? activeColor : 'transparent',
                  color: checked ? 'var(--text-inverse)' : 'var(--text-secondary)',
                }}
              >
                {lang === 'hi' ? opt.hi : opt.en}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Confirmed Work Banner (contact unlocks only after acceptance) */}
      {confirmedApps.map((app) => (
        <ConfirmedJobBanner
          key={app.id}
          lang={lang}
          app={app}
          completing={completingAppId === app.id}
          onConfirmCompleted={handleConfirmCompleted}
          onOpenMessages={onOpenMessages}
        />
      ))}

      {/* 3. Recent work (completed applications) */}
      {completedApps.length > 0 && (
        <div className="feed-section" style={{ marginTop: '8px' }}>
          <div className="section-headline">{lang === 'hi' ? 'हाल का काम' : 'Recent work'}</div>
          {completedApps.map((app) => (
            <div
              key={app.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {app.job.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  {app.job.business.business_name} · {app.job.job_date}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minHeight: '32px', fontSize: '0.8rem', flexShrink: 0 }}
                onClick={() =>
                  onRateBusiness(app.job.business.id, app.job.business.business_name, app.id)
                }
              >
                <Star size={13} />
                <span>{lang === 'hi' ? 'रेट करें' : 'Rate'}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4. Map & List Controls */}
      <div className="map-control-bar" style={{ marginTop: '4px' }}>
        <div className="nearby-count-title">
          <span>{lang === 'hi' ? 'पास के काम' : 'Jobs Near You'}</span>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            ({nearbyJobs.length})
          </span>
        </div>

        <div className="view-toggle-group">
          <button
            type="button"
            className={`view-toggle-btn ${activeView === 'map' ? 'active' : ''}`}
            aria-pressed={activeView === 'map'}
            onClick={() => setActiveView('map')}
          >
            <MapIcon size={14} />
            <span>{lang === 'hi' ? 'मानचित्र' : 'Map'}</span>
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${activeView === 'list' ? 'active' : ''}`}
            aria-pressed={activeView === 'list'}
            onClick={() => setActiveView('list')}
          >
            <ListIcon size={14} />
            <span>{lang === 'hi' ? 'सूची' : 'List'}</span>
          </button>
        </div>
      </div>

      {/* 5. Map View or List View */}
      {activeView === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <GoogleMap
            center={mapCenter}
            markers={jobMapMarkers}
            selectedMarkerId={selectedJobId ?? undefined}
            onSelectMarker={handleSelectJobMarker}
            height="280px"
          />

          <div className="feed-section">
            <div className="section-headline-row">
              <div className="section-headline">
                {lang === 'hi' ? 'ताज़ा काम' : 'Latest Jobs'}
              </div>
              <button
                type="button"
                className="section-link"
                onClick={() => setActiveView('list')}
              >
                {lang === 'hi' ? 'सभी काम देखें →' : 'See all jobs →'}
              </button>
            </div>

            {loading ? (
              <div>
                <div className="skeleton-row" />
                <div className="skeleton-row" />
              </div>
            ) : nearbyJobs.length === 0 ? (
              <div className="empty-state-view">
                <Briefcase size={28} className="empty-state-icon" />
                <div className="empty-state-title">
                  {lang === 'hi' ? 'अभी कोई नया काम नहीं है' : 'No jobs in your area right now'}
                </div>
                <div className="empty-state-desc">
                  {lang === 'hi'
                    ? 'अपनी उपलब्धता चालू रखें, जैसे ही ग्राहक काम पोस्ट करेंगे आपको सूचना मिलेगी।'
                    : 'Keep your availability ON to receive new work alerts as soon as customers post.'}
                </div>
              </div>
            ) : (
              nearbyJobs.slice(0, 4).map((j) => (
                <JobCard
                  key={j.id}
                  lang={lang}
                  job={j}
                  onApply={onApplyJob}
                  onWithdrawJob={onWithdrawJob}
                  loading={loading}
                />
              ))
            )}
          </div>
        </div>
      )}

      {activeView === 'list' && (
        <div className="feed-section" style={{ flex: 1 }}>
          {loading ? (
            <div>
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : nearbyJobs.length === 0 ? (
            <div className="empty-state-view">
              <Briefcase size={32} className="empty-state-icon" />
              <div className="empty-state-title">
                {lang === 'hi' ? 'अभी पास में कोई काम उपलब्ध नहीं है' : 'No jobs nearby right now'}
              </div>
              <div className="empty-state-desc">
                {lang === 'hi'
                  ? 'अपनी उपलब्धता चालू रखें ताकि नया काम पोस्ट होते ही आपको सूचना मिले।'
                  : 'Keep your availability ON to receive notifications as soon as jobs are posted.'}
              </div>
            </div>
          ) : (
            nearbyJobs.map((j) => (
              <JobCard
                key={j.id}
                lang={lang}
                job={j}
                onApply={onApplyJob}
                onWithdrawJob={onWithdrawJob}
                loading={loading}
              />
            ))
          )}
        </div>
      )}

      {/* 6. Job Quick Preview Bottom Sheet (Triggered by Job Map Marker) */}
      <BottomSheet
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJobId(null)}
        title={selectedJob?.title || 'Job Details'}
        subtitle={selectedJob ? `${selectedJob.locality} · ${selectedJob.distance_km} km away` : 'Nearby Job'}
        footer={
          selectedJob && selectedActionState ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setSelectedJobId(null)}
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>

              {selectedActionState === 'APPLY' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1.5 }}
                  onClick={() => {
                    onApplyJob(selectedJob.id);
                    setSelectedJobId(null);
                  }}
                >
                  <Zap size={15} />
                  <span>{getJobActionLabel(selectedActionState, lang)}</span>
                </button>
              ) : (
                <button type="button" className="btn btn-secondary" style={{ flex: 1.5 }} disabled>
                  <span>{getJobActionLabel(selectedActionState, lang)}</span>
                </button>
              )}

              {selectedActionState === 'APPLIED' && onWithdrawJob && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    onWithdrawJob(selectedJob.id);
                    setSelectedJobId(null);
                  }}
                >
                  <span>{lang === 'hi' ? 'वापस लें' : 'Withdraw'}</span>
                </button>
              )}
            </div>
          ) : undefined
        }
      >
        {selectedJob && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {selectedJob.is_invited && <InvitedBadge lang={lang} />}
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedJob.title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{selectedJob.business.business_name}</span>
                  <span>·</span>
                  <BusinessRating
                    lang={lang}
                    rating={selectedJob.business.rating}
                    ratingCount={selectedJob.business.rating_count}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                  ₹{selectedJob.wage}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {lang === 'hi' ? 'प्रति दिन' : 'per day'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.78rem' }}>
              <div style={{ padding: '4px 8px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)' }}>
                {selectedJob.distance_km} km away
              </div>
              <div style={{ padding: '4px 8px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)' }}>
                {selectedJob.start_time} - {selectedJob.end_time}
              </div>
              {selectedJob.food_provided && (
                <div style={{ padding: '4px 8px', backgroundColor: 'var(--brand-success-subtle)', color: 'var(--brand-success)', borderRadius: 'var(--radius-xs)', fontWeight: 700 }}>
                  {lang === 'hi' ? 'खाना दिया जाएगा' : 'Food provided'}
                </div>
              )}
            </div>

            {selectedJob.description && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
                {selectedJob.description}
              </p>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
