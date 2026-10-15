'use client';

import React, { useEffect, useState } from 'react';
import { User, Briefcase, Navigation, MapPin, AlertCircle } from 'lucide-react';
import { Language } from '@/lib/translations';
import { BottomSheet } from '@/components/ui/BottomSheet';

export interface OnboardingCompletePayload {
  phone: string;
  otp: string;
  role: 'WORKER' | 'BUSINESS';
  name?: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
}

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onCompleteOnboarding: (data: OnboardingCompletePayload) => Promise<{ ok: boolean; error?: string }>;
}

type Step = 'ROLE' | 'LOCATION' | 'PHONE' | 'OTP';

const PHONE_PATTERN = /^[6-9]\d{9}$/;
const RESEND_COOLDOWN_SECONDS = 30;
const DEFAULT_LOCALITY = 'Ranjit Avenue, Amritsar';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  lang,
  onCompleteOnboarding,
}) => {
  const [step, setStep] = useState<Step>('ROLE');
  const [role, setRole] = useState<'WORKER' | 'BUSINESS'>('BUSINESS');
  const [locality, setLocality] = useState(DEFAULT_LOCALITY);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset every piece of internal state each time the sheet opens (false -> true).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setStep('ROLE');
      setRole('BUSINESS');
      setLocality(DEFAULT_LOCALITY);
      setCoords(null);
      setPhone('');
      setName('');
      setOtp('');
      setDevOtp(null);
      setResendIn(0);
      setError(null);
      setSending(false);
      setLoading(false);
    }
  }

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const requestOtp = async (
    targetPhone: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone }),
      });
      if (res.status === 429) {
        return {
          ok: false,
          error: lang === 'hi'
            ? 'कृपया दोबारा कोड मांगने से पहले थोड़ा इंतज़ार करें'
            : 'Please wait before requesting another code',
        };
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        return {
          ok: false,
          error: typeof data.error === 'string' && data.error
            ? data.error
            : (lang === 'hi' ? 'OTP भेजने में विफल। कृपया पुनः प्रयास करें' : 'Could not send the code. Please try again.'),
        };
      }
      // Dev-only hint: the server returns dev_otp solely in dev mode.
      setDevOtp(typeof data.dev_otp === 'string' ? data.dev_otp : null);
      setResendIn(RESEND_COOLDOWN_SECONDS);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: lang === 'hi' ? 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें' : 'Network error. Please try again.',
      };
    }
  };

  const handleRoleSubmit = (selectedRole: 'WORKER' | 'BUSINESS') => {
    setRole(selectedRole);
    setStep('LOCATION');
  };

  const handleLocationSubmit = (area: string) => {
    setLocality(area);
    setCoords(null);
    setStep('PHONE');
  };

  const handleUseGps = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setStep('PHONE');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocality(lang === 'hi' ? 'वर्तमान GPS स्थान' : 'Current GPS Location');
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setStep('PHONE');
      },
      () => {
        setStep('PHONE');
      }
    );
  };

  const handleSendPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!PHONE_PATTERN.test(phone)) {
      setError(lang === 'hi' ? 'कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setSending(true);
    const result = await requestOtp(phone);
    setSending(false);
    if (result.ok) {
      setOtp('');
      setStep('OTP');
    } else {
      setError(result.error);
    }
  };

  const handleResend = async () => {
    if (sending || resendIn > 0) return;
    setError(null);
    setSending(true);
    const result = await requestOtp(phone);
    setSending(false);
    if (!result.ok) setError(result.error);
  };

  const handleChangeNumber = () => {
    setStep('PHONE');
    setOtp('');
    setDevOtp(null);
    setResendIn(0);
    setError(null);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const result = await onCompleteOnboarding({
        phone,
        otp,
        role,
        name: name.trim() || (role === 'WORKER' ? 'Worker User' : 'Customer'),
        locality,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      if (!result.ok) {
        setError(result.error || (lang === 'hi' ? 'अमान्य OTP' : 'Invalid OTP code'));
      }
    } catch {
      setError(lang === 'hi' ? 'कुछ गलत हो गया। कृपया पुनः प्रयास करें' : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendLabel =
    resendIn > 0
      ? lang === 'hi' ? `दोबारा भेजें (${resendIn}s)` : `Resend code (${resendIn}s)`
      : lang === 'hi' ? 'कोड दोबारा भेजें' : 'Resend code';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="KaamSetu"
      subtitle={lang === 'hi' ? 'स्थानीय काम और कामगारों का भरोसेमंद सेतु' : 'Connecting local work with local workers'}
      maxHeight="92vh"
      closeLabel={lang === 'hi' ? 'बंद करें' : 'Close'}
    >
      {error && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--brand-danger-subtle)',
            border: '1px solid var(--brand-danger)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--brand-danger)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '14px',
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: What are you here for? */}
      {step === 'ROLE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {lang === 'hi' ? 'आप कामसेतु पर क्या करना चाहते हैं?' : 'What are you here for?'}
          </div>

          <button
            type="button"
            onClick={() => handleRoleSubmit('BUSINESS')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px 14px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--brand-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Briefcase size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {lang === 'hi' ? 'मुझे काम करवाना है (Customer)' : 'I need someone to work'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {lang === 'hi' ? 'बिजली मिस्त्री, प्लंबर, पेंटर, सफाई या हेल्पर चाहिए' : 'Hire electricians, plumbers, cleaners, painters & helpers'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSubmit('WORKER')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px 14px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--brand-accent)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {lang === 'hi' ? 'मुझे काम चाहिए (Worker)' : 'I am looking for work'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {lang === 'hi' ? 'रोजगार, दिहाड़ी काम और पास के ग्राहकों से सीधे जुड़ें' : 'Get daily work, direct payment, and nearby job notifications'}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* STEP 2: Where are you? */}
      {step === 'LOCATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {lang === 'hi' ? 'आप अभी कहाँ हैं?' : 'Where are you located?'}
          </div>

          <button
            type="button"
            onClick={handleUseGps}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px',
              backgroundColor: 'var(--brand-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Navigation size={18} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                {lang === 'hi' ? 'वर्तमान GPS स्थान का उपयोग करें' : 'Use Current Location'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                {lang === 'hi' ? 'सटीक 5 किमी के कामगारों को खोजने के लिए' : 'For accurate nearby worker and job discovery'}
              </div>
            </div>
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {lang === 'hi' ? 'या प्रमुख क्षेत्र चुनें:' : 'Or choose your area:'}
            </div>
            {['Ranjit Avenue, Amritsar', 'Lawrence Road, Amritsar', 'Mall Road, Amritsar', 'Hall Bazaar, Amritsar'].map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => handleLocationSubmit(area)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <MapPin size={14} color="var(--brand-accent)" />
                <span>{area}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Phone Number & Name */}
      {step === 'PHONE' && (
        <form onSubmit={handleSendPhone} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {lang === 'hi' ? 'मोबाइल नंबर से आगे बढ़ें' : 'Enter your mobile number'}
          </div>

          <div>
            <label htmlFor="onboarding-name" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {lang === 'hi' ? 'आपका नाम' : 'Your Name'}
            </label>
            <input
              id="onboarding-name"
              type="text"
              placeholder={role === 'WORKER' ? 'e.g. Rahul Kumar' : 'e.g. Anita Sharma'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label htmlFor="onboarding-phone" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
            </label>
            <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <span style={{ padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                +91
              </span>
              <input
                id="onboarding-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                autoFocus
                required
                aria-invalid={error ? true : undefined}
                style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: '0.92rem', fontWeight: 600 }}
              />
            </div>
          </div>

          <button type="submit" disabled={sending} className="btn btn-primary" style={{ marginTop: '4px', minHeight: '44px' }}>
            <span>
              {sending
                ? (lang === 'hi' ? 'OTP भेजा जा रहा है...' : 'Sending code...')
                : (lang === 'hi' ? 'OTP प्राप्त करें →' : 'Continue with OTP →')}
            </span>
          </button>
        </form>
      )}

      {/* STEP 4: OTP */}
      {step === 'OTP' && (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {lang === 'hi' ? 'OTP दर्ज करें' : 'Enter the verification code'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {lang === 'hi' ? `+91 ${phone} पर भेजा गया` : `Sent to +91 ${phone}`}
            </div>
            {devOtp && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {`Dev mode code: ${devOtp}`}
              </div>
            )}
          </div>

          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={lang === 'hi' ? 'OTP कोड' : 'Verification code'}
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            autoFocus
            required
            style={{
              width: '180px',
              margin: '0 auto',
              padding: '12px',
              fontSize: '1.6rem',
              fontWeight: 800,
              textAlign: 'center',
              letterSpacing: '10px',
              border: '1.5px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
            }}
          />

          <button
            type="submit"
            disabled={loading || otp.length < 4}
            className="btn btn-primary"
            style={{ minHeight: '44px' }}
          >
            <span>
              {loading
                ? (lang === 'hi' ? 'सत्यापित कर रहे हैं...' : 'Verifying...')
                : (lang === 'hi' ? 'लॉगिन पूर्ण करें ✓' : 'Verify & Enter KaamSetu ✓')}
            </span>
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleResend}
              disabled={sending || resendIn > 0}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: sending || resendIn > 0 ? 'var(--text-muted)' : 'var(--brand-primary)',
                cursor: sending || resendIn > 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {resendLabel}
            </button>
            <button
              type="button"
              onClick={handleChangeNumber}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {lang === 'hi' ? 'नंबर बदलें' : 'Change number'}
            </button>
          </div>
        </form>
      )}
    </BottomSheet>
  );
};
