'use client';

import React, { useState, useRef } from 'react';
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
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import { Language } from '@/lib/translations';
import { localISODate, addDaysISO } from '@/lib/date';

interface Skill {
  id: string;
  name: string;
  slug: string;
  category: string;
}

/** Payload sent to the parent; mirrors createJobSchema (POST /api/v1/business/jobs). */
export interface PostJobPayload {
  skill_id: string;
  title: string;
  description: string | null;
  workers_required: number;
  wage: number;
  food_provided: boolean;
  job_date: string;
  start_time: string;
  end_time: string;
  locality: string;
  latitude: number;
  longitude: number;
  invited_worker_id?: string;
}

export interface InvitedWorker {
  id: string;
  name: string;
  skillSlug?: string;
}

interface PostJobSheetProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  skillsList: Skill[];
  /** Resolves true when the job was created (the form is then reset). */
  onSubmit: (payload: PostJobPayload) => Promise<boolean>;
  loading: boolean;
  userLocality?: string;
  userCoordinates: { latitude: number; longitude: number };
  invitedWorker?: InvitedWorker | null;
}

interface CategoryOption {
  key: string;
  nameEn: string;
  nameHi: string;
  icon: React.ReactNode;
  defaultWage: number;
}

interface ShiftPreset {
  key: string;
  label: string;
  labelHi: string;
  start: string;
  end: string;
}

type DateOption = 'TODAY' | 'TOMORROW' | 'CUSTOM';

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

const SHIFT_PRESETS: ShiftPreset[] = [
  { key: 'DAY', label: '09:00 - 18:00', labelHi: '09:00 - 18:00', start: '09:00', end: '18:00' },
  { key: 'LATE', label: '10:00 - 19:00', labelHi: '10:00 - 19:00', start: '10:00', end: '19:00' },
  { key: 'HALF', label: 'Half Day (4 hrs)', labelHi: 'आधा दिन (4 घंटे)', start: '09:00', end: '13:00' },
];

const WAGE_MIN = 300;
const WAGE_MAX = 5000;
const WORKERS_MIN = 1;
const WORKERS_MAX = 20;
const TITLE_MIN = 2;
const TITLE_MAX = 100;
const LOCALITY_MAX = 120;

interface FormState {
  categoryKey: string;
  title: string;
  description: string;
  locality: string;
  dateOption: DateOption;
  customDate: string;
  shiftKey: string;
  wage: string; // kept as text so an empty input is detectable
  workersRequired: number;
  foodProvided: boolean;
}

function findCategory(key: string): CategoryOption {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

function categoryName(cat: CategoryOption, lang: Language): string {
  return lang === 'hi' ? cat.nameHi : cat.nameEn;
}

/** Every field's starting value. Used on open and after a successful submit. */
function initialForm(lang: Language, userLocality: string, invitedWorker: InvitedWorker | null): FormState {
  const categoryKey = invitedWorker
    ? (CATEGORIES.some((c) => c.key === invitedWorker.skillSlug) ? (invitedWorker.skillSlug as string) : 'general')
    : 'electrician';
  const cat = findCategory(categoryKey);
  return {
    categoryKey,
    title: categoryName(cat, lang),
    description: '',
    locality: userLocality,
    dateOption: 'TODAY',
    customDate: localISODate(),
    shiftKey: SHIFT_PRESETS[0].key,
    wage: String(cat.defaultWage),
    workersRequired: 1,
    foodProvided: false,
  };
}

function initialStep(invitedWorker: InvitedWorker | null): number {
  return invitedWorker ? 2 : 1;
}

interface FieldErrors {
  title?: string;
  locality?: string;
  date?: string;
  wage?: string;
  workers?: string;
  skill?: string;
}

function validateForm(form: FormState, lang: Language, skillId: string | null, jobDate: string): FieldErrors {
  const hi = lang === 'hi';
  const errors: FieldErrors = {};
  const title = form.title.trim();
  if (title.length < TITLE_MIN) {
    errors.title = hi ? `काम का नाम कम से कम ${TITLE_MIN} अक्षर का हो` : `Job title needs at least ${TITLE_MIN} characters`;
  } else if (title.length > TITLE_MAX) {
    errors.title = hi ? `काम का नाम ${TITLE_MAX} अक्षर से कम हो` : `Job title must be ${TITLE_MAX} characters or fewer`;
  }

  const locality = form.locality.trim();
  if (!locality) {
    errors.locality = hi ? 'कार्य स्थल लिखें' : 'Enter the work location';
  } else if (locality.length > LOCALITY_MAX) {
    errors.locality = hi ? `स्थान ${LOCALITY_MAX} अक्षर से कम हो` : `Location must be ${LOCALITY_MAX} characters or fewer`;
  }

  if (!jobDate) {
    errors.date = hi ? 'तारीख चुनें' : 'Pick a date';
  } else if (jobDate < localISODate()) {
    errors.date = hi ? 'तारीख बीते हुए दिन की नहीं हो सकती' : 'The date cannot be in the past';
  }

  const wage = Number(form.wage);
  if (!Number.isInteger(wage) || wage < WAGE_MIN || wage > WAGE_MAX) {
    errors.wage = hi
      ? `मजदूरी ₹${WAGE_MIN} से ₹${WAGE_MAX} के बीच पूरे अंक में हो`
      : `Wage must be a whole number between ₹${WAGE_MIN} and ₹${WAGE_MAX}`;
  }

  if (
    !Number.isInteger(form.workersRequired) ||
    form.workersRequired < WORKERS_MIN ||
    form.workersRequired > WORKERS_MAX
  ) {
    errors.workers = hi
      ? `कामगार ${WORKERS_MIN} से ${WORKERS_MAX} के बीच हों`
      : `Workers must be between ${WORKERS_MIN} and ${WORKERS_MAX}`;
  }

  if (!skillId) {
    errors.skill = hi
      ? 'यह काम का प्रकार अभी उपलब्ध नहीं है। बाद में फिर से कोशिश करें।'
      : 'This type of work is unavailable right now. Please try again shortly.';
  }

  return errors;
}

const errorTextStyle: React.CSSProperties = {
  fontSize: '0.76rem',
  fontWeight: 600,
  color: 'var(--brand-danger)',
  marginTop: '6px',
};

export const PostJobSheet: React.FC<PostJobSheetProps> = ({
  lang,
  isOpen,
  onClose,
  skillsList,
  onSubmit,
  loading,
  userLocality = '',
  userCoordinates,
  invitedWorker = null,
}) => {
  const [form, setForm] = useState<FormState>(() => initialForm(lang, userLocality, invitedWorker));
  const [step, setStep] = useState<number>(() => initialStep(invitedWorker));
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);
  const submittingRef = useRef<boolean>(false);

  // Reset everything whenever the sheet opens (false -> true), pre-filling from props.
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setForm(initialForm(lang, userLocality, invitedWorker));
      setStep(initialStep(invitedWorker));
    }
  }

  if (!isOpen) return null;

  const hi = lang === 'hi';
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectedCategory = findCategory(form.categoryKey);
  // Exact slug match only; never fall back to another skill.
  const skillId = skillsList.find((s) => s.slug === form.categoryKey)?.id ?? null;

  const shift = SHIFT_PRESETS.find((p) => p.key === form.shiftKey) ?? SHIFT_PRESETS[0];
  const jobDate =
    form.dateOption === 'TODAY' ? localISODate() : form.dateOption === 'TOMORROW' ? addDaysISO(1) : form.customDate;

  const errors = validateForm(form, lang, skillId, jobDate);
  const hasErrors = Object.keys(errors).length > 0;
  const step2Valid = !errors.title;
  const step3Valid = !errors.locality && !errors.date;
  const step4Valid = !errors.wage && !errors.workers;

  const goBack = () => {
    // A directly-invited hire skips the category picker, so "back" on step 2 cancels.
    if (step === 1 || (invitedWorker && step === 2)) {
      onClose();
    } else {
      setStep((prev) => prev - 1);
    }
  };

  const handleSelectCategory = (cat: CategoryOption) => {
    setForm((prev) => ({
      ...prev,
      categoryKey: cat.key,
      title: categoryName(cat, lang),
      wage: String(cat.defaultWage),
    }));
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (hasErrors || !skillId || loading || submittingRef.current) return;

    const payload: PostJobPayload = {
      skill_id: skillId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      workers_required: form.workersRequired,
      wage: Number(form.wage),
      food_provided: form.foodProvided,
      job_date: jobDate,
      start_time: shift.start,
      end_time: shift.end,
      locality: form.locality.trim(),
      latitude: userCoordinates.latitude,
      longitude: userCoordinates.longitude,
      ...(invitedWorker ? { invited_worker_id: invitedWorker.id } : {}),
    };

    submittingRef.current = true;
    try {
      const ok = await onSubmit(payload);
      if (ok) {
        setForm(initialForm(lang, userLocality, invitedWorker));
        setStep(initialStep(invitedWorker));
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const shiftLabel = (p: ShiftPreset) => (hi ? p.labelHi : p.label);

  return (
    <div className="fullscreen-view" role="dialog" aria-modal="true">
      {/* 1. Sticky Header with Stepper */}
      <div className="fullscreen-header">
        <button
          type="button"
          onClick={goBack}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 700 }}
        >
          <ArrowLeft size={18} />
          <span>{step > 1 && !(invitedWorker && step === 2) ? (hi ? 'पीछे' : 'Back') : (hi ? 'रद्द करें' : 'Cancel')}</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            {hi ? 'नया काम पोस्ट करें' : 'Post a Job'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {hi ? `कदम ${step} / 5` : `Step ${step} of 5`}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={hi ? 'बंद करें' : 'Close'}
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
                {hi ? 'आपको किस काम के लिए मदद चाहिए?' : 'What work do you need help with?'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {hi ? 'श्रेणी चुनें ताकि पास के सही कामगारों को तुरंत सूचना मिले' : 'Choose a category to notify the right nearby workers'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {CATEGORIES.map((cat) => {
                const isSelected = form.categoryKey === cat.key;
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
                        {categoryName(cat, lang)}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        ₹{cat.defaultWage}/{hi ? 'दिन' : 'day'}
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
                {hi ? 'काम के बारे में थोड़ा बताएं' : 'Tell us about the work'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {hi ? 'कार्य का शीर्षक और संक्षिप्त विवरण दें' : 'Give a clear title and brief description'}
              </p>
            </div>

            {invitedWorker && (
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-accent-hover)', background: 'var(--brand-accent-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                {hi
                  ? `${invitedWorker.name} को सीधे काम के लिए चुना जा रहा है — उनसे पुष्टि मांगी जाएगी`
                  : `Hiring ${invitedWorker.name} directly — they'll be asked to confirm`}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {hi ? 'काम का नाम' : 'Job Title'}
              </label>
              <input
                type="text"
                value={form.title}
                maxLength={TITLE_MAX}
                onChange={(e) => setField('title', e.target.value)}
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
              {errors.title && <div style={errorTextStyle}>{errors.title}</div>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {hi ? 'विवरण (वैकल्पिक)' : 'Work Details (Optional)'}
              </label>
              <textarea
                rows={4}
                maxLength={1000}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder={hi ? 'जैसे: कमरे की वायरिंग ठीक करनी है, सीलिंग फैन लगाना है...' : 'e.g. Need to fix wiring fault in 2 rooms and install 1 ceiling fan...'}
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
              disabled={!step2Valid}
              onClick={() => setStep(3)}
            >
              <span>{hi ? 'आगे बढ़ें (स्थान और समय)' : 'Next: Location & Time'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 3: Where & When? */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {hi ? 'काम कहाँ और कब है?' : 'Where and when is the work?'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {hi ? 'स्थान और काम शुरू करने का दिन चुनें' : 'Confirm your site location and schedule'}
              </p>
            </div>

            {/* Location */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {hi ? 'कार्य स्थल (Locality / Area)' : 'Work Location'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <MapPin size={16} color="var(--brand-accent)" />
                <input
                  type="text"
                  value={form.locality}
                  maxLength={LOCALITY_MAX}
                  onChange={(e) => setField('locality', e.target.value)}
                  placeholder="e.g. Ranjit Avenue, Block B"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--text-primary)' }}
                />
              </div>
              {errors.locality && <div style={errorTextStyle}>{errors.locality}</div>}
            </div>

            {/* Date Option */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {hi ? 'काम का दिन' : 'When do you need workers?'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {(['TODAY', 'TOMORROW', 'CUSTOM'] as const).map((opt) => {
                  const isSelected = form.dateOption === opt;
                  const label = opt === 'TODAY' ? (hi ? 'आज' : 'Today') : opt === 'TOMORROW' ? (hi ? 'कल' : 'Tomorrow') : (hi ? 'तारीख चुनें' : 'Pick Date');
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setField('dateOption', opt)}
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

              {form.dateOption === 'CUSTOM' && (
                <input
                  type="date"
                  min={localISODate()}
                  value={form.customDate}
                  onChange={(e) => setField('customDate', e.target.value)}
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
              {errors.date && <div style={errorTextStyle}>{errors.date}</div>}
            </div>

            {/* Shift Timing */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {hi ? 'समय / शिफ्ट' : 'Shift Hours'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {SHIFT_PRESETS.map((preset) => {
                  const isSelected = form.shiftKey === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setField('shiftKey', preset.key)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isSelected ? 'var(--brand-accent)' : 'var(--border-subtle)'}`,
                        backgroundColor: isSelected ? 'var(--brand-accent-subtle)' : 'var(--bg-subtle)',
                        color: isSelected ? 'var(--brand-accent-hover)' : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {shiftLabel(preset)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '8px' }}
              disabled={!step3Valid}
              onClick={() => setStep(4)}
            >
              <span>{hi ? 'आगे बढ़ें (मजदूरी और संख्या)' : 'Next: Budget & Workers'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 4: Budget & Workers */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {hi ? 'मजदूरी और कामगारों की संख्या' : 'Budget and number of workers'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {hi ? 'उचित दैनिक मजदूरी दें ताकि कामगार तुरंत स्वीकार करें' : 'Fair daily wages ensure faster worker acceptance'}
              </p>
            </div>

            {/* Daily Wage Input */}
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {hi ? 'दैनिक मजदूरी (प्रति व्यक्ति)' : 'Daily Wage Offer (Per Worker)'}
              </label>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={WAGE_MIN}
                  max={WAGE_MAX}
                  step={50}
                  value={form.wage}
                  onChange={(e) => setField('wage', e.target.value)}
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
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{hi ? '/ दिन' : '/ day'}</span>
              </div>
              {errors.wage && <div style={errorTextStyle}>{errors.wage}</div>}

              {/* Quick Wage Preset Chips */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                {[500, 600, 700, 800].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setField('wage', String(preset))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: Number(form.wage) === preset ? 'var(--brand-primary)' : '#ffffff',
                      color: Number(form.wage) === preset ? 'var(--text-inverse)' : 'var(--text-primary)',
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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {hi ? 'कामगारों की संख्या' : 'Number of Workers'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {hi ? 'जितने कामगारों की आवश्यकता है' : 'How many helpers needed?'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <button
                    type="button"
                    aria-label={hi ? 'कम करें' : 'Decrease workers'}
                    disabled={form.workersRequired <= WORKERS_MIN}
                    onClick={() => setField('workersRequired', Math.max(WORKERS_MIN, form.workersRequired - 1))}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: form.workersRequired <= WORKERS_MIN ? 'not-allowed' : 'pointer',
                      opacity: form.workersRequired <= WORKERS_MIN ? 0.4 : 1,
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: '20px', textAlign: 'center' }}>
                    {form.workersRequired}
                  </span>
                  <button
                    type="button"
                    aria-label={hi ? 'बढ़ाएं' : 'Increase workers'}
                    disabled={form.workersRequired >= WORKERS_MAX}
                    onClick={() => setField('workersRequired', Math.min(WORKERS_MAX, form.workersRequired + 1))}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: form.workersRequired >= WORKERS_MAX ? 'not-allowed' : 'pointer',
                      opacity: form.workersRequired >= WORKERS_MAX ? 0.4 : 1,
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {errors.workers && <div style={errorTextStyle}>{errors.workers}</div>}
            </div>

            {/* Food Provided Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.foodProvided}
                onChange={(e) => setField('foodProvided', e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)' }}
              />
              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {hi ? 'भोजन / खाना दिया जाएगा (Food Provided)' : 'Food / Meals provided on site'}
              </span>
            </label>

            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '8px' }}
              disabled={!step4Valid}
              onClick={() => setStep(5)}
            >
              <span>{hi ? 'समीक्षा करें (Review)' : 'Review & Confirm'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 5: Review & Post */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {hi ? 'काम की समीक्षा करें और पोस्ट करें' : 'Review & Post Your Job'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {invitedWorker
                  ? (hi ? `${invitedWorker.name} को सीधे सूचना भेजी जाएगी` : `${invitedWorker.name} will be notified directly`)
                  : (hi ? 'पास के कामगारों को तुरंत सूचना भेजी जाएगी' : 'Nearby workers will be notified immediately')}
              </p>
            </div>

            {/* Summary Card */}
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{form.title.trim()}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {form.locality.trim()}
                    {' · '}
                    {categoryName(selectedCategory, lang)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-primary)' }}>₹{form.wage || 0}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{hi ? 'प्रति व्यक्ति/दिन' : 'per worker/day'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{hi ? 'दिन:' : 'Date:'}</span>{' '}
                  <strong>
                    {form.dateOption === 'TODAY' ? (hi ? 'आज' : 'Today') : form.dateOption === 'TOMORROW' ? (hi ? 'कल' : 'Tomorrow') : form.customDate}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{hi ? 'कामगार:' : 'Workers:'}</span>{' '}
                  <strong>{form.workersRequired}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{hi ? 'शिफ्ट:' : 'Shift:'}</span>{' '}
                  <strong>{shiftLabel(shift)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>{hi ? 'खाना:' : 'Food:'}</span>{' '}
                  <strong>{form.foodProvided ? (hi ? 'हाँ' : 'Yes') : (hi ? 'नहीं' : 'No')}</strong>
                </div>
              </div>

              {form.description.trim() && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: '#ffffff', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  {form.description.trim()}
                </div>
              )}
            </div>

            {hasErrors && (
              <div style={{ ...errorTextStyle, marginTop: 0 }}>
                {errors.skill ?? (hi ? 'कृपया ऊपर दी गई गलतियाँ ठीक करें' : 'Please fix the highlighted issues before posting')}
              </div>
            )}

            {/* Final Big CTA */}
            <button
              type="button"
              disabled={loading || hasErrors}
              className="btn btn-primary"
              style={{ padding: '14px', fontSize: '1rem', marginTop: '12px' }}
              onClick={handleFinalSubmit}
            >
              <Check size={18} />
              <span>
                {loading
                  ? (hi ? 'पोस्ट हो रहा है...' : 'Broadcasting Job...')
                  : (hi ? 'जॉब पोस्ट करें →' : 'Post Job Now →')}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
