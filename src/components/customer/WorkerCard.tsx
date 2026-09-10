'use client';

import React from 'react';
import {
  Star,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Eye,
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
import { Card, Avatar, Badge, StatusBadge, Button } from '@/components/ui';

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

// Map trade skill to professional Lucide icon and bilingual label
export const getWorkerTradeDetails = (
  skills: Array<{ id: string; name: string; category: string }>,
  lang: Language
) => {
  if (!skills || skills.length === 0) {
    return {
      icon: <Briefcase size={16} />,
      name: lang === 'hi' ? 'जनरल हेल्पर' : 'General Helper',
    };
  }

  const firstSkill = (skills[0]?.name || '').toLowerCase();
  if (firstSkill.includes('elec') || firstSkill.includes('बिजली')) {
    return { icon: <Zap size={16} />, name: lang === 'hi' ? 'बिजली मिस्त्री' : 'Electrician' };
  }
  if (firstSkill.includes('plumb') || firstSkill.includes('नल')) {
    return { icon: <Wrench size={16} />, name: lang === 'hi' ? 'नल मिस्त्री' : 'Plumber' };
  }
  if (firstSkill.includes('clean') || firstSkill.includes('सफाई')) {
    return { icon: <Sparkles size={16} />, name: lang === 'hi' ? 'सफाई कर्मचारी' : 'Cleaning Specialist' };
  }
  if (firstSkill.includes('paint') || firstSkill.includes('पुताई') || firstSkill.includes('पेंट')) {
    return { icon: <Paintbrush size={16} />, name: lang === 'hi' ? 'पेंटर व पुताई' : 'Painter' };
  }
  if (
    firstSkill.includes('load') ||
    firstSkill.includes('helper') ||
    firstSkill.includes('पल्लेदार') ||
    firstSkill.includes('शिफ्ट')
  ) {
    return { icon: <Truck size={16} />, name: lang === 'hi' ? 'लोडिंग व सामान शिफ्ट' : 'Loading Helper' };
  }
  if (firstSkill.includes('carpent') || firstSkill.includes('बढ़ई') || firstSkill.includes('लकड़ी')) {
    return { icon: <Hammer size={16} />, name: lang === 'hi' ? 'बढ़ई / कारपेंटर' : 'Carpenter' };
  }
  if (
    firstSkill.includes('cook') ||
    firstSkill.includes('रसोई') ||
    firstSkill.includes('खाना') ||
    firstSkill.includes('restaurant')
  ) {
    return { icon: <Utensils size={16} />, name: lang === 'hi' ? 'रसोइया / कुक' : 'Cook / Kitchen' };
  }

  return {
    icon: <Briefcase size={16} />,
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

  const statusType =
    worker.availability === 'AVAILABLE_TODAY'
      ? 'available_today'
      : worker.availability === 'AVAILABLE_TOMORROW'
      ? 'available_tomorrow'
      : 'offline';

  const statusLabel =
    worker.availability === 'AVAILABLE_TODAY'
      ? t.availableTodayBadge
      : worker.availability === 'AVAILABLE_TOMORROW'
      ? t.availableTomorrowBadge
      : lang === 'hi'
      ? 'उपलब्धता पूछें'
      : 'Contact for dates';

  return (
    <Card interactive elevation="glow" className="worker-card" role="article" aria-label={`Worker ${worker.name}`}>
      {/* 1. Header: Avatar + Identity + Trade + Daily Wage */}
      <div className="worker-card-header">
        <div className="worker-name-group">
          <Avatar name={worker.name} size="md" isVerified={true} />
          <div>
            <div className="worker-name">
              <span>{worker.name}</span>
              <Badge variant="verified" icon={<ShieldCheck size={13} />}>
                {lang === 'hi' ? 'सत्यापित' : 'Verified'}
              </Badge>
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

      {/* 2. Trust & Credentials Matrix */}
      <div className="worker-trust-matrix">
        {/* Rating + Jobs Completed */}
        <Badge variant="warning" icon={<Star size={13} color="#f59e0b" fill="#f59e0b" />}>
          <strong style={{ color: '#fbbf24' }}>{worker.rating}</strong>
          <span style={{ color: '#cbd5e1' }}> · {worker.jobs_completed} {t.jobsCompleted}</span>
        </Badge>

        {/* Semantic Status Badge */}
        <StatusBadge status={statusType} label={statusLabel} />

        {/* Distance & Locality */}
        <Badge variant="default" icon={<MapPin size={12} color="#94a3b8" />}>
          <span>{worker.distance_km} {lang === 'hi' ? 'किमी दूर' : 'km away'}</span>
          <span style={{ opacity: 0.5 }}> · </span>
          <span style={{ color: '#94a3b8' }}>{worker.locality}</span>
        </Badge>

        {/* Phone Verified Pill */}
        <Badge variant="success" icon={<ShieldCheck size={13} />}>
          {t.verifiedPhone}
        </Badge>

        {/* Attendance Rate */}
        {worker.attendance_rate > 0 && (
          <Badge variant="neutral" icon={<CheckCircle2 size={12} />}>
            {worker.attendance_rate}% {t.attendance}
          </Badge>
        )}
      </div>

      {/* 3. Dual Action Buttons */}
      <div className="worker-card-actions">
        <Button
          type="button"
          variant="secondary"
          size="md"
          leftIcon={<Eye size={15} />}
          onClick={() => (onViewProfile ? onViewProfile(worker) : onRequestHire(worker))}
        >
          {t.viewProfile}
        </Button>

        <Button
          type="button"
          variant="primary"
          size="md"
          leftIcon={<Zap size={15} />}
          onClick={() => onRequestHire(worker)}
        >
          {t.hireNow}
        </Button>
      </div>
    </Card>
  );
};
