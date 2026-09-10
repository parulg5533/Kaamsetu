'use client';

import React from 'react';
import {
  X,
  Star,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Briefcase,
  Phone,
  Zap,
  Award,
  ThumbsUp,
  UserCheck,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';
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

  const isAvailToday = worker.availability === 'AVAILABLE_TODAY';
  const isAvailTomorrow = worker.availability === 'AVAILABLE_TOMORROW';

  return (
    <div className="bottom-sheet-overlay" role="dialog" aria-modal="true">
      <div className="bottom-sheet-container" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="sheet-handle-bar" />

        {/* Header with Close */}
        <div className="sheet-header" style={{ paddingBottom: '8px' }}>
          <div>
            <div className="sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{t.workerProfileTitle}</span>
              <span className="verified-shield-tag">
                <ShieldCheck size={14} />
                <span>{lang === 'hi' ? 'सत्यापित' : 'Verified'}</span>
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {t.safetyGuarantee}
            </div>
          </div>
          <button
            type="button"
            className="sheet-close-btn"
            onClick={onClose}
            aria-label="Close Profile"
          >
            <X size={18} />
          </button>
        </div>

        {/* Worker Hero Summary */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(16, 185, 129, 0.08))',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            margin: '8px 0 14px 0',
          }}
        >
          <div className="worker-avatar-wrapper" style={{ width: '56px', height: '56px' }}>
            <div
              className="worker-avatar"
              style={{ width: '100%', height: '100%', fontSize: '1.4rem' }}
            >
              {worker.name.charAt(0)}
            </div>
            <div className="avatar-verified-badge" style={{ width: '20px', height: '20px' }}>
              ✓
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
              {worker.name}
            </div>
            <div
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '2px',
              }}
            >
              <span>{trade.icon}</span>
              <span>{trade.name}</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
              📍 {worker.distance_km} {lang === 'hi' ? 'किमी दूर' : 'km away'} · {worker.locality}, {worker.city}
            </div>
          </div>

          <div
            style={{
              textAlign: 'right',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '6px 10px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#34d399' }}>
              ₹{worker.expected_wage}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              {lang === 'hi' ? 'प्रति दिन' : 'per day'}
            </div>
          </div>
        </div>

        {/* 1. TRUST & VERIFICATION CERTIFICATION PILLARS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f1f5f9' }}>
            🛡️ {lang === 'hi' ? 'सुरक्षा व सत्यापन प्रमाण' : 'Trust & Safety Verification'}
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

            {/* Local Address & Presence */}
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
                  <span style={{ color: '#fbbf24', fontSize: '0.74rem' }}>⭐ {worker.rating} / 5.0</span>
                </div>
                <div className="trust-cred-sub">
                  {lang === 'hi'
                    ? `${worker.experience_years} साल का अनुभव · ${worker.attendance_rate}% समय पर काम शुरू करने का रिकॉर्ड।`
                    : `${worker.experience_years} yrs trade experience · ${worker.attendance_rate}% on-time arrival rate.`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CUSTOMER ENDORSEMENTS & BADGES */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '6px' }}>
            👍 {lang === 'hi' ? 'ग्राहकों द्वारा दी गई समीक्षाएं' : 'Customer Endorsement Highlights'}
          </div>
          <div className="customer-feedback-tags">
            <span className="feedback-tag">⭐ {lang === 'hi' ? 'समय के पाबंद (Punctual)' : 'Always on time'}</span>
            <span className="feedback-tag">⭐ {lang === 'hi' ? 'साफ-सुथरा काम (Neat Work)' : 'Neat & tidy'}</span>
            <span className="feedback-tag">⭐ {lang === 'hi' ? 'सभ्य व सुरक्षित व्यवहार (Polite & Safe)' : 'Polite behavior'}</span>
            <span className="feedback-tag">⭐ {lang === 'hi' ? 'ईमानदार दिहाड़ी (Honest Wage)' : 'Fair & honest rate'}</span>
          </div>
        </div>

        {/* 3. VERIFIED SKILLS TAGS */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '8px' }}>
            🛠️ {lang === 'hi' ? 'सत्यापित कार्य कौशल' : 'Verified Skills & Capabilities'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {worker.skills.map((s) => (
              <div
                key={s.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  color: '#e2e8f0',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={13} color="#34d399" />
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. ACTIONS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '10px', paddingTop: '10px' }}>
          <button
            type="button"
            className="btn-view-profile"
            onClick={onClose}
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>

          <button
            type="button"
            className="btn-hire-primary"
            style={{ padding: '12px 18px', fontSize: '0.94rem' }}
            onClick={() => {
              onClose();
              onHireWorker(worker);
            }}
          >
            <Zap size={17} />
            <span>
              {lang === 'hi' ? `${worker.name} को काम दें` : `Hire ${worker.name}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
