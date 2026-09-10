'use client';

import React from 'react';
import { X, Users, MapPin, Star, CheckCircle2, Phone, MessageSquare, ShieldCheck } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

interface Applicant {
  application_id: string;
  worker_id: string;
  name: string;
  phone: string | null;
  city: string;
  locality: string;
  rating: number;
  rating_count: number;
  jobs_completed: number;
  attendance_rate: number;
  experience_years: number;
  expected_wage: number;
  distance_km: number;
  status: string;
  skills: string[];
}

interface ApplicantSheetProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  job: any;
  applicants: Applicant[];
  onAcceptWorker: (applicationId: string) => void;
  onRateWorker: (workerId: string, workerName: string) => void;
  loading: boolean;
}

export const ApplicantSheet: React.FC<ApplicantSheetProps> = ({
  lang,
  isOpen,
  onClose,
  job,
  applicants,
  onAcceptWorker,
  onRateWorker,
  loading,
}) => {
  if (!isOpen || !job) return null;
  const t = translations[lang];

  return (
    <div className="bottom-sheet-overlay" role="dialog" aria-modal="true">
      <div className="bottom-sheet-container" style={{ maxHeight: '88vh' }}>
        <div className="sheet-handle-bar" />

        <div className="sheet-header">
          <div>
            <div className="sheet-title">{t.viewApplicants}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {job.title} · {job.locality}
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Applicants List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {applicants.length === 0 ? (
            <div className="empty-state">
              <Users size={36} />
              <p style={{ fontWeight: 600 }}>
                {lang === 'hi' ? 'इस काम के लिए अभी तक कोई आवेदन नहीं आया है।' : 'No applicants yet for this job.'}
              </p>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {lang === 'hi' ? 'पास के कामगारों को नोटिफिकेशन भेज दिया गया है।' : 'Nearby workers have been notified.'}
              </span>
            </div>
          ) : (
            applicants.map((app) => {
              const isAccepted = app.status === 'ACCEPTED' || app.status === 'COMPLETED';

              return (
                <div
                  key={app.application_id}
                  className={`worker-card ${isAccepted ? 'accepted-worker' : ''}`}
                  style={{
                    borderColor: isAccepted ? 'var(--success)' : 'var(--border-subtle)',
                    background: isAccepted ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-card)',
                  }}
                >
                  <div className="worker-card-header">
                    <div className="worker-name-group">
                      <div className="worker-avatar">
                        {app.name.charAt(0)}
                      </div>
                      <div>
                        <div className="worker-name">
                          <span>{app.name}</span>
                          <ShieldCheck size={16} className="verified-icon" />
                        </div>
                        <div className="worker-trade">
                          {app.skills.join(' · ') || (lang === 'hi' ? 'जनरल वर्कर' : 'General Worker')}
                        </div>
                      </div>
                    </div>

                    {isAccepted ? (
                      <div
                        style={{
                          background: 'var(--success-light)',
                          color: '#34d399',
                          border: '1px solid var(--success-border)',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                        }}
                      >
                        ACCEPTED ✓
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-apply"
                        style={{ background: '#10b981', color: '#000', padding: '6px 14px', fontSize: '0.8rem', minHeight: '36px', flex: 'none' }}
                        onClick={() => onAcceptWorker(app.application_id)}
                        disabled={loading}
                      >
                        {lang === 'hi' ? 'स्वीकार करें (Accept)' : 'Accept Worker'}
                      </button>
                    )}
                  </div>

                  {/* Trust & Distance Badges */}
                  <div className="worker-badges-row">
                    <div className="trust-badge distance">
                      <MapPin size={12} />
                      {app.distance_km} {lang === 'hi' ? 'किमी दूर' : 'km away'} ({app.locality})
                    </div>
                    <div className="trust-badge">
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      {app.rating} ({app.jobs_completed} {t.jobsCompleted})
                    </div>
                    <div className="trust-badge verified">
                      <CheckCircle2 size={12} />
                      {app.attendance_rate}% {t.attendance}
                    </div>
                    <div className="trust-badge verified" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                      <ShieldCheck size={12} />
                      {lang === 'hi' ? 'फोन सत्यापित ✓' : 'Phone verified ✓'}
                    </div>
                  </div>

                  {/* Unlocked Contact Box when accepted */}
                  {isAccepted && app.phone && (
                    <div className="unlocked-contact-box" style={{ marginTop: '4px' }}>
                      <div className="contact-header">
                        <ShieldCheck size={15} />
                        {t.workerContactUnlocked}
                      </div>
                      <div className="contact-actions">
                        <a href={`tel:${app.phone}`} className="btn-call">
                          <Phone size={14} /> {t.callNow} ({app.phone})
                        </a>
                        <a
                          href={`https://wa.me/91${app.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-whatsapp"
                        >
                          <MessageSquare size={14} /> {t.whatsapp}
                        </a>
                      </div>

                      <button
                        type="button"
                        style={{
                          marginTop: '6px',
                          background: 'var(--primary)',
                          color: '#000',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                        onClick={() => onRateWorker(app.worker_id, app.name)}
                      >
                        ⭐ {lang === 'hi' ? 'काम पूरा मार्क करें और रेटिंग दें' : 'Mark Worked & Rate Worker'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
