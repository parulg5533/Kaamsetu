'use client';

import React, { useState } from 'react';
import { Search, Plus, Briefcase, Users, Clock, MapPin, Sparkles, Filter, CheckCircle2, ChevronRight } from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { WorkerCard, NearbyWorker } from './WorkerCard';

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface CustomerJob {
  id: string;
  title: string;
  description: string;
  skill_name: string;
  wage: number;
  food_provided: boolean;
  job_date: string;
  start_time: string;
  end_time: string;
  locality: string;
  status: string;
  workers_required: number;
  workers_accepted: number;
  applicant_count: number;
  accepted_count: number;
}

interface CustomerHomeProps {
  lang: Language;
  skillsList: Skill[];
  workers: NearbyWorker[];
  customerJobs: CustomerJob[];
  onOpenPostJob: () => void;
  onRequestHireWorker: (worker: NearbyWorker) => void;
  onViewApplicants: (job: CustomerJob) => void;
  loading: boolean;
}

interface CategoryMeta {
  idKey: string;
  nameEn: string;
  nameHi: string;
  subEn: string;
  subHi: string;
  icon: string;
  matchPattern: string;
}

const POPULAR_SERVICES: CategoryMeta[] = [
  {
    idKey: 'plumber',
    nameEn: 'Plumber',
    nameHi: 'नल मिस्त्री',
    subEn: 'Pipe & Tap Repair',
    subHi: 'पाइप व लीकेज',
    icon: '🔧',
    matchPattern: 'plumber',
  },
  {
    idKey: 'electrician',
    nameEn: 'Electrician',
    nameHi: 'बिजली मिस्त्री',
    subEn: 'Wiring & Faults',
    subHi: 'वायरिंग व पंखा',
    icon: '⚡',
    matchPattern: 'electrician',
  },
  {
    idKey: 'cleaner',
    nameEn: 'Cleaning',
    nameHi: 'सफाई / हेल्पर',
    subEn: 'House & Shop',
    subHi: 'घर व दुकान सफाई',
    icon: '🧹',
    matchPattern: 'cleaner',
  },
  {
    idKey: 'painter',
    nameEn: 'Painter',
    nameHi: 'पेंटर व पुताई',
    subEn: 'Whitewash & Color',
    subHi: 'पुताई व डिस्टेंपर',
    icon: '🎨',
    matchPattern: 'paint',
  },
  {
    idKey: 'helper',
    nameEn: 'Loading / Shift',
    nameHi: 'लोडिंग / पल्लेदार',
    subEn: 'Heavy Goods & Labor',
    subHi: 'सामान उठाना व शिफ्ट',
    icon: '🚚',
    matchPattern: 'loading',
  },
  {
    idKey: 'carpenter',
    nameEn: 'Carpenter',
    nameHi: 'बढ़ई / मिस्त्री',
    subEn: 'Wood & Furniture',
    subHi: 'लकड़ी व फर्नीचर',
    icon: '🔨',
    matchPattern: 'carpenter',
  },
  {
    idKey: 'hospitality',
    nameEn: 'Cook / Kitchen',
    nameHi: 'रसोई / हेल्पर',
    subEn: 'Cooking & Helper',
    subHi: 'खाना व सहायक',
    icon: '🍽️',
    matchPattern: 'restaurant',
  },
  {
    idKey: 'all',
    nameEn: 'All Services',
    nameHi: 'सभी काम देखें',
    subEn: 'Explore Everything',
    subHi: 'सभी श्रेणियां',
    icon: '⭐',
    matchPattern: 'all',
  },
];

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  lang,
  skillsList,
  workers,
  customerJobs,
  onOpenPostJob,
  onRequestHireWorker,
  onViewApplicants,
  loading,
}) => {
  const t = translations[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('all');

  // Filter workers dynamically based on search query & selected category
  const filteredWorkers = workers.filter((w) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      w.name.toLowerCase().includes(query) ||
      w.locality.toLowerCase().includes(query) ||
      w.skills.some((s) => s.name.toLowerCase().includes(query));

    if (selectedCategoryKey === 'all') {
      return matchesSearch;
    }

    const cat = POPULAR_SERVICES.find((c) => c.idKey === selectedCategoryKey);
    const matchesCategory = cat
      ? w.skills.some((s) => s.name.toLowerCase().includes(cat.matchPattern))
      : true;

    return matchesSearch && matchesCategory;
  });

  // Calculate total applicants waiting across all customer active jobs
  const totalApplicantsCount = customerJobs.reduce(
    (acc, job) => acc + (job.applicant_count || 0),
    0
  );

  const selectedCategoryMeta = POPULAR_SERVICES.find((c) => c.idKey === selectedCategoryKey);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. EMOTIONAL HERO PROMPT & SEARCH BAR */}
      <div className="customer-search-section">
        <div className="emotional-hero-header">
          <div className="emotional-hero-title">
            {t.needHelpHeading}
          </div>
          <div className="emotional-hero-sub">
            {t.needHelpSub}
          </div>
        </div>

        <div className="customer-search-bar">
          <Search size={18} color="#f59e0b" />
          <input
            type="text"
            className="search-input"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. VISUAL 2x4 SERVICE GRID (Urban Company / WhatsApp Local style) */}
      <div className="service-grid-section">
        <div className="service-grid-heading">
          <span>{t.popularServicesHeading}</span>
          {selectedCategoryKey !== 'all' && (
            <button
              onClick={() => setSelectedCategoryKey('all')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fbbf24',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {lang === 'hi' ? 'सभी देखें (Reset)' : 'View All'}
            </button>
          )}
        </div>

        <div className="service-grid">
          {POPULAR_SERVICES.map((cat) => {
            const isSelected = selectedCategoryKey === cat.idKey;
            return (
              <div
                key={cat.idKey}
                className={`service-grid-card ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategoryKey(isSelected && cat.idKey !== 'all' ? 'all' : cat.idKey);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="service-icon-bubble">
                  {cat.icon}
                </div>
                <div className="service-card-title">
                  {lang === 'hi' ? cat.nameHi : cat.nameEn}
                </div>
                <div className="service-card-sub">
                  {lang === 'hi' ? cat.subHi : cat.subEn}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE REQUESTS ALERT (Only when customer has open jobs) */}
      {customerJobs.length > 0 && (
        <div
          className="active-requests-alert"
          onClick={() => onViewApplicants(customerJobs[0])}
          role="button"
          tabIndex={0}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>📋</span>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#34d399' }}>
                {customerJobs.length} {t.activeRequestsPill}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                {totalApplicantsCount > 0
                  ? (lang === 'hi' ? `${totalApplicantsCount} कामगारों ने आवेदन किया है · देखें` : `${totalApplicantsCount} workers applied · Tap to view`)
                  : (lang === 'hi' ? 'आवेदन की प्रतीक्षा में...' : 'Waiting for applications...')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontWeight: 700, fontSize: '0.8rem' }}>
            <span>{t.viewApplicants}</span>
            <ChevronRight size={15} />
          </div>
        </div>
      )}

      {/* 4. PROMINENT "POST A JOB" HERO CARD */}
      <div className="post-job-hero-card">
        <div>
          <div className="hero-text-title">{t.postJobCTA}</div>
          <div className="hero-text-sub">{t.postJobDesc}</div>
        </div>
        <button
          className="hero-action-btn"
          onClick={onOpenPostJob}
        >
          <Plus size={16} />
          {t.postJobButton}
        </button>
      </div>

      {/* 5. WORKERS NEAR YOU SECTION */}
      <div className="section-header">
        <div>
          <div className="section-title">
            <Users size={18} color="#f59e0b" />
            <span>
              {t.nearbyWorkersHeading.split(' (')[0]} ({filteredWorkers.length})
            </span>
          </div>
          <div className="section-sub">
            {selectedCategoryKey !== 'all' && selectedCategoryMeta
              ? `${lang === 'hi' ? selectedCategoryMeta.nameHi : selectedCategoryMeta.nameEn} · `
              : ''}
            {t.nearbyWorkersSub}
          </div>
        </div>

        {selectedCategoryKey !== 'all' && (
          <button
            onClick={() => setSelectedCategoryKey('all')}
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              borderRadius: '9999px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✕ {lang === 'hi' ? 'फ़िल्टर हटाएं' : 'Clear'}
          </button>
        )}
      </div>

      {/* 6. WORKERS FEED CONTENT */}
      <div className="feed-content" style={{ paddingTop: 0 }}>
        {loading ? (
          <>
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </>
        ) : filteredWorkers.length === 0 ? (
          <div className="empty-state">
            <Users size={36} />
            <p style={{ fontWeight: 700 }}>
              {selectedCategoryKey !== 'all' && selectedCategoryMeta
                ? (lang === 'hi'
                    ? `अभी ${selectedCategoryMeta.nameHi} के लिए 5 किमी में कोई वर्कर उपलब्ध नहीं है।`
                    : `No ${selectedCategoryMeta.nameEn} currently available within 5 km.`)
                : t.noWorkersFound}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 12px 0' }}>
              {lang === 'hi'
                ? 'सिर्फ 60 सेकंड में काम पोस्ट करें — पास के कामगार तुरंत सूचना प्राप्त करेंगे।'
                : 'Post your work request in 60s — nearby workers will be notified immediately.'}
            </p>
            <button
              className="btn-apply"
              style={{ background: 'var(--primary)', color: '#000', padding: '10px 20px', fontSize: '0.86rem' }}
              onClick={onOpenPostJob}
            >
              {t.postJobButton}
            </button>
          </div>
        ) : (
          filteredWorkers.map((worker) => (
            <WorkerCard
              key={worker.id}
              lang={lang}
              worker={worker}
              onRequestHire={onRequestHireWorker}
            />
          ))
        )}
      </div>
    </div>
  );
};
