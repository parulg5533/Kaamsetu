'use client';

import React from 'react';
import { Star, MapPin, CheckCircle2, ShieldCheck, Eye, Zap } from 'lucide-react';
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
  skills: Array<{ id: string; name: string; category: string }>;
}

interface WorkerCardProps {
  lang: Language;
  worker: NearbyWorker;
  onRequestHire: (worker: NearbyWorker) => void;
  onViewProfile?: (worker: NearbyWorker) => void;
}

// Map trade skill to prominent icon and bilingual label
export const getWorkerTradeDetails = (
  skills: Array<{ id: string; name: string; category: string }>,
  lang: Language
) => {
  if (!skills || skills.length === 0) {
    return {
      icon: '🛠️',
      name: lang === 'hi' ? 'जनरल हेल्पर' : 'General Helper',
    };
  }

  const firstSkill = (skills[0]?.name || '').toLowerCase();
  if (firstSkill.includes('elec') || firstSkill.includes('बिजली')) {
    return { icon: '⚡', name: lang === 'hi' ? 'बिजली मिस्त्री' : 'Electrician' };
  }
  if (firstSkill.includes('plumb') || firstSkill.includes('नल')) {
    return { icon: '🔧', name: lang === 'hi' ? 'नल मिस्त्री' : 'Plumber' };
  }
  if (firstSkill.includes('clean') || firstSkill.includes('सफाई')) {
    return { icon: '🧹', name: lang === 'hi' ? 'सफाई कर्मचारी' : 'Cleaning Specialist' };
  }
  if (firstSkill.includes('paint') || firstSkill.includes('पुताई') || firstSkill.includes('पेंट')) {
    return { icon: '🎨', name: lang === 'hi' ? 'पेंटर व पुताई' : 'Painter' };
  }
  if (
    firstSkill.includes('load') ||
    firstSkill.includes('helper') ||
    firstSkill.includes('पल्लेदार') ||
    firstSkill.includes('शिफ्ट')
  ) {
    return { icon: '🚚', name: lang === 'hi' ? 'लोडिंग व सामान शिफ्ट' : 'Loading Helper' };
  }
  if (firstSkill.includes('carpent') || firstSkill.includes('बढ़ई') || firstSkill.includes('लकड़ी')) {
    return { icon: '🔨', name: lang === 'hi' ? 'बढ़ई / कारपेंटर' : 'Carpenter' };
  }
  if (
    firstSkill.includes('cook') ||
    firstSkill.includes('रसोई') ||
    firstSkill.includes('खाना') ||
    firstSkill.includes('restaurant')
  ) {
    return { icon: '🍽️', name: lang === 'hi' ? 'रसोइया / कुक' : 'Cook / Kitchen' };
  }

  return {
    icon: '⚡',
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

  const isAvailToday = worker.availability === 'AVAILABLE_TODAY';
  const isAvailTomorrow = worker.availability === 'AVAILABLE_TOMORROW';

  return (
    <div className="trust-elevated-card" role="article" aria-label={`Worker ${worker.name}`}>
      {/* 1. TOP HEADER: Avatar + Name + Trade + Daily Wage */}
      <div className="worker-card-header">
        <div className="worker-name-group">
          <div className="worker-avatar-wrapper">
            <div className="worker-avatar">
              {worker.name.charAt(0)}
            </div>
            <div className="avatar-verified-badge" title={t.verifiedPhone}>
              ✓
            </div>
          </div>
          <div>
            <div className="worker-name">
              <span>{worker.name}</span>
              <span className="verified-shield-tag" title={t.verifiedPhone}>
                <ShieldCheck size={13} className="verified-icon" />
                <span className="verified-shield-text">
                  {lang === 'hi' ? 'सत्यापित' : 'Verified'}
                </span>
              </span>
            </div>
            <div className="worker-prominent-trade">
              <span className="trade-icon">{trade.icon}</span>
              <span className="trade-title">{trade.name}</span>
            </div>
          </div>
        </div>

        <div className="worker-wage-tag">
          ₹{worker.expected_wage}/{lang === 'hi' ? 'दिन' : 'day'}
        </div>
      </div>

      {/* 2. TRUST & CREDENTIALS MATRIX (Visually Unavoidable Trust) */}
      <div className="worker-trust-matrix">
        {/* Rating + Jobs Completed */}
        <div className="trust-pill rating-pill">
          <Star size={13} color="#f59e0b" fill="#f59e0b" />
          <span className="bold-metric">{worker.rating}</span>
          <span className="sub-metric">
            · {worker.jobs_completed} {t.jobsCompleted}
          </span>
        </div>

        {/* Availability Status */}
        {isAvailToday ? (
          <div className="trust-pill avail-today-pill">
            <span className="avail-dot pulse" />
            <span>{lang === 'hi' ? 'आज उपलब्ध' : 'Available today'}</span>
          </div>
        ) : isAvailTomorrow ? (
          <div className="trust-pill avail-tomorrow-pill">
            <span className="avail-dot blue" />
            <span>{lang === 'hi' ? 'कल उपलब्ध' : 'Available tomorrow'}</span>
          </div>
        ) : (
          <div className="trust-pill avail-neutral-pill">
            <span>{lang === 'hi' ? 'उपलब्धता पूछें' : 'Contact for dates'}</span>
          </div>
        )}

        {/* Distance & Locality */}
        <div className="trust-pill distance-pill">
          <MapPin size={12} />
          <span>{worker.distance_km} {lang === 'hi' ? 'किमी दूर' : 'km away'}</span>
          <span className="locality-sep">·</span>
          <span className="locality-name">{worker.locality}</span>
        </div>

        {/* Phone & Identity Verified */}
        <div className="trust-pill phone-verified-pill">
          <ShieldCheck size={13} />
          <span>{lang === 'hi' ? 'फोन सत्यापित ✓' : 'Phone verified ✓'}</span>
        </div>

        {/* Attendance Rate */}
        {worker.attendance_rate > 0 && (
          <div className="trust-pill attendance-pill">
            <CheckCircle2 size={12} />
            <span>{worker.attendance_rate}% {t.attendance}</span>
          </div>
        )}
      </div>

      {/* 3. DUAL ACTION BUTTONS: [View Profile] and [Hire] */}
      <div className="worker-card-actions">
        <button
          type="button"
          className="btn-view-profile"
          onClick={() => (onViewProfile ? onViewProfile(worker) : onRequestHire(worker))}
        >
          <Eye size={15} />
          <span>{t.viewProfile}</span>
        </button>

        <button
          type="button"
          className="btn-hire-primary"
          onClick={() => onRequestHire(worker)}
        >
          <Zap size={15} />
          <span>{t.hireNow}</span>
        </button>
      </div>
    </div>
  );
};
