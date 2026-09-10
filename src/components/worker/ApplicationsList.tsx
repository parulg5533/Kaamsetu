'use client';

import React from 'react';
import { Clock, MapPin, Phone, MessageSquare, ShieldCheck, CheckCircle2, Star, Briefcase } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

export interface WorkerApplication {
  id: string;
  status: string;
  applied_at: string;
  worker_confirmed_completed: boolean;
  business_confirmed_completed: boolean;
  job: {
    id: string;
    title: string;
    description: string;
    skill_name: string;
    wage: number;
    food_provided: boolean;
    job_date: string;
    start_time: string;
    end_time: string;
    locality: string;
    status: string;
    business: {
      id: string;
      business_name: string;
      business_type: string;
      locality: string;
      phone: string | null;
      owner_name: string | null;
    };
  };
}

interface ApplicationsListProps {
  lang: Language;
  applications: WorkerApplication[];
  onConfirmCompleted: (jobId: string) => void;
  onRateBusiness: (businessId: string, businessName: string, jobId: string) => void;
}

export const ApplicationsList: React.FC<ApplicationsListProps> = ({
  lang,
  applications,
  onConfirmCompleted,
  onRateBusiness,
}) => {
  const t = translations[lang];

  if (applications.length === 0) {
    return (
      <div className="empty-state">
        <Briefcase size={36} />
        <p style={{ fontWeight: 700 }}>{t.noApplicationsYet}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {applications.map((app) => {
        const isAccepted = app.status === 'ACCEPTED' || app.status === 'COMPLETED';

        return (
          <div key={app.id} className="job-card">
            <div className="job-header">
              <div>
                <div className="job-title">{app.job.title}</div>
                <div className="business-sub">
                  <span>{app.job.business.business_name}</span>
                </div>
              </div>
              <div className="wage-badge">
                ₹{app.job.wage}/{lang === 'hi' ? 'दिन' : 'day'}
              </div>
            </div>

            <div className="job-meta-grid">
              <div className="meta-chip">
                <Clock size={12} />
                {app.job.job_date} · {app.job.start_time} - {app.job.end_time}
              </div>
              <div className="meta-chip">
                <MapPin size={12} />
                {app.job.locality}
              </div>
            </div>

            {/* Unlocked Contact Box when Accepted */}
            {isAccepted ? (
              <div className="unlocked-contact-box">
                <div className="contact-header">
                  <ShieldCheck size={16} />
                  {t.employerContactUnlocked}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#f8fafc' }}>
                  {lang === 'hi' ? 'काम देने वाला (Customer):' : 'Customer Name:'}{' '}
                  <strong>{app.job.business.owner_name}</strong>
                </div>

                <div className="contact-actions">
                  <a
                    href={`tel:${app.job.business.phone}`}
                    className="btn-call"
                  >
                    <Phone size={14} /> {t.callNow} ({app.job.business.phone})
                  </a>
                  <a
                    href={`https://wa.me/91${app.job.business.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-whatsapp"
                  >
                    <MessageSquare size={14} /> {t.whatsapp}
                  </a>
                </div>

                {/* Completion & Rating Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {!app.worker_confirmed_completed && (
                    <button
                      type="button"
                      className="btn-apply"
                      style={{ background: '#10b981', color: '#000', fontSize: '0.8rem', minHeight: '38px' }}
                      onClick={() => onConfirmCompleted(app.job.id)}
                    >
                      <CheckCircle2 size={15} />
                      {t.markCompleted}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-apply"
                    style={{ background: '#3b82f6', color: '#fff', fontSize: '0.8rem', minHeight: '38px' }}
                    onClick={() =>
                      onRateBusiness(
                        app.job.business.id,
                        app.job.business.business_name,
                        app.job.id
                      )
                    }
                  >
                    <Star size={14} fill="#fff" />
                    {t.rateUser}
                  </button>
                </div>
              </div>
            ) : (
              <div className="btn-applied">
                <CheckCircle2 size={16} />
                <span>{t.appliedWaiting}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
