'use client';

import React from 'react';
import {
  Users,
  MapPin,
  Star,
  CheckCircle2,
  Phone,
  MessageSquare,
  ShieldCheck,
  UserX,
  Check,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { BottomSheet } from '@/components/ui/BottomSheet';

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
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'hi' ? 'आवेदक देखें' : 'Review Applicants'}
      subtitle={`${job.title} · ${job.locality}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {applicants.length === 0 ? (
          <div className="empty-state-view">
            <UserX size={32} className="empty-state-icon" />
            <div className="empty-state-title">
              {lang === 'hi' ? 'अभी तक कोई आवेदन नहीं आया है' : 'No applicants yet for this job'}
            </div>
            <div className="empty-state-desc">
              {lang === 'hi'
                ? 'पास के योग्य कामगारों को सूचना भेज दी गई है।'
                : 'Nearby workers have been notified and will apply shortly.'}
            </div>
          </div>
        ) : (
          applicants.map((app) => {
            const isAccepted = app.status === 'ACCEPTED' || app.status === 'COMPLETED';

            return (
              <div
                key={app.application_id}
                style={{
                  padding: '14px',
                  backgroundColor: isAccepted ? 'var(--brand-success-subtle)' : 'var(--bg-subtle)',
                  border: `1.5px solid ${isAccepted ? 'var(--brand-success)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Header: Name, Verified check, Rating */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {app.name}
                      </span>
                      <ShieldCheck size={16} color="var(--brand-success)" />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {app.distance_km} km away · {app.locality}
                    </div>
                  </div>

                  {app.rating > 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <span>{app.rating.toFixed(1)}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>({app.jobs_completed} {lang === 'hi' ? 'काम' : 'jobs'})</span>
                    </div>
                  )}
                </div>

                {/* Actions: Accept or Contact */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  {isAccepted ? (
                    <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                      {app.phone ? (
                        <>
                          <a
                            href={`tel:${app.phone}`}
                            className="btn btn-primary"
                            style={{ flex: 1, minHeight: '34px', fontSize: '0.8rem', textDecoration: 'none' }}
                          >
                            <Phone size={14} />
                            <span>Call ({app.phone})</span>
                          </a>
                          <a
                            href={`https://wa.me/91${app.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn"
                            style={{
                              backgroundColor: '#25D366',
                              color: '#ffffff',
                              textDecoration: 'none',
                              minHeight: '34px',
                              padding: '0 14px',
                            }}
                            aria-label="WhatsApp"
                          >
                            <MessageSquare size={14} />
                          </a>
                        </>
                      ) : (
                        <div style={{ fontSize: '0.82rem', color: 'var(--brand-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={16} />
                          <span>{lang === 'hi' ? 'स्वीकृत (फोन नंबर अनलॉक हुआ)' : 'Accepted (Contact Unlocked)'}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ minHeight: '34px', fontSize: '0.78rem' }}
                        onClick={() => onRateWorker(app.worker_id, app.name)}
                      >
                        <Star size={13} color="var(--brand-accent)" />
                        <span>{lang === 'hi' ? 'रेट करें' : 'Rate'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      className="btn btn-primary"
                      style={{ width: '100%', minHeight: '36px', fontSize: '0.84rem' }}
                      onClick={() => onAcceptWorker(app.application_id)}
                    >
                      <Check size={16} />
                      <span>{lang === 'hi' ? 'कामगार को स्वीकार करें (Accept)' : 'Accept Worker & Unlock Phone'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </BottomSheet>
  );
};
