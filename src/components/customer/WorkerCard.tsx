'use client';

import React from 'react';
import { Star, MapPin, CheckCircle2, ShieldCheck, Phone, Clock } from 'lucide-react';
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
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  lang,
  worker,
  onRequestHire,
}) => {
  const t = translations[lang];

  const isAvailToday = worker.availability === 'AVAILABLE_TODAY';
  const isAvailTomorrow = worker.availability === 'AVAILABLE_TOMORROW';

  return (
    <div className="worker-card">
      <div className="worker-card-header">
        <div className="worker-name-group">
          <div className="worker-avatar">
            {worker.name.charAt(0)}
          </div>
          <div>
            <div className="worker-name">
              <span>{worker.name}</span>
              <span title={t.verifiedPhone}>
                <ShieldCheck size={16} className="verified-icon" />
              </span>
            </div>
            <div className="worker-trade">
              {worker.skills.map((s) => s.name).join(' · ') || (lang === 'hi' ? 'जनरल हेल्पर' : 'General Helper')}
            </div>
          </div>
        </div>

        <div className="worker-wage-tag">
          ₹{worker.expected_wage}/{lang === 'hi' ? 'दिन' : 'day'}
        </div>
      </div>

      {/* Trust & Location Badges */}
      <div className="worker-badges-row">
        <div className="trust-badge distance">
          <MapPin size={12} />
          {worker.distance_km} {lang === 'hi' ? 'किमी दूर' : 'km away'} ({worker.locality})
        </div>

        <div className="trust-badge">
          <Star size={12} color="#f59e0b" fill="#f59e0b" />
          {worker.rating} ({worker.jobs_completed} {t.jobsCompleted})
        </div>

        <div className="trust-badge verified">
          <CheckCircle2 size={12} />
          {worker.attendance_rate}% {t.attendance}
        </div>

        {isAvailToday ? (
          <div className="trust-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            🟢 {lang === 'hi' ? 'आज उपलब्ध' : 'Available Today'}
          </div>
        ) : isAvailTomorrow ? (
          <div className="trust-badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            🔵 {lang === 'hi' ? 'कल उपलब्ध' : 'Available Tomorrow'}
          </div>
        ) : null}
      </div>

      {/* Card Actions */}
      <div className="worker-card-actions">
        <button
          className="btn-apply"
          style={{ background: 'var(--primary)', color: '#000', fontSize: '0.86rem' }}
          onClick={() => onRequestHire(worker)}
        >
          {lang === 'hi' ? 'काम के लिए बुलाएं / बुक करें →' : 'Request / Hire Worker →'}
        </button>
      </div>
    </div>
  );
};
