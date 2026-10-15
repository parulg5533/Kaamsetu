'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Phone,
  ShieldCheck,
  Clock,
  Star,
  KeyRound,
  Check,
  Zap,
} from 'lucide-react';
import { Language } from '@/lib/translations';
import type { ActiveWorkItem } from '@/lib/types/active-work';

interface MessagesViewProps {
  lang: Language;
  items: ActiveWorkItem[];
  onStartWork: (applicationId: string, otp: string) => Promise<{ ok: boolean; error?: string }>;
  onConfirmFinish: (applicationId: string) => Promise<void>;
  onConfirmPayment: (applicationId: string) => Promise<void>;
  onOpenRating: (
    applicationId: string,
    counterpartName: string,
    counterpartRole: 'WORKER' | 'BUSINESS'
  ) => void;
}

type PendingAction = 'start' | 'finish' | 'payment';

export const MessagesView: React.FC<MessagesViewProps> = ({
  lang,
  items,
  onStartWork,
  onConfirmFinish,
  onConfirmPayment,
  onOpenRating,
}) => {
  const hi = lang === 'hi';
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [codeErrors, setCodeErrors] = useState<Record<string, string | null>>({});
  // Keyed by `${applicationId}:${action}` so each button disables only while its own request is pending.
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const isPending = (applicationId: string, action: PendingAction) => !!pending[`${applicationId}:${action}`];

  const runPending = async (applicationId: string, action: PendingAction, fn: () => Promise<unknown>) => {
    const key = `${applicationId}:${action}`;
    setPending((prev) => ({ ...prev, [key]: true }));
    try {
      await fn();
    } finally {
      setPending((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleStart = async (applicationId: string) => {
    const code = codeInputs[applicationId] || '';
    if (!/^\d{4}$/.test(code)) return;
    setCodeErrors((prev) => ({ ...prev, [applicationId]: null }));
    await runPending(applicationId, 'start', async () => {
      const result = await onStartWork(applicationId, code);
      if (result.ok) {
        setCodeInputs((prev) => ({ ...prev, [applicationId]: '' }));
      } else {
        setCodeErrors((prev) => ({
          ...prev,
          [applicationId]:
            result.error || (hi ? 'कोड गलत है। कृपया फिर से प्रयास करें।' : 'Incorrect code. Please try again.'),
        }));
      }
    });
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {hi ? 'संदेश और समन्वय' : 'Messages & Coordination'}
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {hi
            ? 'स्वीकृत कामगारों और ग्राहकों के साथ सीधा संपर्क और कार्य स्थिति'
            : 'Direct communication and live job lifecycle with your active counterpart'}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state-view" style={{ marginTop: '40px' }}>
          <MessageSquare size={36} className="empty-state-icon" />
          <div className="empty-state-title">
            {hi ? 'अभी कोई सक्रिय बातचीत नहीं है' : 'No active messages yet'}
          </div>
          <div className="empty-state-desc">
            {hi
              ? 'जब कोई काम स्वीकार (Accept) होता है, तब सीधा संपर्क और सुरक्षा OTP यहाँ दिखाई देता है।'
              : 'When a job is accepted, direct calling, chat, and the job start handshake appear here.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {items.map((item) => {
            const isBusiness = item.my_role === 'BUSINESS';
            const counterpartRole: 'WORKER' | 'BUSINESS' = item.my_role === 'WORKER' ? 'BUSINESS' : 'WORKER';
            const counterpartName = item.counterpart.name;
            const counterpartPhone = item.counterpart.phone;
            const code = codeInputs[item.application_id] || '';
            const codeError = codeErrors[item.application_id];

            return (
              <div
                key={item.application_id}
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
                        {counterpartName}
                      </span>
                      <ShieldCheck size={16} color="var(--brand-success)" />
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {item.title}
                      {item.locality ? ` · ${item.locality}` : ''}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.job_date} · {item.start_time} – {item.end_time}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      ₹{item.wage}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {hi ? 'दैनिक मजदूरी' : 'Daily Wage'}
                    </div>
                  </div>
                </div>

                {/* 2. Communication actions (unlocked only after acceptance) */}
                {counterpartPhone ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`tel:${counterpartPhone}`}
                      className="btn btn-secondary"
                      style={{ flex: 1, minHeight: '38px', textDecoration: 'none', fontSize: '0.82rem' }}
                    >
                      <Phone size={14} />
                      <span>{hi ? 'सीधे कॉल करें' : 'Direct Call'} ({counterpartPhone})</span>
                    </a>
                    <a
                      href={`https://wa.me/91${counterpartPhone}`}
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
                ) : null}

                {/* 3. Job lifecycle */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  {item.stage === 'ACCEPTED' && isBusiness && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-accent-hover)' }}>
                        <Clock size={15} />
                        <span>{hi ? 'कामगार आ रहे हैं' : 'Worker is on the way'}</span>
                      </div>
                      {item.arrival_code && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <div>
                            {hi ? 'आगमन कोड:' : 'Arrival code:'}{' '}
                            <strong style={{ fontSize: '1.2rem', letterSpacing: '0.15em', color: 'var(--brand-primary)' }}>
                              {item.arrival_code}
                            </strong>
                          </div>
                          <div style={{ marginTop: '2px' }}>
                            {hi
                              ? `कामगार पहुँचने पर ${counterpartName} के साथ यह कोड साझा करें`
                              : `Share this with ${counterpartName} when they arrive`}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {item.stage === 'ACCEPTED' && !isBusiness && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-accent-hover)' }}>
                        <Clock size={15} />
                        <span>
                          {hi
                            ? 'ग्राहक के स्थान पर पहुँचें और कोड दर्ज करके कार्य शुरू करें'
                            : 'Head to site, then enter the code the customer shows you to start work'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          autoComplete="one-time-code"
                          aria-label={hi ? 'आगमन कोड' : 'Arrival code'}
                          value={code}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setCodeInputs((prev) => ({ ...prev, [item.application_id]: val }));
                            setCodeErrors((prev) => ({ ...prev, [item.application_id]: null }));
                          }}
                          style={{
                            width: '120px',
                            padding: '8px 10px',
                            border: `1.5px solid ${codeError ? 'var(--brand-danger)' : 'var(--border-medium)'}`,
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
                          disabled={code.length !== 4 || isPending(item.application_id, 'start')}
                          onClick={() => handleStart(item.application_id)}
                        >
                          <KeyRound size={14} />
                          <span>{hi ? 'काम शुरू करें' : 'Start work'}</span>
                        </button>
                      </div>
                      {codeError && (
                        <div role="alert" style={{ fontSize: '0.78rem', color: 'var(--brand-danger)', fontWeight: 600 }}>
                          {codeError}
                        </div>
                      )}
                    </div>
                  )}

                  {item.stage === 'IN_PROGRESS' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-success)', fontSize: '0.84rem', fontWeight: 700 }}>
                          <Zap size={15} />
                          <span>{hi ? 'काम प्रगति पर है...' : 'Work in progress...'}</span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-accent"
                          style={{ minHeight: '34px', fontSize: '0.8rem' }}
                          disabled={item.i_confirmed || isPending(item.application_id, 'finish')}
                          onClick={() => runPending(item.application_id, 'finish', () => onConfirmFinish(item.application_id))}
                        >
                          <Check size={14} />
                          <span>
                            {item.i_confirmed
                              ? (hi ? `${counterpartName} की पुष्टि का इंतज़ार` : `Waiting for ${counterpartName} to confirm`)
                              : (hi ? 'काम समाप्त घोषित करें' : 'Mark work finished')}
                          </span>
                        </button>
                      </div>
                      {item.other_confirmed && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--brand-success)', fontWeight: 600 }}>
                          {hi ? `${counterpartName} ने पुष्टि की है` : `${counterpartName} has confirmed`}
                        </div>
                      )}
                    </div>
                  )}

                  {item.stage === 'COMPLETED' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--brand-success)', fontWeight: 700 }}>
                        {hi ? 'काम पूरा हुआ ✓' : 'Work completed ✓'}
                      </div>

                      {isBusiness && !item.payment_confirmed && (
                        <button
                          type="button"
                          className="btn btn-accent"
                          style={{ minHeight: '34px', fontSize: '0.8rem', alignSelf: 'flex-start' }}
                          disabled={isPending(item.application_id, 'payment')}
                          onClick={() => runPending(item.application_id, 'payment', () => onConfirmPayment(item.application_id))}
                        >
                          <Check size={14} />
                          <span>{hi ? `मैंने ${counterpartName} को भुगतान किया` : `I've paid ${counterpartName}`}</span>
                        </button>
                      )}

                      {isBusiness && item.payment_confirmed && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {hi ? 'भुगतान की पुष्टि हो गई है' : 'Payment confirmed'}
                        </div>
                      )}

                      {!item.i_reviewed && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ minHeight: '34px', fontSize: '0.8rem', alignSelf: 'flex-start' }}
                          onClick={() => onOpenRating(item.application_id, counterpartName, counterpartRole)}
                        >
                          <Star size={14} fill="#f59e0b" color="#f59e0b" />
                          <span>{hi ? `${counterpartName} को रेट करें` : `Rate ${counterpartName}`}</span>
                        </button>
                      )}
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
