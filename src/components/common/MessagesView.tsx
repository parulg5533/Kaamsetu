'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Star,
  MapPin,
  KeyRound,
  Check,
  Zap,
} from 'lucide-react';
import { Language } from '@/lib/translations';

export interface ActiveCoordinationItem {
  jobId: string;
  title: string;
  locality: string;
  wage: number;
  stage: 'ACCEPTED_EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED_PENDING_PAYMENT' | 'SETTLED';
  counterpartId: string;
  counterpartName: string;
  counterpartPhone: string | null;
  counterpartRole: 'WORKER' | 'CUSTOMER';
  startOtp?: string; // 4-digit security start code
  startTime?: string;
}

interface MessagesViewProps {
  lang: Language;
  userRole: 'WORKER' | 'BUSINESS';
  coordinations: ActiveCoordinationItem[];
  onVerifyOtp: (jobId: string, otp: string) => boolean;
  onConfirmFinish: (jobId: string) => void;
  onOpenRating: (jobId: string, counterpartId: string, counterpartName: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  lang,
  userRole,
  coordinations,
  onVerifyOtp,
  onConfirmFinish,
  onOpenRating,
}) => {
  const [enteredOtps, setEnteredOtps] = useState<{ [jobId: string]: string }>({});
  const [otpErrors, setOtpErrors] = useState<{ [jobId: string]: boolean }>({});

  const handleOtpSubmit = (jobId: string) => {
    const code = enteredOtps[jobId] || '';
    const success = onVerifyOtp(jobId, code);
    if (!success) {
      setOtpErrors((prev) => ({ ...prev, [jobId]: true }));
    } else {
      setOtpErrors((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {lang === 'hi' ? 'संदेश और समन्वय' : 'Messages & Coordination'}
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {lang === 'hi'
            ? 'स्वीकृत कामगारों और ग्राहकों के साथ सीधा संपर्क और कार्य स्थिति'
            : 'Direct communication and live job lifecycle with your active counterpart'}
        </p>
      </div>

      {coordinations.length === 0 ? (
        <div className="empty-state-view" style={{ marginTop: '40px' }}>
          <MessageSquare size={36} className="empty-state-icon" />
          <div className="empty-state-title">
            {lang === 'hi' ? 'अभी कोई सक्रिय बातचीत नहीं है' : 'No active messages yet'}
          </div>
          <div className="empty-state-desc">
            {lang === 'hi'
              ? 'जब कोई काम स्वीकार (Accept) होता है, तब सीधा संपर्क और सुरक्षा OTP यहाँ दिखाई देता है।'
              : 'When a job is accepted, direct calling, chat, and the job start handshake appear here.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {coordinations.map((item) => {
            const isCustomer = userRole === 'BUSINESS';
            return (
              <div
                key={item.jobId}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1.5px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* 1. Counterpart Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {item.counterpartName}
                      </span>
                      <ShieldCheck size={16} color="var(--brand-success)" />
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {item.title} · {item.locality}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      ₹{item.wage}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {lang === 'hi' ? 'दैनिक मजदूरी' : 'Daily Wage'}
                    </div>
                  </div>
                </div>

                {/* 2. Unlocked Communication Actions (Privacy Protected: Only after Acceptance) */}
                {item.counterpartPhone ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`tel:${item.counterpartPhone}`}
                      className="btn btn-secondary"
                      style={{ flex: 1, minHeight: '38px', textDecoration: 'none', fontSize: '0.82rem' }}
                    >
                      <Phone size={14} />
                      <span>{lang === 'hi' ? 'सीधे कॉल करें' : 'Direct Call'} ({item.counterpartPhone})</span>
                    </a>
                    <a
                      href={`https://wa.me/91${item.counterpartPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn"
                      style={{
                        backgroundColor: '#25D366',
                        color: '#ffffff',
                        textDecoration: 'none',
                        minHeight: '38px',
                        padding: '0 16px',
                      }}
                      aria-label="WhatsApp"
                    >
                      <MessageSquare size={16} />
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {lang === 'hi' ? 'फोन नंबर स्वीकृति के बाद सुरक्षित अनलॉक होगा।' : 'Phone number unlocks securely upon job acceptance.'}
                  </div>
                )}

                {/* 3. Job Lifecycle Handshake (OTP verification at arrival) */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  {item.stage === 'ACCEPTED_EN_ROUTE' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-accent-hover)' }}>
                        <Clock size={15} />
                        <span>
                          {isCustomer
                            ? (lang === 'hi' ? 'कामगार आ रहे हैं · कार्य स्थल पर पहुँचने पर कोड सत्यापित करें' : 'Worker is en route · Verify code upon arrival')
                            : (lang === 'hi' ? 'ग्राहक के स्थान पर पहुँचें और कार्य शुरू करने के लिए कोड बताएं' : 'Head to site · Share start code with customer to begin')}
                        </span>
                      </div>

                      {/* Security Guardrail: OTP is revealed/entered only when starting work */}
                      {isCustomer ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="4-digit OTP"
                            value={enteredOtps[item.jobId] || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setEnteredOtps((prev) => ({ ...prev, [item.jobId]: val }));
                            }}
                            style={{
                              width: '120px',
                              padding: '8px 10px',
                              border: `1.5px solid ${otpErrors[item.jobId] ? 'var(--brand-danger)' : 'var(--border-medium)'}`,
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              textAlign: 'center',
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ minHeight: '36px', fontSize: '0.8rem' }}
                            onClick={() => handleOtpSubmit(item.jobId)}
                          >
                            <KeyRound size={14} />
                            <span>{lang === 'hi' ? 'काम शुरू करें' : 'Verify & Start Work'}</span>
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {lang === 'hi' ? 'आपका 4-अंकों का स्टार्ट कोड:' : 'Your 4-digit start security code:'}{' '}
                          <strong style={{ fontSize: '1rem', color: 'var(--brand-primary)' }}>{item.startOtp || '7821'}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {item.stage === 'IN_PROGRESS' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-success)', fontSize: '0.84rem', fontWeight: 700 }}>
                        <Zap size={15} />
                        <span>{lang === 'hi' ? 'काम प्रगति पर है...' : 'Work in progress...'}</span>
                      </div>

                      <button
                        type="button"
                        className="btn btn-accent"
                        style={{ minHeight: '34px', fontSize: '0.8rem' }}
                        onClick={() => onConfirmFinish(item.jobId)}
                      >
                        <Check size={14} />
                        <span>{lang === 'hi' ? 'काम समाप्त घोषित करें' : 'Mark Work Finished'}</span>
                      </button>
                    </div>
                  )}

                  {item.stage === 'COMPLETED_PENDING_PAYMENT' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--brand-success)', fontWeight: 700 }}>
                        {lang === 'hi' ? 'काम पूरा हुआ ✓' : 'Work Completed ✓'}
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ minHeight: '34px', fontSize: '0.8rem' }}
                        onClick={() => onOpenRating(item.jobId, item.counterpartId, item.counterpartName)}
                      >
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        <span>{lang === 'hi' ? 'रेटिंग और समीक्षा दें' : 'Rate & Review'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
