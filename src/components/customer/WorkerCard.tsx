'use client';

import React from 'react';
import {
  Star,
  MapPin,
  ShieldCheck,
  Zap,
  Wrench,
  Sparkles,
  Paintbrush,
  Truck,
  Hammer,
  Utensils,
  Briefcase,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';

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
  attendance_rate: number;
  distance_km: number;
  skills: Array<{ id: string; name: string; category?: string }>;
}

interface WorkerCardProps {
  lang: Language;
  worker: NearbyWorker;
  onRequestHire: (worker: NearbyWorker) => void;
  onViewProfile?: (worker: NearbyWorker) => void;
}

// Map trade skill to professional Lucide icon and clean label
export const getWorkerTradeDetails = (
  skills: Array<{ id: string; name: string; category?: string }>,
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
  const t = translations[lang];
  const trade = getWorkerTradeDetails(worker.skills, lang);

  return (
    <div
      className="worker-item"
      onClick={() => (onViewProfile ? onViewProfile(worker) : onRequestHire(worker))}
      role="button"
      tabIndex={0}
    >
      <div className="worker-item-left">
        {/* Avatar */}
        <div className="worker-avatar-wrap">
          {worker.name ? worker.name.charAt(0).toUpperCase() : 'W'}
        </div>

        {/* Worker Info */}
        <div className="worker-info">
          <div className="worker-title-row">
            <span className="worker-name">{worker.name}</span>
            <span title="Verified Worker" className="verified-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <ShieldCheck size={14} />
            </span>
          </div>

          <div className="worker-trade-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
            <span style={{ color: 'var(--brand-accent)' }}>{trade.icon}</span>
            <span>{trade.name}</span>
          </div>

          <div className="worker-meta-line">
            {worker.rating > 0 && (
              <>
                <span className="worker-rating-badge">
                  <Star size={11} fill="#f59e0b" color="#f59e0b" className="worker-rating-star" />
                  <span>{worker.rating.toFixed(1)}</span>
                </span>
                {worker.jobs_completed > 0 && (
                  <span>({worker.jobs_completed} {lang === 'hi' ? 'काम' : 'jobs'})</span>
                )}
                <span>·</span>
              </>
            )}

            <span>{worker.distance_km} km</span>
            {worker.locality && (
              <>
                <span>·</span>
                <span>{worker.locality}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Wage + Single Primary CTA */}
      <div className="worker-item-right">
        <div style={{ textAlign: 'right' }}>
          <div className="worker-wage-text">₹{worker.expected_wage}</div>
          <div className="worker-wage-period">{lang === 'hi' ? '/दिन' : '/day'}</div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-hire"
          onClick={(e) => {
            e.stopPropagation();
            onRequestHire(worker);
          }}
        >
          {lang === 'hi' ? 'हायर करें' : 'Hire'}
        </button>
      </div>
    </div>
  );
};
