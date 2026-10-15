'use client';

import React from 'react';
import { Star, MapPin, ArrowLeft, X, Zap } from 'lucide-react';
import { Language } from '@/lib/translations';
import {
  NearbyWorker,
  getWorkerTradeDetails,
  getAvailabilityInfo,
  isRated,
  formatRatingText,
  getNewWorkerLabel,
} from './WorkerCard';

export interface WorkerProfileSheetProps {
  lang: Language;
  worker: NearbyWorker | null;
  isOpen: boolean;
  onClose: () => void;
  onHireWorker: (worker: NearbyWorker) => void;
}

export const WorkerProfileSheet: React.FC<WorkerProfileSheetProps> = ({
  lang,
  worker,
  isOpen,
  onClose,
  onHireWorker,
}) => {
  if (!isOpen || !worker) return null;
  const trade = getWorkerTradeDetails(worker.skills, lang);
  const availability = getAvailabilityInfo(worker.availability, lang);

  return (
    <div className="fullscreen-view" role="dialog" aria-modal="true">
      {/* 1. Header */}
      <div className="fullscreen-header">
        <button
          type="button"
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 700 }}
        >
          <ArrowLeft size={18} />
          <span>{lang === 'hi' ? 'वापस' : 'Back'}</span>
        </button>

        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          {lang === 'hi' ? 'कारीगर प्रोफ़ाइल' : 'Worker Profile'}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={lang === 'hi' ? 'बंद करें' : 'Close'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* 2. Scrollable Body */}
      <div style={{ flex: 1, padding: '20px 16px', maxWidth: '600px', width: '100%', margin: '0 auto' }}>
        {/* Worker Hero Summary */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingBottom: '18px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--brand-primary)',
              color: 'var(--text-inverse)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {worker.name ? worker.name.charAt(0).toUpperCase() : 'W'}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {worker.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--brand-accent)' }}>{trade.icon}</span>
              <span>{trade.name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {isRated(worker) ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <span>{formatRatingText(worker)}</span>
                </span>
              ) : (
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{getNewWorkerLabel(lang)}</span>
              )}
              {worker.jobs_completed > 0 && (
                <span>· {worker.jobs_completed} {lang === 'hi' ? 'काम पूरे' : 'jobs completed'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Highlights Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '14px 0',
            borderBottom: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}
        >
          <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {lang === 'hi' ? 'दूरी' : 'Distance'}
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {worker.distance_km} km
            </div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {lang === 'hi' ? 'उपलब्धता' : 'Availability'}
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: availability.color, marginTop: '2px' }}>
              {availability.label}
            </div>
          </div>

          <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {lang === 'hi' ? 'पूरे किए काम' : 'Jobs done'}
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {worker.jobs_completed}
            </div>
          </div>
        </div>

        {/* Location */}
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
            {lang === 'hi' ? 'स्थान' : 'Location'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={16} color="var(--brand-accent)" />
            <span style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {lang === 'hi'
                ? `${worker.locality || 'स्थानीय क्षेत्र'}, ${worker.city}`
                : `${worker.locality || 'Local Area'}, ${worker.city}`}
            </span>
          </div>
        </div>

        {/* Skills Chips */}
        {worker.skills && worker.skills.length > 0 && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
              {lang === 'hi' ? 'कौशल और कार्य' : 'Skills & Specialization'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {worker.skills.map((s) => (
                <div
                  key={s.id}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-full)',
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Sticky Bottom Action Bar */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ₹{worker.expected_wage}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {lang === 'hi' ? 'प्रति दिन मजदूरी' : 'daily wage offer'}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '10px 24px', fontSize: '0.92rem' }}
          onClick={() => {
            onClose();
            onHireWorker(worker);
          }}
        >
          <Zap size={16} />
          <span>{lang === 'hi' ? `${worker.name.split(' ')[0]} को काम दें` : `Hire ${worker.name.split(' ')[0]}`}</span>
        </button>
      </div>
    </div>
  );
};
