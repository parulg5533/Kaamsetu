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
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { BottomSheet, Avatar, Badge, Button, EmptyState } from '@/components/ui';

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
      title={t.viewApplicants}
      subtitle={`${job.title} · ${job.locality}`}
    >
      {/* Applicants List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {applicants.length === 0 ? (
          <EmptyState
            icon={<UserX size={28} />}
            title={
              lang === 'hi'
                ? 'इस काम के लिए अभी तक कोई आवेदन नहीं आया है।'
                : 'No applicants yet for this job.'
            }
            description={
              lang === 'hi'
                ? 'पास के कामगारों को नोटिफिकेशन भेज दिया गया है।'
                : 'Nearby workers have been notified and will apply soon.'
            }
          />
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
                    <Avatar name={app.name} size="md" isVerified={true} />
                    <div>
                      <div className="worker-name">
                        <span>{app.name}</span>
                        <Badge variant="verified" icon={<ShieldCheck size={13} />}>
                          {lang === 'hi' ? 'सत्यापित' : 'Verified'}
                        </Badge>
                      </div>
                      <div className="worker-trade">
                        {app.skills.join(' · ') ||
                          (lang === 'hi' ? 'जनरल वर्कर' : 'General Worker')}
                      </div>
                    </div>
                  </div>

                  {isAccepted ? (
                    <Badge variant="success">ACCEPTED ✓</Badge>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onAcceptWorker(app.application_id)}
                      disabled={loading}
                    >
                      {lang === 'hi' ? 'स्वीकार करें' : 'Accept Worker'}
                    </Button>
                  )}
                </div>

                {/* Trust & Distance Badges */}
                <div className="worker-badges-row">
                  <Badge variant="default" icon={<MapPin size={12} />}>
                    {app.distance_km} {lang === 'hi' ? 'किमी दूर' : 'km away'} ({app.locality})
                  </Badge>

                  <Badge variant="warning" icon={<Star size={12} color="#f59e0b" fill="#f59e0b" />}>
                    {app.rating} ({app.jobs_completed} {t.jobsCompleted})
                  </Badge>

                  <Badge variant="neutral" icon={<CheckCircle2 size={12} />}>
                    {app.attendance_rate}% {t.attendance}
                  </Badge>

                  <Badge variant="verified" icon={<ShieldCheck size={12} />}>
                    {t.verifiedPhone}
                  </Badge>
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

                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      leftIcon={<Star size={14} />}
                      onClick={() => onRateWorker(app.worker_id, app.name)}
                      style={{ marginTop: '6px' }}
                    >
                      {lang === 'hi'
                        ? 'काम पूरा मार्क करें और रेटिंग दें'
                        : 'Mark Worked & Rate Worker'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </BottomSheet>
  );
};
