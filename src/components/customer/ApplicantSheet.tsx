'use client';

import React, { useState } from 'react';
import { Star, Phone, MessageSquare, UserX, Check } from 'lucide-react';
import { Language } from '@/lib/translations';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { JOB_STATUS, APPLICATION_STATUS } from '@/lib/status';
import { isRated, formatRatingText, getNewWorkerLabel } from './WorkerCard';

export interface Applicant {
  application_id: string;
  worker_id: string;
  name: string;
  phone: string | null;
  city: string;
  locality: string;
  rating: number;
  rating_count: number;
  jobs_completed: number;
  experience_years: number;
  expected_wage: number;
  distance_km: number;
  status: string;
  skills: string[];
}

export interface ApplicantSheetJob {
  id: string;
  title: string;
  locality: string;
  status: string;
  workers_required?: number;
  workers_accepted?: number;
}

export interface ApplicantSheetProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  job: ApplicantSheetJob | null;
  /** `null` while the applicant list is loading. */
  applicants: Applicant[] | null;
  /** Resolves when the accept request finishes; the row's button is disabled while pending. */
  onAcceptWorker: (applicationId: string) => Promise<void>;
  onRateWorker: (workerId: string, workerName: string) => void;
}

interface StatusChip {
  en: string;
  hi: string;
  color: string;
  background: string;
}

const STATUS_CHIPS: Record<string, StatusChip> = {
  [APPLICATION_STATUS.APPLIED]: {
    en: 'Applied',
    hi: 'आवेदन किया',
    color: 'var(--text-secondary)',
    background: 'var(--bg-surface)',
  },
  [APPLICATION_STATUS.ACCEPTED]: {
    en: 'Accepted',
    hi: 'स्वीकृत',
    color: 'var(--brand-success)',
    background: 'var(--brand-success-subtle)',
  },
  [APPLICATION_STATUS.IN_PROGRESS]: {
    en: 'In progress',
    hi: 'काम जारी है',
    color: 'var(--brand-primary)',
    background: 'var(--bg-surface)',
  },
  [APPLICATION_STATUS.COMPLETED]: {
    en: 'Completed',
    hi: 'पूरा हुआ',
    color: 'var(--brand-success)',
    background: 'var(--brand-success-subtle)',
  },
  [APPLICATION_STATUS.REJECTED]: {
    en: 'Not selected',
    hi: 'नहीं चुना गया',
    color: 'var(--text-muted)',
    background: 'var(--bg-surface)',
  },
  [APPLICATION_STATUS.WITHDRAWN]: {
    en: 'Withdrawn',
    hi: 'वापस लिया',
    color: 'var(--text-muted)',
    background: 'var(--bg-surface)',
  },
};

/** Statuses where both parties are matched and the phone number is shared. */
const MATCHED = new Set<string>([
  APPLICATION_STATUS.ACCEPTED,
  APPLICATION_STATUS.IN_PROGRESS,
  APPLICATION_STATUS.COMPLETED,
]);

export const ApplicantSheet: React.FC<ApplicantSheetProps> = ({
  lang,
  isOpen,
  onClose,
  job,
  applicants,
  onAcceptWorker,
  onRateWorker,
}) => {
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const jobIsOpen = job.status === JOB_STATUS.OPEN;

  const handleAccept = async (applicationId: string) => {
    setPendingId(applicationId);
    try {
      await onAcceptWorker(applicationId);
    } finally {
      setPendingId(null);
    }
  };

  const renderBody = () => {
    if (applicants === null) {
      return (
        <div>
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      );
    }

    if (applicants.length === 0) {
      return (
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
      );
    }

    return applicants.map((app) => {
      const matched = MATCHED.has(app.status);
      const chip = STATUS_CHIPS[app.status];
      const canAccept = app.status === APPLICATION_STATUS.APPLIED && jobIsOpen;
      const canRate = app.status === APPLICATION_STATUS.COMPLETED;
      const isPending = pendingId === app.application_id;

      return (
        <div
          key={app.application_id}
          style={{
            padding: '14px',
            backgroundColor: matched ? 'var(--brand-success-subtle)' : 'var(--bg-subtle)',
            border: `1.5px solid ${matched ? 'var(--brand-success)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Header: Name, distance, rating */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {app.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {app.distance_km} km away · {app.locality}
              </div>
            </div>

            {isRated(app) ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <span>{formatRatingText(app)}</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {getNewWorkerLabel(lang)}
              </div>
            )}
          </div>

          {/* Status chip */}
          {chip && (
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: chip.color,
                  backgroundColor: chip.background,
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '2px 10px',
                }}
              >
                {lang === 'hi' ? chip.hi : chip.en}
              </span>
            </div>
          )}

          {/* Actions */}
          {(canAccept || canRate || (matched && app.phone)) && (
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', alignItems: 'center' }}>
              {canAccept && (
                <button
                  type="button"
                  disabled={isPending}
                  className="btn btn-primary"
                  style={{ width: '100%', minHeight: '36px', fontSize: '0.84rem' }}
                  onClick={() => void handleAccept(app.application_id)}
                >
                  <Check size={16} />
                  <span>
                    {isPending
                      ? (lang === 'hi' ? 'स्वीकार हो रहा है...' : 'Accepting...')
                      : (lang === 'hi' ? 'कामगार को स्वीकार करें' : 'Accept Worker')}
                  </span>
                </button>
              )}

              {matched && app.phone && (
                <>
                  <a
                    href={`tel:${app.phone}`}
                    className="btn btn-primary"
                    style={{ flex: 1, minHeight: '34px', fontSize: '0.8rem', textDecoration: 'none' }}
                  >
                    <Phone size={14} />
                    <span>{lang === 'hi' ? `कॉल करें (${app.phone})` : `Call (${app.phone})`}</span>
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
              )}

              {canRate && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ minHeight: '34px', fontSize: '0.78rem', marginLeft: 'auto' }}
                  onClick={() => onRateWorker(app.worker_id, app.name)}
                >
                  <Star size={13} color="var(--brand-accent)" />
                  <span>{lang === 'hi' ? 'रेट करें' : 'Rate'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'hi' ? 'आवेदक देखें' : 'Review Applicants'}
      subtitle={`${job.title} · ${job.locality}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{renderBody()}</div>
    </BottomSheet>
  );
};
