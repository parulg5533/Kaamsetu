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
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';

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

interface CategoryOption {
  key: string;
  nameEn: string;
  nameHi: string;
  icon: React.ReactNode;
  defaultWage: number;
}

const CATEGORIES: CategoryOption[] = [
  { key: 'electrician', nameEn: 'Electrician', nameHi: 'बिजली मिस्त्री', icon: <Zap size={22} />, defaultWage: 650 },
  { key: 'plumber', nameEn: 'Plumber', nameHi: 'नल मिस्त्री', icon: <Wrench size={22} />, defaultWage: 650 },
  { key: 'cleaner', nameEn: 'Cleaning Helper', nameHi: 'सफाई कर्मी', icon: <Sparkles size={22} />, defaultWage: 500 },
  { key: 'painter', nameEn: 'Painter', nameHi: 'पेंटर व पुताई', icon: <Paintbrush size={22} />, defaultWage: 700 },
  { key: 'carpenter', nameEn: 'Carpenter', nameHi: 'बढ़ई / मिस्त्री', icon: <Hammer size={22} />, defaultWage: 750 },
  { key: 'helper', nameEn: 'Labour / Shifting', nameHi: 'मजदूर व लोडिंग', icon: <Truck size={22} />, defaultWage: 600 },
  { key: 'hospitality', nameEn: 'Cook & Kitchen', nameHi: 'रसोइया व सहायक', icon: <Utensils size={22} />, defaultWage: 650 },
  { key: 'general', nameEn: 'General Helper', nameHi: 'सामान्य सहायक', icon: <Briefcase size={22} />, defaultWage: 550 },
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
  userLocality = 'Amritsar',
  userCoordinates,
}) => {
  const [step, setStep] = useState<number>(1);
  const t = translations[lang];

  // Wizard States
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('electrician');
  const [jobTitle, setJobTitle] = useState<string>('Electrician');
  const [description, setDescription] = useState<string>('');
  const [locality, setLocality] = useState<string>(userLocality);
  const [dateOption, setDateOption] = useState<'TODAY' | 'TOMORROW' | 'CUSTOM'>('TODAY');
  const [customDate, setCustomDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [shiftTiming, setShiftTiming] = useState<string>('09:00 - 18:00');
  const [wage, setWage] = useState<number>(650);
  const [workersRequired, setWorkersRequired] = useState<number>(1);
  const [foodProvided, setFoodProvided] = useState<boolean>(false);

  // Sync initial category or locality
  useEffect(() => {
    if (userLocality) setLocality(userLocality);
  }, [userLocality]);

  useEffect(() => {
    if (preSelectedSkillId && skillsList.length > 0) {
      const match = skillsList.find((s) => s.id === preSelectedSkillId);
      if (match) {
        setJobTitle(match.name);
      }
    }
  }, [preSelectedSkillId, skillsList]);

  if (!isOpen) return null;

  const handleSelectCategory = (cat: CategoryOption) => {
    setSelectedCategoryKey(cat.key);
    setJobTitle(lang === 'hi' ? cat.nameHi : cat.nameEn);
    setWage(cat.defaultWage);
    setStep(2);
  };

  const handleFinalSubmit = () => {
    // Find skill ID from DB list or fallback to first
    const matchedSkill =
      skillsList.find((s) => s.name.toLowerCase().includes(selectedCategoryKey)) ||
      skillsList[0] ||
      { id: 'skill-general' };

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const finalDate = dateOption === 'TODAY' ? todayStr : dateOption === 'TOMORROW' ? tomorrowStr : customDate;

    const [startTimeStr, endTimeStr] = shiftTiming.split(' - ');

    const payload = {
      skill_id: matchedSkill.id,
      title: jobTitle,
      description: description || `${jobTitle} needed at ${locality}`,
      workers_required: workersRequired,
      wage: Number(wage),
      food_provided: foodProvided,
      job_date: finalDate,
      start_time: startTimeStr || '09:00',
      end_time: endTimeStr || '18:00',
      locality: locality,
      latitude: userCoordinates?.latitude || 31.6340,
      longitude: userCoordinates?.longitude || 74.8723,
    };

    onSubmit(payload);
  };

  return (
    <div className="fullscreen-view" role="dialog" aria-modal="true">
      {/* 1. Sticky Header with Stepper */}
      <div className="fullscreen-header">
        <button
          type="button"
          onClick={() => (step > 1 ? setStep((prev) => prev - 1) : onClose())}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 700 }}
        >
          <ArrowLeft size={18} />
          <span>{step > 1 ? (lang === 'hi' ? 'पीछे' : 'Back') : (lang === 'hi' ? 'रद्द करें' : 'Cancel')}</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            {lang === 'hi' ? 'नया काम पोस्ट करें' : 'Post a Job'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {lang === 'hi' ? `कदम ${step} / 5` : `Step ${step} of 5`}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Stepper Progress Bar */}
      <div style={{ padding: '0 16px', background: 'var(--bg-surface)' }}>
        <div className="stepper-bar">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`stepper-step ${s <= step ? 'completed' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* 2. Step Views */}
      <div style={{ flex: 1, padding: '24px 16px', maxWidth: '540px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        {/* STEP 1: What work? */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {lang === 'hi' ? 'आपको किस काम के लिए मदद चाहिए?' : 'What work do you need help with?'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {lang === 'hi' ? 'श्रेणी चुनें ताकि पास के सही कामगारों को तुरंत सूचना मिले' : 'Choose a category to notify the right nearby workers'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategoryKey === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 12px',
                      backgroundColor: isSelected ? 'var(--brand-accent-subtle)' : 'var(--bg-subtle)',
                      border: `1.5px solid ${isSelected ? 'var(--brand-accent)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ color: isSelected ? 'var(--brand-accent-hover)' : 'var(--text-primary)' }}>
                      {cat.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {lang === 'hi' ? cat.nameHi : cat.nameEn}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        ₹{cat.defaultWage}/{lang === 'hi' ? 'दिन' : 'day'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Tell us about the work */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {lang === 'hi' ? 'काम के बारे में थोड़ा बताएं' : 'Tell us about the work'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {lang === 'hi' ? 'कार्य का शीर्षक और संक्षिप्त विवरण दें' : 'Give a clear title and brief description'}
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {lang === 'hi' ? 'काम का नाम' : 'Job Title'}
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Electrician for Wiring Repair"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {lang === 'hi' ? 'विवरण (वैकल्पिक)' : 'Work Details (Optional)'}
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={lang === 'hi' ? 'जैसे: कमरे की वायरिंग ठीक करनी है, सीलिंग फैन लगाना है...' : 'e.g. Need to fix wiring fault in 2 rooms and install 1 ceiling fan...'}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '12px' }}
              onClick={() => setStep(3)}
            >
              <span>{lang === 'hi' ? 'आगे बढ़ें (स्थान और समय)' : 'Next: Location & Time'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 3: Where & When? */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {lang === 'hi' ? 'काम कहाँ और कब है?' : 'Where and when is the work?'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {lang === 'hi' ? 'स्थान और काम शुरू करने का दिन चुनें' : 'Confirm your site location and schedule'}
              </p>
            </div>

            {/* Location */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {lang === 'hi' ? 'कार्य स्थल (Locality / Area)' : 'Work Location'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <MapPin size={16} color="var(--brand-accent)" />
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Ranjit Avenue, Block B"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Date Option */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {lang === 'hi' ? 'काम का दिन' : 'When do you need workers?'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {(['TODAY', 'TOMORROW', 'CUSTOM'] as const).map((opt) => {
                  const isSelected = dateOption === opt;
                  const label = opt === 'TODAY' ? (lang === 'hi' ? 'आज' : 'Today') : opt === 'TOMORROW' ? (lang === 'hi' ? 'कल' : 'Tomorrow') : (lang === 'hi' ? 'तारीख चुनें' : 'Pick Date');
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDateOption(opt)}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                        backgroundColor: isSelected ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                        color: isSelected ? 'var(--text-inverse)' : 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {dateOption === 'CUSTOM' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.88rem',
                  }}
                />
              )}
            </div>

            {/* Shift Timing */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {lang === 'hi' ? 'समय / शिफ्ट' : 'Shift Hours'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['09:00 - 18:00', '10:00 - 19:00', 'Half Day (4 hrs)'].map((shift) => (
                  <button
                    key={shift}
                    type="button"
                    onClick={() => setShiftTiming(shift)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${shiftTiming === shift ? 'var(--brand-accent)' : 'var(--border-subtle)'}`,
                      backgroundColor: shiftTiming === shift ? 'var(--brand-accent-subtle)' : 'var(--bg-subtle)',
                      color: shiftTiming === shift ? 'var(--brand-accent-hover)' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {shift}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '8px' }}
              onClick={() => setStep(4)}
            >
              <span>{lang === 'hi' ? 'आगे बढ़ें (मजदूरी और संख्या)' : 'Next: Budget & Workers'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 4: Budget & Workers */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {lang === 'hi' ? 'मजदूरी और कामगारों की संख्या' : 'Budget and number of workers'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {lang === 'hi' ? 'उचित दैनिक मजदूरी दें ताकि कामगार तुरंत स्वीकार करें' : 'Fair daily wages ensure faster worker acceptance'}
              </p>
            </div>

            {/* Daily Wage Input */}
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {lang === 'hi' ? 'दैनिक मजदूरी (प्रति व्यक्ति)' : 'Daily Wage Offer (Per Worker)'}
              </label>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹</span>
                <input
                  type="number"
                  min={300}
                  step={50}
                  value={wage}
                  onChange={(e) => setWage(Number(e.target.value))}
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: 'var(--brand-primary)',
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    width: '160px',
                  }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{lang === 'hi' ? '/ दिन' : '/ day'}</span>
              </div>

              {/* Quick Wage Preset Chips */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                {[500, 600, 700, 800].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setWage(preset)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: wage === preset ? 'var(--brand-primary)' : '#ffffff',
                      color: wage === preset ? 'var(--text-inverse)' : 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Workers Count Counter */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {lang === 'hi' ? 'कामगारों की संख्या' : 'Number of Workers'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {lang === 'hi' ? 'जितने कामगारों की आवश्यकता है' : 'How many helpers needed?'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  type="button"
                  disabled={workersRequired <= 1}
                  onClick={() => setWorkersRequired((prev) => Math.max(1, prev - 1))}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: workersRequired <= 1 ? 'not-allowed' : 'pointer',
                    opacity: workersRequired <= 1 ? 0.4 : 1,
                  }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: '20px', textAlign: 'center' }}>
                  {workersRequired}
                </span>
                <button
                  type="button"
                  onClick={() => setWorkersRequired((prev) => prev + 1)}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Food Provided Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={foodProvided}
                onChange={(e) => setFoodProvided(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }}
              />
              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {lang === 'hi' ? 'भोजन / खाना दिया जाएगा (Food Provided)' : 'Food / Meals provided on site'}
              </span>
            </label>

            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '8px' }}
              onClick={() => setStep(5)}
            >
              <span>{lang === 'hi' ? 'समीक्षा करें (Review)' : 'Review & Confirm'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 5: Review & Post */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {lang === 'hi' ? 'काम की समीक्षा करें और पोस्ट करें' : 'Review & Post Your Job'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {lang === 'hi' ? 'पास के कामगारों को तुरंत सूचना भेजी जाएगी' : 'Nearby workers will be notified immediately'}
              </p>
            </div>

            {/* Summary Card */}
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{jobTitle}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{locality}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-primary)' }}>₹{wage}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'hi' ? 'प्रति व्यक्ति/दिन' : 'per worker/day'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{lang === 'hi' ? 'दिन:' : 'Date:'}</span>{' '}
                  <strong>{dateOption === 'TODAY' ? 'Today' : dateOption === 'TOMORROW' ? 'Tomorrow' : customDate}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{lang === 'hi' ? 'कामगार:' : 'Workers:'}</span>{' '}
                  <strong>{workersRequired}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{lang === 'hi' ? 'शिफ्ट:' : 'Shift:'}</span>{' '}
                  <strong>{shiftTiming}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{lang === 'hi' ? 'खाना:' : 'Food:'}</span>{' '}
                  <strong>{foodProvided ? 'Yes' : 'No'}</strong>
                </div>
              </div>

              {description && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: '#ffffff', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  {description}
                </div>
              )}
            </div>

            {/* Final Big CTA */}
            <button
              type="button"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '14px', fontSize: '1rem', marginTop: '12px' }}
              onClick={handleFinalSubmit}
            >
              <Check size={18} />
              <span>
                {loading
                  ? (lang === 'hi' ? 'पोस्ट हो रहा है...' : 'Broadcasting Job...')
                  : (lang === 'hi' ? 'जॉब पोस्ट करें →' : 'Post Job Now →')}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
