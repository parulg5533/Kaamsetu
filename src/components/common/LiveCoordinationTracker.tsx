'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  MapPin,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  QrCode,
  Zap,
  Star,
  Banknote,
  ArrowRight,
  Sparkles,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { Card, Badge, Button, Input } from '@/components/ui';

export type CoordinationStage =
  | 'MATCHING'
  | 'ACCEPTED_EN_ROUTE'
  | 'IN_PROGRESS'
  | 'WORK_COMPLETED_PENDING_PAYMENT'
  | 'SETTLED_REVIEW';

export interface ActiveCoordinationJob {
  jobId: string;
  title: string;
  locality: string;
  wage: number;
  distanceKm: number;
  stage: CoordinationStage;
  counterpartId: string;
  counterpartName: string;
  counterpartPhone: string | null;
  counterpartTrade?: string;
  startOtp: string; // e.g. "7821"
  startTime?: string;
  isWorkerConfirmed?: boolean;
  isCustomerConfirmed?: boolean;
}

interface LiveCoordinationTrackerProps {
  lang: Language;
  userRole: 'CUSTOMER' | 'WORKER';
  activeJob: ActiveCoordinationJob | null;
  onVerifyOtp: (enteredOtp: string) => boolean;
  onWorkerFinishWork: () => void;
  onCustomerConfirmPayment: (paymentMode: 'UPI' | 'CASH') => void;
  onOpenRating: () => void;
  onSimulateAccept?: () => void;
  onCancel?: () => void;
}

export const LiveCoordinationTracker: React.FC<LiveCoordinationTrackerProps> = ({
  lang,
  userRole,
  activeJob,
  onVerifyOtp,
  onWorkerFinishWork,
  onCustomerConfirmPayment,
  onOpenRating,
  onSimulateAccept,
  onCancel,
}) => {
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(14);
  const [radarStep, setRadarStep] = useState(0);

  // Radar ping simulation ticker
  useEffect(() => {
    if (activeJob?.stage === 'MATCHING') {
      const interval = setInterval(() => {
        setRadarStep((prev) => (prev + 1) % 4);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [activeJob?.stage]);

  // Work in progress timer simulation
  useEffect(() => {
    if (activeJob?.stage === 'IN_PROGRESS') {
      const interval = setInterval(() => {
        setElapsedMinutes((prev) => prev + 1);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [activeJob?.stage]);

  if (!activeJob) return null;

  const t = translations[lang];

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onVerifyOtp(enteredOtp);
    if (!success) {
      setOtpError(true);
    } else {
      setOtpError(false);
      setEnteredOtp('');
    }
  };

  return (
    <div className="live-coordination-container" role="region" aria-label="Live work coordination">
      {/* ============================================================
          STAGE 1: MATCHING RADAR (Live broadcast to nearby workers)
          ============================================================ */}
      {activeJob.stage === 'MATCHING' && (
        <Card elevation="glow" className="coordination-card matching-stage">
          <div className="coordination-header">
            <div className="coordination-badge-group">
              <span className="live-pulse-beacon" />
              <span className="coordination-stage-title">
                {lang === 'hi' ? 'लाइव मैचिंग जारी है' : 'Live Matching Active'}
              </span>
            </div>
            <Badge variant="warning">
              {lang === 'hi' ? 'खोज रहे हैं...' : 'Broadcasting...'}
            </Badge>
          </div>

          <div className="matching-radar-body">
            <div className="radar-animation-circle">
              <Radio size={28} className="radar-icon-pulse" />
            </div>

            <div>
              <h4 className="radar-headline">
                {lang === 'hi'
                  ? `पास के 8 सत्यापित कामगारों को रिक्वेस्ट भेजी गई है`
                  : `Broadcasting to ~8 verified workers in ${activeJob.locality}`}
              </h4>
              <p className="radar-subline">
                {radarStep === 0 && (lang === 'hi' ? 'रंजीत एवेन्यू के 5 किमी दायरे में सिग्नल भेजा गया...' : 'Signal dispatched within 5 km radius...')}
                {radarStep === 1 && (lang === 'hi' ? 'रमेश कुमार (1.8 किमी) को नोटिफिकेशन मिला' : 'Ramesh Kumar (1.8 km) received notification')}
                {radarStep === 2 && (lang === 'hi' ? 'अमन सिंह (1.4 किमी) काम का विवरण देख रहे हैं...' : 'Aman Singh (1.4 km) viewing work details...')}
                {radarStep === 3 && (lang === 'hi' ? 'स्वीकृति की प्रतीक्षा में...' : 'Awaiting confirmation from nearby workers...')}
              </p>
            </div>
          </div>

          <div className="radar-footer">
            <div className="radar-job-summary">
              <strong>{activeJob.title}</strong> · ₹{activeJob.wage}/{lang === 'hi' ? 'दिन' : 'day'} · {activeJob.locality}
            </div>

            {onSimulateAccept && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onSimulateAccept}
                className="simulate-accept-btn"
              >
                ⚡ {lang === 'hi' ? 'वर्कर स्वीकृति देखें (Simulate)' : 'Simulate Worker Acceptance'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ============================================================
          STAGE 2: WORKER ACCEPTED & EN ROUTE (Live Location + Start OTP)
          ============================================================ */}
      {activeJob.stage === 'ACCEPTED_EN_ROUTE' && (
        <Card elevation="raised" className="coordination-card enroute-stage">
          <div className="coordination-header">
            <div className="coordination-badge-group">
              <span className="live-pulse-beacon green" />
              <span className="coordination-stage-title" style={{ color: '#34d399' }}>
                {lang === 'hi' ? 'कामगार रवाना हो चुके हैं' : 'Worker En Route · Arriving Soon'}
              </span>
            </div>
            <Badge variant="success">
              {activeJob.distanceKm} km {lang === 'hi' ? 'दूर' : 'away'}
            </Badge>
          </div>

          <div className="counterpart-card-row">
            <div className="counterpart-avatar">
              {activeJob.counterpartName.charAt(0)}
            </div>

            <div style={{ flex: 1 }}>
              <div className="counterpart-name">
                {activeJob.counterpartName}
                <ShieldCheck size={14} color="#34d399" />
              </div>
              <div className="counterpart-trade">
                {activeJob.counterpartTrade || activeJob.title}
              </div>
              <div className="counterpart-eta">
                <MapPin size={12} />
                <span>
                  {lang === 'hi'
                    ? `पहुंचने का अनुमान: ~12 मिनट (${activeJob.locality})`
                    : `Est. arrival: ~12 mins to ${activeJob.locality}`}
                </span>
              </div>
            </div>

            {activeJob.counterpartPhone && (
              <div className="quick-contact-actions">
                <a
                  href={`tel:${activeJob.counterpartPhone}`}
                  className="quick-call-btn"
                  title="Call"
                >
                  <Phone size={16} />
                </a>
                <a
                  href={`https://wa.me/91${activeJob.counterpartPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="quick-wa-btn"
                  title="WhatsApp"
                >
                  <MessageSquare size={16} />
                </a>
              </div>
            )}
          </div>

          {/* OTP VERIFICATION BOX (Customer gives, Worker enters) */}
          <div className="otp-verification-box">
            {userRole === 'CUSTOMER' ? (
              <div className="customer-otp-display">
                <div className="otp-title">
                  <KeyRound size={15} color="#fbbf24" />
                  <span>{lang === 'hi' ? 'शुरुआत का सुरक्षा OTP (Start OTP)' : 'Start Work Security OTP'}</span>
                </div>
                <div className="otp-code-digits">
                  {activeJob.startOtp.split('').map((digit, idx) => (
                    <span key={idx} className="otp-digit-box">{digit}</span>
                  ))}
                </div>
                <p className="otp-instruction">
                  {lang === 'hi'
                    ? `जब ${activeJob.counterpartName} आपके दरवाजे पर पहुंचे, तभी यह 4 अंकों का कोड उन्हें बताएं।`
                    : `Share this 4-digit code with ${activeJob.counterpartName} upon arrival to verify identity and start work.`}
                </p>
              </div>
            ) : (
              <form onSubmit={handleOtpSubmit} className="worker-otp-input-form">
                <div className="otp-title">
                  <KeyRound size={15} color="#fbbf24" />
                  <span>{lang === 'hi' ? 'ग्राहक से 4-अंकों का OTP पूछें' : 'Enter 4-Digit Customer Start OTP'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    maxLength={4}
                    className={`otp-user-input ${otpError ? 'error' : ''}`}
                    placeholder="7821"
                    value={enteredOtp}
                    onChange={(e) => {
                      setEnteredOtp(e.target.value);
                      setOtpError(false);
                    }}
                  />
                  <Button variant="primary" size="md" type="submit">
                    {lang === 'hi' ? 'काम शुरू करें ✓' : 'Verify & Start'}
                  </Button>
                </div>
                {otpError && (
                  <p className="otp-error-text">
                    {lang === 'hi' ? 'गलत OTP! ग्राहक से दोबारा पूछें।' : 'Incorrect OTP. Ask customer for the 4 digits.'}
                  </p>
                )}
              </form>
            )}
          </div>
        </Card>
      )}

      {/* ============================================================
          STAGE 3: WORK IN PROGRESS (Live Timer + Emergency Protection)
          ============================================================ */}
      {activeJob.stage === 'IN_PROGRESS' && (
        <Card elevation="glow" className="coordination-card inprogress-stage">
          <div className="coordination-header">
            <div className="coordination-badge-group">
              <span className="live-pulse-beacon amber" />
              <span className="coordination-stage-title" style={{ color: '#fbbf24' }}>
                {lang === 'hi' ? 'काम चालू है (In Progress)' : 'Work In Progress · On Site'}
              </span>
            </div>
            <Badge variant="warning">
              <Clock size={12} /> {elapsedMinutes} mins elapsed
            </Badge>
          </div>

          <div className="inprogress-content">
            <div className="inprogress-work-title">{activeJob.title}</div>
            <div className="inprogress-meta">
              <span>{activeJob.counterpartName}</span>
              <span>·</span>
              <span>₹{activeJob.wage}/{lang === 'hi' ? 'दिन' : 'day'}</span>
              <span>·</span>
              <span>{activeJob.locality}</span>
            </div>

            <div className="safety-guarantee-pill">
              <ShieldCheck size={14} color="#10b981" />
              <span>
                {lang === 'hi'
                  ? 'कामसेतु सुरक्षा कवरेज सक्रिय है'
                  : 'KaamSetu Verified Protection & Safety Active'}
              </span>
            </div>
          </div>

          <div className="inprogress-footer">
            {userRole === 'WORKER' ? (
              <Button
                variant="success"
                size="lg"
                fullWidth
                leftIcon={<CheckCircle2 size={18} />}
                onClick={onWorkerFinishWork}
              >
                {lang === 'hi' ? 'काम पूरा हुआ (Mark Finished) ✓' : 'Mark Work Finished ✓'}
              </Button>
            ) : (
              <div className="customer-waiting-prompt">
                <span className="spinner-dot" />
                <span>
                  {lang === 'hi'
                    ? `${activeJob.counterpartName} काम कर रहे हैं। पूरा होने पर सूचना मिलेगी।`
                    : `${activeJob.counterpartName} is currently working on site.`}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ============================================================
          STAGE 4: WORK COMPLETED & POST-WORK SETTLEMENT (UPI / Cash)
          ============================================================ */}
      {activeJob.stage === 'WORK_COMPLETED_PENDING_PAYMENT' && (
        <Card elevation="raised" className="coordination-card settlement-stage">
          <div className="coordination-header">
            <div className="coordination-badge-group">
              <Sparkles size={16} color="#34d399" />
              <span className="coordination-stage-title" style={{ color: '#34d399' }}>
                {lang === 'hi' ? 'काम पूरा हुआ — भुगतान करें' : 'Work Completed · Settle Payment'}
              </span>
            </div>
            <Badge variant="success">₹{activeJob.wage}</Badge>
          </div>

          <div className="settlement-body">
            <div className="settlement-amount-display">
              <span className="amount-label">{lang === 'hi' ? 'देय दिहाड़ी' : 'Total Wage'}</span>
              <span className="amount-value">₹{activeJob.wage}</span>
              <span className="amount-sub">{activeJob.counterpartName} · {activeJob.title}</span>
            </div>

            {userRole === 'CUSTOMER' ? (
              <div className="payment-options-grid">
                {/* UPI / GPay / PhonePe */}
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<QrCode size={16} />}
                  onClick={() => setShowQrModal(true)}
                  className="upi-pay-btn"
                >
                  {lang === 'hi' ? 'UPI / QR से भुगतान करें' : 'Pay via UPI / QR Code'}
                </Button>

                {/* Cash Payment */}
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<Banknote size={16} />}
                  onClick={() => onCustomerConfirmPayment('CASH')}
                >
                  {lang === 'hi' ? 'नकद दे दिया (Paid in Cash)' : 'Paid in Cash ✓'}
                </Button>
              </div>
            ) : (
              <div className="worker-payment-pending-banner">
                <Clock size={16} color="#fbbf24" />
                <span>
                  {lang === 'hi'
                    ? 'ग्राहक द्वारा भुगतान पुष्टि की प्रतीक्षा है...'
                    : 'Awaiting customer payment confirmation (UPI or Cash)...'}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ============================================================
          STAGE 5: SETTLED & MUTUAL REPUTATION BOOST
          ============================================================ */}
      {activeJob.stage === 'SETTLED_REVIEW' && (
        <Card elevation="glow" className="coordination-card review-stage">
          <div className="coordination-header">
            <div className="coordination-badge-group">
              <Star size={16} color="#fbbf24" fill="#fbbf24" />
              <span className="coordination-stage-title" style={{ color: '#fbbf24' }}>
                {lang === 'hi' ? 'भुगतान सफल · रेटिंग दें' : 'Payment Settled · Build Reputation'}
              </span>
            </div>
            <Badge variant="verified">100% Done</Badge>
          </div>

          <div className="review-prompt-body">
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 800 }}>
              {lang === 'hi'
                ? `कैसा रहा ${activeJob.counterpartName} के साथ अनुभव?`
                : `How was your experience with ${activeJob.counterpartName}?`}
            </h4>
            <p style={{ margin: '4px 0 12px 0', fontSize: '0.78rem', color: '#cbd5e1' }}>
              {lang === 'hi'
                ? 'आपकी समीक्षा से कामसेतु पर स्थानीय भरोसा और प्रतिष्ठा बनती है।'
                : 'Your feedback builds verifiable trust and reputation in the community.'}
            </p>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Star size={16} />}
              onClick={onOpenRating}
            >
              {lang === 'hi' ? 'रेटिंग और समीक्षा दें ⭐' : 'Rate & Leave Review ⭐'}
            </Button>
          </div>
        </Card>
      )}

      {/* UPI QR CODE MODAL */}
      {showQrModal && (
        <div className="ui-sheet-overlay" role="dialog" aria-modal="true">
          <div className="ui-sheet-container" style={{ maxHeight: '70vh' }}>
            <div className="ui-sheet-handle" />
            <div className="ui-sheet-header">
              <div className="ui-sheet-title-group">
                <h3 className="ui-sheet-title">
                  {lang === 'hi' ? 'UPI भुगतान' : 'Pay via UPI'}
                </h3>
                <div className="ui-sheet-subtitle">
                  {activeJob.counterpartName} · ₹{activeJob.wage}
                </div>
              </div>
              <button
                type="button"
                className="ui-sheet-close-btn"
                onClick={() => setShowQrModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="ui-sheet-body" style={{ textAlign: 'center' }}>
              {/* Visual simulated UPI QR */}
              <div className="upi-qr-display-box">
                <div className="upi-qr-frame">
                  <div className="qr-corner top-left" />
                  <div className="qr-corner top-right" />
                  <div className="qr-corner bottom-left" />
                  <div className="qr-corner bottom-right" />
                  <QrCode size={160} color="#000" />
                </div>
                <div className="upi-id-tag">
                  UPI ID: {activeJob.counterpartPhone ? `${activeJob.counterpartPhone}@upi` : 'kaamsetu.worker@okaxis'}
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href={`upi://pay?pa=kaamsetu.worker@okaxis&pn=${encodeURIComponent(
                    activeJob.counterpartName
                  )}&am=${activeJob.wage}&cu=INR`}
                  className="ui-btn ui-btn-primary ui-btn-lg ui-btn-full"
                >
                  <Zap size={16} />
                  {lang === 'hi' ? 'GPay / PhonePe / Paytm खोलें' : 'Open GPay / PhonePe App'}
                </a>

                <Button
                  variant="success"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setShowQrModal(false);
                    onCustomerConfirmPayment('UPI');
                  }}
                >
                  {lang === 'hi' ? 'भुगतान हो गया ✓' : 'I Have Transferred Payment ✓'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
