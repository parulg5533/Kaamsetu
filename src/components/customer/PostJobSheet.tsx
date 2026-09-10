'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Zap,
  Sparkles,
  Paintbrush,
  Truck,
  Hammer,
  Utensils,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Check,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  AlertCircle,
  Radio,
  Plus,
  Minus,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { BottomSheet, Button, Badge, Input, Textarea } from '@/components/ui';

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface PostJobSheetProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  skillsList: Skill[];
  onSubmit: (formData: any) => void;
  loading: boolean;
  preSelectedSkillId?: string;
  preSelectedWorkerName?: string;
  userLocality?: string;
  userCoordinates?: { latitude: number; longitude: number } | null;
}

interface TradeOption {
  key: string;
  nameEn: string;
  nameHi: string;
  subEn: string;
  subHi: string;
  icon: React.ReactNode;
  iconClass: string;
  defaultWage: number;
}

const TRADE_OPTIONS: TradeOption[] = [
  {
    key: 'plumber',
    nameEn: 'Plumbing',
    nameHi: 'नल मिस्त्री',
    subEn: 'Pipes, taps & leakage',
    subHi: 'पाइप व नल रिपेयर',
    icon: <Wrench size={22} />,
    iconClass: 'service-icon-plumber',
    defaultWage: 650,
  },
  {
    key: 'electrician',
    nameEn: 'Electrician',
    nameHi: 'बिजली मिस्त्री',
    subEn: 'Wiring, fan & switches',
    subHi: 'वायरिंग व पंखा',
    icon: <Zap size={22} />,
    iconClass: 'service-icon-electrician',
    defaultWage: 650,
  },
  {
    key: 'cleaner',
    nameEn: 'Cleaning',
    nameHi: 'सफाई / हेल्पर',
    subEn: 'House & shop deep clean',
    subHi: 'घर व दुकान सफाई',
    icon: <Sparkles size={22} />,
    iconClass: 'service-icon-cleaning',
    defaultWage: 500,
  },
  {
    key: 'painter',
    nameEn: 'Painting',
    nameHi: 'पेंटर व पुताई',
    subEn: 'Whitewash & color',
    subHi: 'पुताई व डिस्टेंपर',
    icon: <Paintbrush size={22} />,
    iconClass: 'service-icon-painter',
    defaultWage: 700,
  },
  {
    key: 'helper',
    nameEn: 'Loading / Shifting',
    nameHi: 'लोडिंग व शिफ्ट',
    subEn: 'Heavy goods & labor',
    subHi: 'सामान उठाना व ले जाना',
    icon: <Truck size={22} />,
    iconClass: 'service-icon-helper',
    defaultWage: 600,
  },
  {
    key: 'carpenter',
    nameEn: 'Carpenter',
    nameHi: 'बढ़ई / मिस्त्री',
    subEn: 'Wood & furniture',
    subHi: 'लकड़ी व फर्नीचर',
    icon: <Hammer size={22} />,
    iconClass: 'service-icon-carpenter',
    defaultWage: 750,
  },
  {
    key: 'hospitality',
    nameEn: 'Cook / Kitchen',
    nameHi: 'रसोई व सहायक',
    subEn: 'Cooking & kitchen help',
    subHi: 'खाना व रसोई हेल्पर',
    icon: <Utensils size={22} />,
    iconClass: 'service-icon-hospitality',
    defaultWage: 600,
  },
  {
    key: 'other',
    nameEn: 'General Helper',
    nameHi: 'जनरल हेल्पर',
    subEn: 'Day labor & odd jobs',
    subHi: 'दैनिक सहायक व अन्य काम',
    icon: <Briefcase size={22} />,
    iconClass: 'service-icon-all',
    defaultWage: 500,
  },
];

const POPULAR_LOCALITIES = [
  'Lawrence Road',
  'Ranjit Avenue',
  'Majitha Road',
  'Mall Road',
  'Civil Lines',
  'Putlighar',
];

export const PostJobSheet: React.FC<PostJobSheetProps> = ({
  lang,
  isOpen,
  onClose,
  skillsList,
  onSubmit,
  loading,
  preSelectedSkillId,
  preSelectedWorkerName,
  userLocality = 'Lawrence Road, Amritsar',
  userCoordinates,
}) => {
  const t = translations[lang];

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // 5 Step State
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Work Type
  const [selectedTradeKey, setSelectedTradeKey] = useState<string>('electrician');
  const [skillId, setSkillId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');

  // Step 2: Location
  const [locality, setLocality] = useState<string>(userLocality);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(true);
  const [specificAddress, setSpecificAddress] = useState<string>('');

  // Step 3: Date & Timing
  const [timingChoice, setTimingChoice] = useState<'TODAY' | 'TOMORROW' | 'CUSTOM'>('TODAY');
  const [jobDate, setJobDate] = useState<string>(todayStr);
  const [shiftType, setShiftType] = useState<'MORNING' | 'FULL_DAY' | 'EVENING'>('FULL_DAY');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('18:00');

  // Step 4: Daily Wage & Worker Count
  const [wage, setWage] = useState<number>(650);
  const [isCustomWage, setIsCustomWage] = useState<boolean>(false);
  const [workersRequired, setWorkersRequired] = useState<number>(1);

  // Step 5: Add-ons & Extra Needs
  const [foodProvided, setFoodProvided] = useState<boolean>(true);
  const [materialsProvided, setMaterialsProvided] = useState<boolean>(true);
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Match selected trade to backend skillId
  useEffect(() => {
    if (skillsList.length > 0) {
      if (preSelectedSkillId) {
        setSkillId(preSelectedSkillId);
        const match = skillsList.find((s) => s.id === preSelectedSkillId);
        if (match) {
          const lower = match.name.toLowerCase();
          const found = TRADE_OPTIONS.find((t) => lower.includes(t.key));
          if (found) setSelectedTradeKey(found.key);
        }
      } else {
        const match = skillsList.find((s) => s.name.toLowerCase().includes(selectedTradeKey));
        setSkillId(match ? match.id : skillsList[0].id);
      }
    }
  }, [skillsList, preSelectedSkillId, selectedTradeKey]);

  // When timing choice changes
  const handleTimingSelect = (choice: 'TODAY' | 'TOMORROW' | 'CUSTOM') => {
    setTimingChoice(choice);
    if (choice === 'TODAY') setJobDate(todayStr);
    else if (choice === 'TOMORROW') setJobDate(tomorrowStr);
  };

  // When shift choice changes
  const handleShiftSelect = (shift: 'MORNING' | 'FULL_DAY' | 'EVENING') => {
    setShiftType(shift);
    if (shift === 'MORNING') {
      setStartTime('09:00');
      setEndTime('14:00');
    } else if (shift === 'FULL_DAY') {
      setStartTime('09:00');
      setEndTime('18:00');
    } else if (shift === 'EVENING') {
      setStartTime('14:00');
      setEndTime('20:00');
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trade = TRADE_OPTIONS.find((t) => t.key === selectedTradeKey);
    const finalTitle =
      customTitle.trim() ||
      (lang === 'hi' ? `${trade?.nameHi || 'वर्कर'} चाहिए` : `${trade?.nameEn || 'Worker'} Needed`);

    const fullLocality = specificAddress.trim()
      ? `${specificAddress.trim()}, ${locality}`
      : locality;

    const fullDescription = [
      notes.trim(),
      materialsProvided ? (lang === 'hi' ? 'सामान उपलब्ध है' : 'Materials provided') : '',
      isUrgent ? (lang === 'hi' ? 'तुरंत चाहिए' : 'Urgent request') : '',
    ]
      .filter(Boolean)
      .join(' · ');

    onSubmit({
      skill_id: skillId || (skillsList[0]?.id || 'skill-1'),
      title: finalTitle,
      description: fullDescription,
      workers_required: workersRequired,
      wage,
      food_provided: foodProvided,
      job_date: jobDate,
      start_time: startTime,
      end_time: endTime,
      locality: fullLocality,
      latitude: userCoordinates?.latitude,
      longitude: userCoordinates?.longitude,
    });
  };

  const currentTrade = TRADE_OPTIONS.find((t) => t.key === selectedTradeKey);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{t.postJobTitle}</span>
          <Badge variant="primary">Step {step} of 5</Badge>
        </div>
      }
      subtitle={
        preSelectedWorkerName
          ? lang === 'hi'
            ? `${preSelectedWorkerName} के लिए जॉब पोस्ट`
            : `Request for ${preSelectedWorkerName}`
          : lang === 'hi'
          ? 'स्थानीय कामगारों के लिए 60 सेकंड में पोस्ट करें'
          : 'Reach nearby verified workers in 60s'
      }
    >
      <div className="wizard-steps-container">
        {/* 5-Segment Progress Bar */}
        <div className="wizard-progress-bar">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`wizard-progress-segment ${
                s === step ? 'active' : s < step ? 'completed' : ''
              }`}
            />
          ))}
        </div>

        {/* STEP 1: AAPKO KIS KAAM KE LIYE WORKER CHAHIYE? */}
        {step === 1 && (
          <div className="wizard-step-body">
            <div className="wizard-header-prompt">
              <span className="wizard-step-badge">Step 1</span>
              <h3 className="wizard-question">{t.step1Title}</h3>
              <p className="wizard-question-sub">{t.step1Sub}</p>
            </div>

            <div className="trade-choice-grid">
              {TRADE_OPTIONS.map((opt) => {
                const isSelected = selectedTradeKey === opt.key;
                return (
                  <div
                    key={opt.key}
                    className={`trade-choice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedTradeKey(opt.key);
                      setWage(opt.defaultWage);
                      const matchedSkill = skillsList.find((s) =>
                        s.name.toLowerCase().includes(opt.key)
                      );
                      if (matchedSkill) setSkillId(matchedSkill.id);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {isSelected && (
                      <div className="trade-card-selected-check">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                    <div className={`service-icon-container ${opt.iconClass}`}>
                      {opt.icon}
                    </div>
                    <div className="trade-choice-name">
                      {lang === 'hi' ? opt.nameHi : opt.nameEn}
                    </div>
                    <div className="trade-choice-sub">
                      {lang === 'hi' ? opt.subHi : opt.subEn}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '12px' }}>
              <Input
                label={lang === 'hi' ? 'काम का विवरण / शीर्षक (ऐच्छिक)' : 'Job Title / Specific Task (Optional)'}
                placeholder={
                  lang === 'hi'
                    ? 'जैसे: पंखा रिपेयर या 2 कमरों की पुताई'
                    : 'e.g., Ceiling fan repair or 2-room painting'
                }
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 2: KAAM KAHAN HAI? */}
        {step === 2 && (
          <div className="wizard-step-body">
            <div className="wizard-header-prompt">
              <span className="wizard-step-badge">Step 2</span>
              <h3 className="wizard-question">{t.step2Title}</h3>
              <p className="wizard-question-sub">{t.step2Sub}</p>
            </div>

            {/* Option A: Use Current Location (GPS) */}
            <div
              className={`gps-location-btn ${isGpsActive ? 'active' : ''}`}
              onClick={() => {
                setIsGpsActive(true);
                setLocality(userLocality);
              }}
              role="button"
              tabIndex={0}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                  }}
                >
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>
                    {t.useCurrentLocation}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#34d399' }}>
                    ✓ {userLocality || 'Amritsar Central'}
                  </div>
                </div>
              </div>
              <Badge variant="success">GPS</Badge>
            </div>

            {/* Option B: Popular Localities */}
            <div style={{ marginTop: '14px' }}>
              <label className="ui-field-label">
                {lang === 'hi' ? 'या प्रमुख इलाका चुनें' : 'Or select popular locality'}
              </label>
              <div className="locality-chips-wrapper">
                {POPULAR_LOCALITIES.map((loc) => {
                  const isSelected = locality === loc && !isGpsActive;
                  return (
                    <button
                      key={loc}
                      type="button"
                      className={`locality-select-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setLocality(loc);
                        setIsGpsActive(false);
                      }}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific Landmark / House */}
            <div style={{ marginTop: '14px' }}>
              <Input
                label={lang === 'hi' ? 'लैंडमार्क / गली / मकान नं.' : 'Landmark / Street / House No.'}
                placeholder={
                  lang === 'hi'
                    ? 'जैसे: नियर नोवेल्टी मॉल, गली नं. 3'
                    : 'e.g., Near Novelty Mall, Street No. 3'
                }
                value={specificAddress}
                onChange={(e) => setSpecificAddress(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 3: KAB CHAHIYE? */}
        {step === 3 && (
          <div className="wizard-step-body">
            <div className="wizard-header-prompt">
              <span className="wizard-step-badge">Step 3</span>
              <h3 className="wizard-question">{t.step3Title}</h3>
              <p className="wizard-question-sub">{t.step3Sub}</p>
            </div>

            <div className="timing-choice-grid">
              {/* Today */}
              <div
                className={`timing-choice-card ${timingChoice === 'TODAY' ? 'selected' : ''}`}
                onClick={() => handleTimingSelect('TODAY')}
                role="button"
                tabIndex={0}
              >
                <div style={{ fontSize: '1.2rem' }}>⚡</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t.today}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Immediate</div>
              </div>

              {/* Tomorrow */}
              <div
                className={`timing-choice-card ${timingChoice === 'TOMORROW' ? 'selected' : ''}`}
                onClick={() => handleTimingSelect('TOMORROW')}
                role="button"
                tabIndex={0}
              >
                <div style={{ fontSize: '1.2rem' }}>📅</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t.tomorrow}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Next day</div>
              </div>

              {/* Custom Date */}
              <div
                className={`timing-choice-card ${timingChoice === 'CUSTOM' ? 'selected' : ''}`}
                onClick={() => handleTimingSelect('CUSTOM')}
                role="button"
                tabIndex={0}
              >
                <div style={{ fontSize: '1.2rem' }}>🗓️</div>
                <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>{t.chooseDate}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pick date</div>
              </div>
            </div>

            {timingChoice === 'CUSTOM' && (
              <div style={{ marginTop: '12px' }}>
                <Input
                  type="date"
                  min={todayStr}
                  value={jobDate}
                  onChange={(e) => setJobDate(e.target.value)}
                />
              </div>
            )}

            {/* Shift Timings */}
            <div style={{ marginTop: '14px' }}>
              <label className="ui-field-label">
                {lang === 'hi' ? 'काम का समय / शिफ्ट' : 'Working Shift & Hours'}
              </label>
              <div className="shift-chips-row">
                <div
                  className={`shift-select-card ${shiftType === 'FULL_DAY' ? 'selected' : ''}`}
                  onClick={() => handleShiftSelect('FULL_DAY')}
                  role="button"
                  tabIndex={0}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                      {lang === 'hi' ? 'पूरा दिन (Full Day)' : 'Full Day (8 Hours)'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>09:00 AM - 06:00 PM</div>
                  </div>
                  <Badge variant="default">8 hrs</Badge>
                </div>

                <div
                  className={`shift-select-card ${shiftType === 'MORNING' ? 'selected' : ''}`}
                  onClick={() => handleShiftSelect('MORNING')}
                  role="button"
                  tabIndex={0}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                      {lang === 'hi' ? 'सुबह की शिफ्ट (Morning)' : 'Morning Shift (5 Hours)'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>09:00 AM - 02:00 PM</div>
                  </div>
                  <Badge variant="default">5 hrs</Badge>
                </div>

                <div
                  className={`shift-select-card ${shiftType === 'EVENING' ? 'selected' : ''}`}
                  onClick={() => handleShiftSelect('EVENING')}
                  role="button"
                  tabIndex={0}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                      {lang === 'hi' ? 'शाम की शिफ्ट (Evening)' : 'Evening Shift (6 Hours)'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>02:00 PM - 08:00 PM</div>
                  </div>
                  <Badge variant="default">6 hrs</Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: KITNE PAISE DENGE? */}
        {step === 4 && (
          <div className="wizard-step-body">
            <div className="wizard-header-prompt">
              <span className="wizard-step-badge">Step 4</span>
              <h3 className="wizard-question">{t.step4Title}</h3>
              <p className="wizard-question-sub">{t.step4Sub}</p>
            </div>

            {/* Quick Wage Preset Chips */}
            <div className="wage-presets-grid">
              {[500, 650, 800, 1000].map((amount) => {
                const isSelected = wage === amount && !isCustomWage;
                return (
                  <button
                    key={amount}
                    type="button"
                    className={`wage-preset-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setWage(amount);
                      setIsCustomWage(false);
                    }}
                  >
                    <span style={{ fontSize: '1.05rem', fontWeight: 900 }}>₹{amount}</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>
                      {amount === 500
                        ? lang === 'hi' ? 'हेल्पर' : 'Helper'
                        : amount === 650
                        ? lang === 'hi' ? 'मिस्त्री' : 'Standard'
                        : amount === 800
                        ? lang === 'hi' ? 'कारीगर' : 'Skilled'
                        : lang === 'hi' ? 'स्पेशलिस्ट' : 'Heavy'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Wage Toggle */}
            <div style={{ marginTop: '10px' }}>
              {!isCustomWage ? (
                <button
                  type="button"
                  onClick={() => setIsCustomWage(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fbbf24',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + {lang === 'hi' ? 'अन्य दिहाड़ी राशि भरें (Custom)' : 'Enter custom wage amount'}
                </button>
              ) : (
                <Input
                  type="number"
                  step={50}
                  min={300}
                  label={t.dailyWageOffer}
                  value={wage}
                  onChange={(e) => setWage(Number(e.target.value))}
                />
              )}
            </div>

            {/* Workers Required Counter */}
            <div style={{ marginTop: '16px' }}>
              <label className="ui-field-label">{t.workersNeeded}</label>
              <div className="workers-count-stepper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setWorkersRequired((prev) => Math.max(1, prev - 1))}
                    disabled={workersRequired <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>
                    {workersRequired}
                  </span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setWorkersRequired((prev) => Math.min(10, prev + 1))}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {lang === 'hi' ? 'कुल भुगतान' : 'Total payout'}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#34d399' }}>
                    ₹{wage * workersRequired}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: NEED ANYTHING ELSE? (FINAL REVIEW & PSYCHOLOGICAL TRIGGER) */}
        {step === 5 && (
          <div className="wizard-step-body">
            <div className="wizard-header-prompt">
              <span className="wizard-step-badge">Step 5</span>
              <h3 className="wizard-question">{t.step5Title}</h3>
              <p className="wizard-question-sub">{t.step5Sub}</p>
            </div>

            {/* 3 Interactive Requirement Cards */}
            <div className="addon-requirements-list">
              {/* Food Provided */}
              <div
                className={`addon-requirement-card ${foodProvided ? 'selected' : ''}`}
                onClick={() => setFoodProvided(!foodProvided)}
                role="button"
                tabIndex={0}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="addon-checkbox">
                    {foodProvided && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                      {t.provideFood}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {lang === 'hi'
                        ? 'खाना मिलने पर कामगार तेजी से आवेदन करते हैं'
                        : 'Workers apply faster when meals are provided'}
                    </div>
                  </div>
                </div>
                <Badge variant="success">
                  {foodProvided ? (lang === 'hi' ? 'हाँ' : 'Yes') : (lang === 'hi' ? 'नहीं' : 'No')}
                </Badge>
              </div>

              {/* Materials Provided */}
              <div
                className={`addon-requirement-card ${materialsProvided ? 'selected' : ''}`}
                onClick={() => setMaterialsProvided(!materialsProvided)}
                role="button"
                tabIndex={0}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="addon-checkbox">
                    {materialsProvided && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                      {t.materialsProvided}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {lang === 'hi'
                        ? 'काम का सामान या टूल्स ग्राहक देंगे'
                        : 'Customer will supply repair parts / materials'}
                    </div>
                  </div>
                </div>
                <Badge variant="info">
                  {materialsProvided ? (lang === 'hi' ? 'हाँ' : 'Yes') : (lang === 'hi' ? 'नहीं' : 'No')}
                </Badge>
              </div>

              {/* Urgent Requirement */}
              <div
                className={`addon-requirement-card ${isUrgent ? 'selected' : ''}`}
                onClick={() => setIsUrgent(!isUrgent)}
                role="button"
                tabIndex={0}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="addon-checkbox">
                    {isUrgent && <Check size={14} strokeWidth={3} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                      {t.urgentRequirement}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {lang === 'hi'
                        ? 'वर्कर लिस्ट में सबसे ऊपर दिखेगा'
                        : 'Prioritized at the top of worker job feed'}
                    </div>
                  </div>
                </div>
                <Badge variant="warning">
                  {isUrgent ? (lang === 'hi' ? 'हाँ' : 'Yes') : (lang === 'hi' ? 'नहीं' : 'No')}
                </Badge>
              </div>
            </div>

            {/* Summary Box Preview */}
            <div className="post-job-summary-box">
              <div className="summary-item-row">
                <span>{lang === 'hi' ? 'काम' : 'Work'}:</span>
                <strong>{lang === 'hi' ? currentTrade?.nameHi : currentTrade?.nameEn}</strong>
              </div>
              <div className="summary-item-row">
                <span>{lang === 'hi' ? 'स्थान' : 'Location'}:</span>
                <strong>{locality}</strong>
              </div>
              <div className="summary-item-row">
                <span>{lang === 'hi' ? 'तारीख व समय' : 'Date & Time'}:</span>
                <strong>
                  {timingChoice === 'TODAY' ? t.today : timingChoice === 'TOMORROW' ? t.tomorrow : jobDate} · {startTime} - {endTime}
                </strong>
              </div>
              <div className="summary-item-row">
                <span>{lang === 'hi' ? 'दिहाड़ी' : 'Offer'}:</span>
                <strong style={{ color: '#fbbf24' }}>
                  ₹{wage}/{lang === 'hi' ? 'दिन' : 'day'} ({workersRequired} {lang === 'hi' ? 'वर्कर' : 'worker'})
                </strong>
              </div>
            </div>

            {/* PSYCHOLOGICAL TRUST NOTIFICATION TRIGGER */}
            <div className="workers-notified-banner">
              <span className="beacon-pulse-dot" />
              <span>{t.workersNearbyNotified}</span>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="wizard-nav-footer">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              leftIcon={<ArrowLeft size={16} />}
              onClick={handleBack}
            >
              {t.previousStep}
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="lg" onClick={onClose}>
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </Button>
          )}

          {step < 5 ? (
            <Button
              type="button"
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight size={16} />}
              onClick={handleNext}
            >
              {t.nextStep}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              leftIcon={<Zap size={18} />}
              onClick={handleFinalSubmit}
              isLoading={loading}
            >
              {t.submitJob}
            </Button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
