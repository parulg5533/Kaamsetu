'use client';

import React from 'react';
import {
  Star,
  Zap,
  Wrench,
  Sparkles,
  Paintbrush,
  Truck,
  Hammer,
  Utensils,
  Briefcase,
} from 'lucide-react';
import { Language } from '@/lib/translations';

export interface WorkerSkill {
  id: string;
  name: string;
  slug: string;
  category?: string;
}

export interface NearbyWorker {
  id: string;
  name: string;
  city: string;
  locality: string;
  experience_years: number;
  expected_wage: number;
  availability: string;
  rating: number;
  rating_count: number;
  jobs_completed: number;
  distance_km: number;
  latitude: number | null;
  longitude: number | null;
  skills: WorkerSkill[];
}

interface WorkerCardProps {
  lang: Language;
  worker: NearbyWorker;
  onRequestHire: (worker: NearbyWorker) => void;
  onViewProfile?: (worker: NearbyWorker) => void;
}

/** A worker is "rated" only once at least one review exists. */
export const isRated = (worker: Pick<NearbyWorker, 'rating_count'>): boolean => worker.rating_count >= 1;

/** `4.5 (12)` for rated workers. Callers render the neutral "New" label when `isRated` is false. */
export const formatRatingText = (worker: Pick<NearbyWorker, 'rating' | 'rating_count'>): string =>
  `${worker.rating.toFixed(1)} (${worker.rating_count})`;

export const getNewWorkerLabel = (lang: Language): string => (lang === 'hi' ? 'नया' : 'New');

/** Real availability from the API. Unknown values fall back to "Unavailable". */
export const getAvailabilityInfo = (
  availability: string,
  lang: Language
): { label: string; color: string } => {
  if (availability === 'AVAILABLE_TODAY') {
    return {
      label: lang === 'hi' ? 'आज उपलब्ध' : 'Available today',
      color: 'var(--brand-success)',
    };
  }
  if (availability === 'AVAILABLE_TOMORROW') {
    return {
      label: lang === 'hi' ? 'कल उपलब्ध' : 'Available tomorrow',
      color: 'var(--brand-accent)',
    };
  }
  return {
    label: lang === 'hi' ? 'अभी उपलब्ध नहीं' : 'Unavailable',
    color: 'var(--text-muted)',
  };
};

// Map trade skill to professional Lucide icon and clean label
export const getWorkerTradeDetails = (
  skills: WorkerSkill[],
  lang: Language
) => {
  if (!skills || skills.length === 0) {
    return {
      icon: <Briefcase size={14} />,
      name: lang === 'hi' ? 'जनरल हेल्पर' : 'General Helper',
    };
  }

  const firstSkill = (skills[0]?.name || '').toLowerCase();
  if (firstSkill.includes('elec') || firstSkill.includes('बिजली')) {
    return { icon: <Zap size={14} />, name: lang === 'hi' ? 'बिजली मिस्त्री' : 'Electrician' };
  }
  if (firstSkill.includes('plumb') || firstSkill.includes('नल')) {
    return { icon: <Wrench size={14} />, name: lang === 'hi' ? 'नल मिस्त्री' : 'Plumber' };
  }
  if (firstSkill.includes('clean') || firstSkill.includes('सफाई')) {
    return { icon: <Sparkles size={14} />, name: lang === 'hi' ? 'सफाई कर्मी' : 'Cleaner' };
  }
  if (firstSkill.includes('paint') || firstSkill.includes('पुताई') || firstSkill.includes('पेंट')) {
    return { icon: <Paintbrush size={14} />, name: lang === 'hi' ? 'पेंटर व पुताई' : 'Painter' };
  }
  if (
    firstSkill.includes('load') ||
    firstSkill.includes('helper') ||
    firstSkill.includes('पल्लेदार') ||
    firstSkill.includes('शिफ्ट')
  ) {
    return { icon: <Truck size={14} />, name: lang === 'hi' ? 'लोडिंग व शिफ्ट' : 'Labour & Shift' };
  }
  if (firstSkill.includes('carpent') || firstSkill.includes('बढ़ई') || firstSkill.includes('लकड़ी')) {
    return { icon: <Hammer size={14} />, name: lang === 'hi' ? 'बढ़ई / मिस्त्री' : 'Carpenter' };
  }
  if (
    firstSkill.includes('cook') ||
    firstSkill.includes('रसोई') ||
    firstSkill.includes('खाना') ||
    firstSkill.includes('restaurant')
  ) {
    return { icon: <Utensils size={14} />, name: lang === 'hi' ? 'रसोइया / कुक' : 'Cook & Helper' };
  }

  return {
    icon: <Briefcase size={14} />,
    name: skills.map((s) => s.name).join(' · '),
  };
};

export const WorkerCard: React.FC<WorkerCardProps> = ({
  lang,
  worker,
  onRequestHire,
  onViewProfile,
}) => {
  const trade = getWorkerTradeDetails(worker.skills, lang);

  return (
    <div className="worker-item">
      <button
        type="button"
        className="worker-item-left"
        onClick={() => (onViewProfile ? onViewProfile(worker) : onRequestHire(worker))}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          font: 'inherit',
          color: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
          minWidth: 0,
        }}
      >
        {/* Avatar */}
        <div className="worker-avatar-wrap">
          {worker.name ? worker.name.charAt(0).toUpperCase() : 'W'}
        </div>

        {/* Worker Info */}
        <div className="worker-info">
          <div className="worker-title-row">
            <span className="worker-name">{worker.name}</span>
          </div>

          <div className="worker-trade-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
            <span style={{ color: 'var(--brand-accent)' }}>{trade.icon}</span>
            <span>{trade.name}</span>
          </div>

          <div className="worker-meta-line">
            {isRated(worker) ? (
              <span className="worker-rating-badge">
                <Star size={11} fill="#f59e0b" color="#f59e0b" className="worker-rating-star" />
                <span>{formatRatingText(worker)}</span>
              </span>
            ) : (
              <span style={{ fontWeight: 600 }}>{getNewWorkerLabel(lang)}</span>
            )}
            <span>·</span>

            <span>{worker.distance_km} km</span>
            {worker.locality && (
              <>
                <span>·</span>
                <span>{worker.locality}</span>
              </>
            )}
          </div>
        </div>
      </button>

      {/* Right Column: Wage + Single Primary CTA */}
      <div className="worker-item-right">
        <div style={{ textAlign: 'right' }}>
          <div className="worker-wage-text">₹{worker.expected_wage}</div>
          <div className="worker-wage-period">{lang === 'hi' ? '/दिन' : '/day'}</div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-hire"
          onClick={() => onRequestHire(worker)}
        >
          {lang === 'hi' ? 'हायर करें' : 'Hire'}
        </button>
      </div>
    </div>
  );
};
