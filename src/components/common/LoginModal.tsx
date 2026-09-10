'use client';

import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

interface DemoPersona {
  id: string;
  name: string;
  role: 'WORKER' | 'BUSINESS';
  phone: string;
  title: string;
  locality: string;
}

interface LoginModalProps {
  lang: Language;
  isOpen: boolean;
  onClose?: () => void;
  canClose: boolean;
  loginRole: 'WORKER' | 'BUSINESS';
  onSelectRole: (role: 'WORKER' | 'BUSINESS') => void;
  loginStep: 'PHONE' | 'OTP';
  onSetStep: (step: 'PHONE' | 'OTP') => void;
  phone: string;
  onChangePhone: (phone: string) => void;
  name: string;
  onChangeName: (name: string) => void;
  locality: string;
  onChangeLocality: (locality: string) => void;
  otp: string;
  onChangeOtp: (otp: string) => void;
  error: string | null;
  loading: boolean;
  onSendOtp: (e: React.FormEvent) => void;
  onVerifyOtp: (e: React.FormEvent) => void;
  demoPersonas: DemoPersona[];
  onSelectDemoPersona: (personaKey: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  lang,
  isOpen,
  onClose,
  canClose,
  loginRole,
  onSelectRole,
  loginStep,
  onSetStep,
  phone,
  onChangePhone,
  name,
  onChangeName,
  locality,
  onChangeLocality,
  otp,
  onChangeOtp,
  error,
  loading,
  onSendOtp,
  onVerifyOtp,
  demoPersonas,
  onSelectDemoPersona,
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  return (
    <div className="login-window-overlay" role="dialog" aria-modal="true">
      <div className="login-window-box">
        {/* Header */}
        <div className="login-window-header">
          {canClose && onClose && (
            <button
              className="btn-close"
              style={{ position: 'absolute', top: '16px', right: '16px' }}
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
          <div className="login-brand-title">
            <span>Kaam</span>Setu
          </div>
          <div className="login-subtitle">{t.tagline}</div>
        </div>

        <div className="login-body">
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Role Choice Cards */}
          <div>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              {lang === 'hi' ? 'आप क्या करना चाहते हैं?' : 'Choose your role:'}
            </label>
            <div className="role-choice-grid">
              <div
                className={`role-choice-card ${loginRole === 'WORKER' ? 'selected' : ''}`}
                onClick={() => onSelectRole('WORKER')}
              >
                {loginRole === 'WORKER' && <div className="role-selected-badge">✓</div>}
                <div className="role-card-icon">👷</div>
                <div className="role-card-title">{t.worker}</div>
                <div className="role-card-desc">{t.workerDesc}</div>
              </div>

              <div
                className={`role-choice-card ${loginRole === 'BUSINESS' ? 'selected business' : ''}`}
                onClick={() => onSelectRole('BUSINESS')}
              >
                {loginRole === 'BUSINESS' && <div className="role-selected-badge business">✓</div>}
                <div className="role-card-icon">🏠</div>
                <div className="role-card-title">{t.customer}</div>
                <div className="role-card-desc">{t.customerDesc}</div>
              </div>
            </div>
          </div>

          {loginStep === 'PHONE' ? (
            /* Step 1: Mobile & Basic Info */
            <form onSubmit={onSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">
                  {loginRole === 'WORKER'
                    ? (lang === 'hi' ? 'कारीगर का मोबाइल नंबर' : 'Worker Mobile Number')
                    : (lang === 'hi' ? 'काम देने वाले / ग्राहक का मोबाइल नंबर' : 'Customer Mobile Number')}
                </label>
                <div className="phone-input-wrapper">
                  <div className="phone-prefix">🇮🇳 +91</div>
                  <input
                    type="tel"
                    maxLength={10}
                    className="phone-input-field"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => onChangePhone(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {loginRole === 'WORKER'
                    ? (lang === 'hi' ? 'आपका नाम (जैसे राहुल कुमार)' : 'Your Name (e.g. Rahul Kumar)')
                    : (lang === 'hi' ? 'आपका नाम (जैसे अनिता शर्मा / शर्मा जी)' : 'Your Name (e.g. Anita Sharma)')}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={loginRole === 'WORKER' ? 'e.g. Rahul Kumar' : 'e.g. Anita Sharma'}
                  value={name}
                  onChange={(e) => onChangeName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{lang === 'hi' ? 'शहर / इलाका' : 'City / Locality'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ranjit Avenue, Amritsar"
                  value={locality}
                  onChange={(e) => onChangeLocality(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-apply"
                style={{
                  marginTop: '4px',
                  background: loginRole === 'WORKER' ? 'var(--primary)' : '#3b82f6',
                  color: loginRole === 'WORKER' ? '#000' : '#fff',
                }}
                disabled={loading}
              >
                {loading ? (lang === 'hi' ? 'भेज रहे हैं...' : 'Sending OTP...') : (lang === 'hi' ? 'ओटीपी प्राप्त करें →' : 'Continue with OTP →')}
              </button>
            </form>
          ) : (
            /* Step 2: OTP Entry */
            <form onSubmit={onVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.86rem', color: '#f8fafc', fontWeight: 700 }}>
                  {lang === 'hi' ? '4-अंकों का वेरिफिकेशन कोड दर्ज करें' : 'Enter 4-Digit Verification Code'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                  {lang === 'hi' ? `+91 ${phone} पर भेजा गया` : `Sent to +91 ${phone}`}
                </div>
              </div>

              <input
                type="text"
                maxLength={4}
                className="otp-input-box"
                placeholder="••••"
                value={otp}
                onChange={(e) => onChangeOtp(e.target.value)}
                required
                autoFocus
              />

              <div className="test-otp-hint">
                <span>💡 {lang === 'hi' ? 'टेस्ट ओटीपी:' : 'Prototype Test OTP:'} <strong>1234</strong></span>
                <button
                  type="button"
                  className="btn-autofill-otp"
                  onClick={() => onChangeOtp('1234')}
                >
                  Auto-Fill 1234
                </button>
              </div>

              <button
                type="submit"
                className="btn-apply"
                style={{
                  background: loginRole === 'WORKER' ? 'var(--primary)' : '#3b82f6',
                  color: loginRole === 'WORKER' ? '#000' : '#fff',
                }}
                disabled={loading}
              >
                {loading
                  ? (lang === 'hi' ? 'सत्यापित कर रहे हैं...' : 'Verifying...')
                  : (lang === 'hi' ? 'वेरिफाई करें और आगे बढ़ें ✓' : `Verify & Enter KaamSetu ✓`)}
              </button>

              <button
                type="button"
                onClick={() => onSetStep('PHONE')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ← {lang === 'hi' ? 'मोबाइल नंबर बदलें' : 'Change mobile number'}
              </button>
            </form>
          )}

          {/* Quick Demo Shortcuts */}
          <div className="login-divider">
            {lang === 'hi' ? 'या डेमो प्रोफाइल से सीधे लॉगिन करें' : 'Or quick login with demo profile'}
          </div>
          <div className="demo-account-list">
            {demoPersonas.map((p) => (
              <button
                key={p.id}
                className="demo-account-btn"
                onClick={() => onSelectDemoPersona(p.id)}
              >
                <span className="demo-role-emoji">{p.role === 'WORKER' ? '👷' : '🏠'}</span>
                <div style={{ overflow: 'hidden' }}>
                  <div className="demo-name">{p.name.split(' (')[0]}</div>
                  <div className="demo-detail">{p.role === 'WORKER' ? (lang === 'hi' ? 'काम करने वाला' : 'Worker') : (lang === 'hi' ? 'काम देने वाला' : 'Customer')} · {p.locality.split(',')[0]}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
