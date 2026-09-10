'use client';

import React, { useState } from 'react';
import { User, Briefcase, Navigation, MapPin, X, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Language } from '@/lib/translations';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onCompleteOnboarding: (userData: {
    role: 'WORKER' | 'BUSINESS';
    phone: string;
    name: string;
    locality: string;
    otp: string;
  }) => Promise<boolean>;
  isDemoMode?: boolean;
  onSelectDemoPersona?: (personaId: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  lang,
  onCompleteOnboarding,
  isDemoMode,
  onSelectDemoPersona,
}) => {
  const [step, setStep] = useState<'ROLE' | 'LOCATION' | 'PHONE' | 'OTP'>('ROLE');
  const [role, setRole] = useState<'WORKER' | 'BUSINESS'>('BUSINESS');
  const [locality, setLocality] = useState('Ranjit Avenue, Amritsar');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRoleSubmit = (selectedRole: 'WORKER' | 'BUSINESS') => {
    setRole(selectedRole);
    setStep('LOCATION');
  };

  const handleLocationSubmit = (locName?: string) => {
    if (locName) setLocality(locName);
    setStep('PHONE');
  };

  const handleUseGps = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocality('Current GPS Location');
          setStep('PHONE');
        },
        () => {
          setStep('PHONE');
        }
      );
    } else {
      setStep('PHONE');
    }
  };

  const handleSendPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError(lang === 'hi' ? 'कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setStep('OTP');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const success = await onCompleteOnboarding({
        role,
        phone,
        name: name || (role === 'WORKER' ? 'Worker User' : 'Customer'),
        locality,
        otp,
      });
      if (!success) {
        setError(lang === 'hi' ? 'अमान्य OTP' : 'Invalid OTP code');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true">
      <div className="sheet-window" style={{ maxWidth: '440px', padding: '24px 20px', margin: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              KaamSetu
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {lang === 'hi' ? 'स्थानीय काम और कामगारों का भरोसेमंद सेतु' : 'Connecting local work with local workers'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {lang === 'hi' ? 'आपका नाम' : 'Your Name'}
              </label>
              <input
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
              </label>
              <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <span style={{ padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                  style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: '0.92rem', fontWeight: 600 }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '4px', minHeight: '44px' }}>
              <span>{lang === 'hi' ? 'OTP प्राप्त करें →' : 'Continue with OTP →'}</span>
            </button>
          </form>
        )}

        {/* STEP 4: 4-Digit OTP */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {lang === 'hi' ? 'OTP दर्ज करें' : 'Enter 4-Digit OTP'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {lang === 'hi' ? `+91 ${phone} पर भेजा गया (Test OTP: 1234)` : `Sent to +91 ${phone} (Test OTP: 1234)`}
              </div>
            </div>

            <input
              type="text"
              maxLength={4}
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
              <span>{loading ? (lang === 'hi' ? 'सत्यापित कर रहे हैं...' : 'Verifying...') : (lang === 'hi' ? 'लॉगिन पूर्ण करें ✓' : 'Verify & Enter KaamSetu ✓')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
