'use client';

import React, { useState } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Utensils, Users, MapPin, Calendar, Clock, DollarSign } from 'lucide-react';
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
}

export const PostJobSheet: React.FC<PostJobSheetProps> = ({
  lang,
  isOpen,
  onClose,
  skillsList,
  onSubmit,
  loading,
  preSelectedSkillId,
  preSelectedWorkerName,
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [skillId, setSkillId] = useState<string>(
    preSelectedSkillId || (skillsList.length > 0 ? skillsList[0].id : '')
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jobDate, setJobDate] = useState(tomorrowStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [locality, setLocality] = useState('Lawrence Road, Amritsar');
  const [workersRequired, setWorkersRequired] = useState(1);
  const [wage, setWage] = useState(650);
  const [foodProvided, setFoodProvided] = useState(true);

  const handleNext = () => {
    if (step < 3) setStep((prev) => (prev + 1) as any);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as any);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSkill = skillsList.find((s) => s.id === skillId);
    onSubmit({
      skill_id: skillId,
      title: title || selectedSkill?.name || 'Daily Helper Needed',
      description,
      workers_required: workersRequired,
      wage,
      food_provided: foodProvided,
      job_date: jobDate,
      start_time: startTime,
      end_time: endTime,
      locality,
    });
  };

  return (
    <div className="bottom-sheet-overlay" role="dialog" aria-modal="true">
      <div className="bottom-sheet-container">
        <div className="sheet-handle-bar" />

        <div className="sheet-header">
          <div>
            <div className="sheet-title">{t.postJobTitle}</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {preSelectedWorkerName
                ? (lang === 'hi' ? `${preSelectedWorkerName} के लिए जॉब पोस्ट` : `Targeted for ${preSelectedWorkerName}`)
                : (lang === 'hi' ? 'स्थानीय कामगारों के लिए 60 सेकंड में पोस्ट करें' : 'Reach nearby available workers in 60s')}
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* 3-Step Wizard Indicator */}
        <div className="step-wizard-pills">
          <div className={`step-pill ${step >= 1 ? 'active' : ''}`} />
          <div className={`step-pill ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-pill ${step >= 3 ? 'active' : ''}`} />
        </div>

        <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* STEP 1: WHAT WORK? */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#fbbf24' }}>
                {t.step1Title}
              </div>

              <div className="form-group">
                <label className="form-label">{lang === 'hi' ? 'काम की श्रेणी चुनें' : 'Select Category / Trade'}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {skillsList.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`category-chip ${skillId === s.id ? 'active' : ''}`}
                      style={{ borderRadius: '12px', padding: '10px 12px', justifyContent: 'flex-start' }}
                      onClick={() => {
                        setSkillId(s.id);
                        if (!title) setTitle(s.name);
                      }}
                    >
                      {skillId === s.id && <Check size={14} />}
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{lang === 'hi' ? 'जॉब का शीर्षक (जैसे किचन हेल्पर)' : 'Job Title / Role'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Restaurant Kitchen Helper"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.workDesc}</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder={lang === 'hi' ? 'काम की मुख्य बातें...' : 'Brief notes about the work...'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn-apply"
                onClick={handleNext}
                style={{ marginTop: '6px' }}
              >
                <span>{lang === 'hi' ? 'अगला: तारीख और स्थान →' : 'Next: When & Where →'}</span>
              </button>
            </div>
          )}

          {/* STEP 2: WHERE & WHEN? */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#fbbf24' }}>
                {t.step2Title}
              </div>

              <div className="form-group">
                <label className="form-label">{t.workDate}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                  <button
                    type="button"
                    className={`avail-btn ${jobDate === todayStr ? 'active-today' : ''}`}
                    onClick={() => setJobDate(todayStr)}
                  >
                    📅 {lang === 'hi' ? 'आज (Today)' : 'Today'}
                  </button>
                  <button
                    type="button"
                    className={`avail-btn ${jobDate === tomorrowStr ? 'active-tomorrow' : ''}`}
                    onClick={() => setJobDate(tomorrowStr)}
                  >
                    📅 {lang === 'hi' ? 'कल (Tomorrow)' : 'Tomorrow'}
                  </button>
                </div>
                <input
                  type="date"
                  className="form-input"
                  value={jobDate}
                  onChange={(e) => setJobDate(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{lang === 'hi' ? 'शुरू होने का समय' : 'Start Time'}</label>
                  <input
                    type="time"
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{lang === 'hi' ? 'समाप्ति समय' : 'End Time'}</label>
                  <input
                    type="time"
                    className="form-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t.locationLandmark}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Lawrence Road, near Novelty Sweets"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-applied"
                  style={{ flex: '0 0 80px', color: '#fff' }}
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="button"
                  className="btn-apply"
                  onClick={handleNext}
                >
                  <span>{lang === 'hi' ? 'अगला: दिहाड़ी और वर्कर →' : 'Next: Wage & Budget →'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: BUDGET & WORKERS NEEDED */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#fbbf24' }}>
                {t.step3Title}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t.workersNeeded}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="avail-btn"
                      style={{ flex: '0 0 36px', height: '42px', fontSize: '1.2rem' }}
                      onClick={() => setWorkersRequired(Math.max(1, workersRequired - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      className="form-input"
                      style={{ textAlign: 'center', fontWeight: 800 }}
                      value={workersRequired}
                      onChange={(e) => setWorkersRequired(parseInt(e.target.value) || 1)}
                    />
                    <button
                      type="button"
                      className="avail-btn"
                      style={{ flex: '0 0 36px', height: '42px', fontSize: '1.2rem' }}
                      onClick={() => setWorkersRequired(workersRequired + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t.dailyWageOffer}</label>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    className="form-input"
                    style={{ fontWeight: 800, color: '#fbbf24' }}
                    value={wage}
                    onChange={(e) => setWage(parseInt(e.target.value) || 600)}
                    required
                  />
                </div>
              </div>

              {/* Quick wage chips */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[550, 600, 650, 700, 750, 800].map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={`tag-chip ${wage === w ? 'selected' : ''}`}
                    onClick={() => setWage(w)}
                  >
                    ₹{w}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                <input
                  type="checkbox"
                  id="sheet_food_check"
                  checked={foodProvided}
                  onChange={(e) => setFoodProvided(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="sheet_food_check" style={{ fontSize: '0.86rem', color: '#f8fafc', cursor: 'pointer' }}>
                  {t.provideFood}
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-applied"
                  style={{ flex: '0 0 80px', color: '#fff' }}
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="submit"
                  className="btn-apply"
                  disabled={loading}
                >
                  {loading
                    ? (lang === 'hi' ? 'पोस्ट हो रहा है...' : 'Posting...')
                    : (lang === 'hi' ? '✓ काम पोस्ट करें' : `✓ ${t.submitJob}`)}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
