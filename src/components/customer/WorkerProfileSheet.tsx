'use client';

import React from 'react';
import {
  Star,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  Phone,
  Zap,
  ThumbsUp,
  Award,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { BottomSheet, Avatar, Badge, Button } from '@/components/ui';
import { NearbyWorker, getWorkerTradeDetails } from './WorkerCard';

interface WorkerProfileSheetProps {
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
  const t = translations[lang];
  const trade = getWorkerTradeDetails(worker.skills, lang);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{t.workerProfileTitle}</span>
          <Badge variant="verified" icon={<ShieldCheck size={14} />}>
            {lang === 'hi' ? 'सत्यापित' : 'Verified'}
          </Badge>
        </div>
      }
      subtitle={t.safetyGuarantee}
      footer={
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '10px' }}>
          <Button variant="secondary" size="lg" onClick={onClose}>
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </Button>

          <Button
            variant="primary"
            size="lg"
            leftIcon={<Zap size={17} />}
            onClick={() => {
              onClose();
              onHireWorker(worker);
            }}
          >
            {lang === 'hi' ? `${worker.name} को काम दें` : `Hire ${worker.name}`}
          </Button>
        </div>
      }
    >
      {/* Worker Hero Summary Card */}
      <div className="worker-hero-profile-card">
        <Avatar name={worker.name} size="lg" isVerified={true} />

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
            {worker.name}
          </div>
          <div className="worker-prominent-trade" style={{ color: '#fbbf24' }}>
            <span className="trade-icon">{trade.icon}</span>
            <span className="trade-title">{trade.name}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '3px' }}>
            <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />
            {worker.distance_km} {lang === 'hi' ? 'किमी दूर' : 'km away'} · {worker.locality}, {worker.city}
          </div>
        </div>

        <div className="profile-wage-box">
          <div className="profile-wage-amount">₹{worker.expected_wage}</div>
          <div className="profile-wage-sub">{lang === 'hi' ? 'प्रति दिन' : 'per day'}</div>
        </div>
      </div>

      {/* 1. Trust & Safety Verification Pillars */}
      <section style={{ marginBottom: '16px' }} aria-label="Verification credentials">
        <div className="sheet-section-title">
          <ShieldCheck size={16} color="#34d399" />
          <span>{lang === 'hi' ? 'सुरक्षा व सत्यापन प्रमाण' : 'Trust & Safety Verification'}</span>
        </div>

        <div className="trust-credentials-box">
          {/* Phone Verified */}
          <div className="trust-cred-row">
            <div className="trust-cred-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Phone size={15} />
            </div>
            <div>
              <div className="trust-cred-title">
                <span>{lang === 'hi' ? 'फोन नंबर सत्यापित (OTP Verified)' : 'Phone Verified (OTP)'}</span>
                <span style={{ color: '#34d399', fontSize: '0.74rem' }}>✓ Active</span>
              </div>
              <div className="trust-cred-sub">
                {lang === 'hi'
                  ? 'मोबाइल नंबर सक्रिय है और प्रत्यक्ष बुकिंग पर उपलब्ध होगा।'
                  : 'Registered mobile number verified and unlocked upon booking.'}
              </div>
            </div>
          </div>

          {/* Local Area Resident */}
          <div className="trust-cred-row">
            <div className="trust-cred-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <MapPin size={15} />
            </div>
            <div>
              <div className="trust-cred-title">
                <span>{lang === 'hi' ? 'स्थानीय निवासी (Local Resident)' : 'Local Area Resident'}</span>
                <span style={{ color: '#60a5fa', fontSize: '0.74rem' }}>{worker.locality}</span>
              </div>
              <div className="trust-cred-sub">
                {lang === 'hi'
                  ? `${worker.city} के स्थानीय निवासी — पास के कार्यस्थलों पर समय पर पहुंच सकते हैं।`
                  : `Verified resident of ${worker.locality}, ${worker.city}. Close to your site.`}
              </div>
            </div>
          </div>

          {/* Track Record & Experience */}
          <div className="trust-cred-row">
            <div className="trust-cred-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Briefcase size={15} />
            </div>
            <div>
              <div className="trust-cred-title">
                <span>{worker.jobs_completed} {t.jobsCompleted}</span>
                <span style={{ color: '#fbbf24', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Star size={11} fill="#fbbf24" color="#fbbf24" /> {worker.rating} / 5.0
                </span>
              </div>
              <div className="trust-cred-sub">
                {lang === 'hi'
                  ? `${worker.experience_years} साल का अनुभव · ${worker.attendance_rate}% समय पर काम शुरू करने का रिकॉर्ड।`
                  : `${worker.experience_years} yrs trade experience · ${worker.attendance_rate}% on-time arrival rate.`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Customer Endorsement Badges */}
      <section style={{ marginBottom: '16px' }} aria-label="Customer endorsements">
        <div className="sheet-section-title">
          <ThumbsUp size={16} color="#fbbf24" />
          <span>{lang === 'hi' ? 'ग्राहकों द्वारा दी गई समीक्षाएं' : 'Customer Endorsement Highlights'}</span>
        </div>
        <div className="customer-feedback-tags">
          <span className="feedback-tag">{lang === 'hi' ? 'समय के पाबंद (Punctual)' : 'Always on time'}</span>
          <span className="feedback-tag">{lang === 'hi' ? 'साफ-सुथरा काम (Neat Work)' : 'Neat & tidy'}</span>
          <span className="feedback-tag">{lang === 'hi' ? 'सभ्य व सुरक्षित व्यवहार (Polite & Safe)' : 'Polite behavior'}</span>
          <span className="feedback-tag">{lang === 'hi' ? 'ईमानदार दिहाड़ी (Honest Wage)' : 'Fair & honest rate'}</span>
        </div>
      </section>

      {/* 3. Verified Skills Tags */}
      <section style={{ marginBottom: '10px' }} aria-label="Skills">
        <div className="sheet-section-title">
          <Award size={16} color="#60a5fa" />
          <span>{lang === 'hi' ? 'सत्यापित कार्य कौशल' : 'Verified Skills & Capabilities'}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {worker.skills.map((s) => (
            <Badge key={s.id} variant="default" icon={<CheckCircle2 size={13} color="#34d399" />}>
              {s.name}
            </Badge>
          ))}
        </div>
      </section>
    </BottomSheet>
  );
};
