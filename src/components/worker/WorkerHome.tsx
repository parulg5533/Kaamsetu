'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  ShieldCheck,
  Star,
  Map as MapIcon,
  List as ListIcon,
  Check,
  X,
  Zap,
  Utensils,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { JobCard, NearbyJob } from './JobCard';
import { WorkerApplication } from './ApplicationsList';
import { GoogleMap, MapMarkerItem } from '@/components/map/GoogleMap';
import { BottomSheet } from '@/components/ui/BottomSheet';

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
  userLocation?: { lat: number; lng: number; locality: string; isLive: boolean };
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
  userLocation = { lat: 31.6340, lng: 74.8723, locality: 'Amritsar', isLive: false },
  onApplyJob,
  onConfirmCompleted,
  onRateBusiness,
  loading,
}) => {
  const t = translations[lang];
  const [activeView, setActiveView] = useState<'map' | 'list'>('map');
  const [selectedJobForPreview, setSelectedJobForPreview] = useState<NearbyJob | null>(null);

  const isAvailable = availability === 'AVAILABLE_TODAY';

  // Confirmed jobs (ACCEPTED or COMPLETED) that require immediate worker attention
  const confirmedApps = applications.filter(
    (a) => a.status === 'ACCEPTED' || a.status === 'COMPLETED'
  );

  // Map job pins
  const jobMapMarkers: MapMarkerItem[] = nearbyJobs.map((j, idx) => {
    const offsetLat = (idx % 3 - 1) * 0.0035;
    const offsetLng = (Math.floor(idx / 3) % 3 - 1) * 0.0035;
    return {
      id: j.id,
      lat: userLocation.lat + offsetLat,
      lng: userLocation.lng + offsetLng,
      title: j.title,
      priceLabel: `₹${j.wage}`,
      subtitle: `${j.locality} · ${j.distance_km} km`,
      raw: j,
    };
  });

  const handleSelectJobMarker = (marker: MapMarkerItem) => {
    if (marker.raw) {
      setSelectedJobForPreview(marker.raw);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* 1. Unambiguous "Aaj Kaam Chahiye?" Daily Toggle */}
      <div className="worker-availability-card">
        <div>
          <div className="avail-question">
            {lang === 'hi' ? 'आज काम चाहिए?' : 'Need work today?'}
          </div>
          <div className="avail-subtext">
            {isAvailable
              ? (lang === 'hi' ? 'आपकी प्रोफ़ाइल पास के ग्राहकों को दिखाई दे रही है' : 'Nearby customers can discover and hire you')
              : (lang === 'hi' ? 'छुट्टी पर — नए काम की सूचना नहीं मिलेगी' : 'Off duty — you will not receive work notifications')}
          </div>
        </div>

        <button
          type="button"
          className={`toggle-switch-btn ${isAvailable ? 'on' : ''}`}
          onClick={() =>
            onSetAvailability(isAvailable ? 'UNAVAILABLE' : 'AVAILABLE_TODAY')
          }
        >
          <div className="toggle-dot" />
          <span>
            {isAvailable
              ? (lang === 'hi' ? 'काम के लिए उपलब्ध' : 'Available for work')
              : (lang === 'hi' ? 'छुट्टी पर (Off)' : 'Off today')}
          </span>
        </button>
      </div>

      {/* 2. Confirmed Work Banner (Reveals Unlocked Call & WhatsApp ONLY After Acceptance) */}
      {confirmedApps.map((app) => (
        <div
          key={app.id}
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
                {app.job.business.owner_name || app.job.business.business_name}
              </strong>{' '}
              · {app.job.locality}
            </div>
          </div>

          {/* Unlocked Phone & WhatsApp Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {app.job.business.phone ? (
              <>
                <a
                  href={`tel:${app.job.business.phone}`}
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
                  <span>Call ({app.job.business.phone})</span>
                </a>
                <a
                  href={`https://wa.me/91${app.job.business.phone}`}
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

            {!app.worker_confirmed_completed && (
              <button
                type="button"
                className="btn btn-accent"
                style={{ fontSize: '0.82rem', minHeight: '36px' }}
                onClick={() => onConfirmCompleted(app.job.id)}
              >
                <Check size={14} />
                <span>{lang === 'hi' ? 'काम पूरा' : 'Finished'}</span>
              </button>
            )}
          </div>
        </div>
      ))}

      {/* 3. Map & List Controls */}
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
            onClick={() => setActiveView('map')}
          >
            <MapIcon size={14} />
            <span>Map</span>
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${activeView === 'list' ? 'active' : ''}`}
            onClick={() => setActiveView('list')}
          >
            <ListIcon size={14} />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* 4. Map View or List View */}
      {activeView === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <GoogleMap
            center={{ lat: userLocation.lat, lng: userLocation.lng }}
            markers={jobMapMarkers}
            selectedMarkerId={selectedJobForPreview?.id}
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
                loading={loading}
              />
            ))
          )}
        </div>
      )}

      {/* 5. Job Quick Preview Bottom Sheet (Triggered by Job Map Marker) */}
      <BottomSheet
        isOpen={Boolean(selectedJobForPreview)}
        onClose={() => setSelectedJobForPreview(null)}
        title={selectedJobForPreview?.title || 'Job Details'}
        subtitle={selectedJobForPreview?.locality ? `${selectedJobForPreview.locality} · ${selectedJobForPreview.distance_km} km away` : 'Nearby Job'}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setSelectedJobForPreview(null)}
            >
              {lang === 'hi' ? 'बंद करें' : 'Close'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1.5 }}
              onClick={() => {
                if (selectedJobForPreview) {
                  onApplyJob(selectedJobForPreview.id);
                  setSelectedJobForPreview(null);
                }
              }}
            >
              <Zap size={15} />
              <span>{lang === 'hi' ? 'आवेदन करें (Apply)' : 'Apply for Job'}</span>
            </button>
          </div>
        }
      >
        {selectedJobForPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedJobForPreview.title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {selectedJobForPreview.business.business_name}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                  ₹{selectedJobForPreview.wage}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {lang === 'hi' ? 'प्रति दिन' : 'per day'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.78rem' }}>
              <div style={{ padding: '4px 8px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)' }}>
                {selectedJobForPreview.distance_km} km away
              </div>
              <div style={{ padding: '4px 8px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)' }}>
                {selectedJobForPreview.start_time} - {selectedJobForPreview.end_time}
              </div>
              {selectedJobForPreview.food_provided && (
                <div style={{ padding: '4px 8px', backgroundColor: 'var(--brand-success-subtle)', color: 'var(--brand-success)', borderRadius: 'var(--radius-xs)', fontWeight: 700 }}>
                  {lang === 'hi' ? 'खाना दिया जाएगा' : 'Food provided'}
                </div>
              )}
            </div>

            {selectedJobForPreview.description && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
                {selectedJobForPreview.description}
              </p>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
