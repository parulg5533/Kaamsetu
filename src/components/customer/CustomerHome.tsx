'use client';

import React, { useState } from 'react';
import {
  Wrench,
  Zap,
  Sparkles,
  Paintbrush,
  Truck,
  Hammer,
  Utensils,
  LayoutGrid,
  Users,
  Plus,
  ClipboardList,
  ChevronRight,
  UserX,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { Card, Badge, Button, SearchInput, EmptyState } from '@/components/ui';
import { WorkerCard, NearbyWorker } from './WorkerCard';
import { WorkerProfileSheet } from './WorkerProfileSheet';

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
  icon: React.ReactNode;
  iconClass: string;
  matchPattern: string;
}

const POPULAR_SERVICES: CategoryMeta[] = [
  {
    idKey: 'plumber',
    nameEn: 'Plumber',
    nameHi: 'नल मिस्त्री',
    subEn: 'Pipe & Tap Repair',
    subHi: 'पाइप व लीकेज',
    icon: <Wrench size={22} />,
    iconClass: 'service-icon-plumber',
    matchPattern: 'plumber',
  },
  {
    idKey: 'electrician',
    nameEn: 'Electrician',
    nameHi: 'बिजली मिस्त्री',
    subEn: 'Wiring & Faults',
    subHi: 'वायरिंग व पंखा',
    icon: <Zap size={22} />,
    iconClass: 'service-icon-electrician',
    matchPattern: 'electrician',
  },
  {
    idKey: 'cleaner',
    nameEn: 'Cleaning',
    nameHi: 'सफाई / हेल्पर',
    subEn: 'House & Shop',
    subHi: 'घर व दुकान सफाई',
    icon: <Sparkles size={22} />,
    iconClass: 'service-icon-cleaning',
    matchPattern: 'cleaner',
  },
  {
    idKey: 'painter',
    nameEn: 'Painter',
    nameHi: 'पेंटर व पुताई',
    subEn: 'Whitewash & Color',
    subHi: 'पुताई व डिस्टेंपर',
    icon: <Paintbrush size={22} />,
    iconClass: 'service-icon-painter',
    matchPattern: 'paint',
  },
  {
    idKey: 'helper',
    nameEn: 'Loading / Shift',
    nameHi: 'लोडिंग / पल्लेदार',
    subEn: 'Heavy Goods & Labor',
    subHi: 'सामान उठाना व शिफ्ट',
    icon: <Truck size={22} />,
    iconClass: 'service-icon-helper',
    matchPattern: 'loading',
  },
  {
    idKey: 'carpenter',
    nameEn: 'Carpenter',
    nameHi: 'बढ़ई / मिस्त्री',
    subEn: 'Wood & Furniture',
    subHi: 'लकड़ी व फर्नीचर',
    icon: <Hammer size={22} />,
    iconClass: 'service-icon-carpenter',
    matchPattern: 'carpenter',
  },
  {
    idKey: 'hospitality',
    nameEn: 'Cook / Kitchen',
    nameHi: 'रसोई / हेल्पर',
    subEn: 'Cooking & Helper',
    subHi: 'खाना व सहायक',
    icon: <Utensils size={22} />,
    iconClass: 'service-icon-hospitality',
    matchPattern: 'restaurant',
  },
  {
    idKey: 'all',
    nameEn: 'All Services',
    nameHi: 'सभी काम देखें',
    subEn: 'Explore Everything',
    subHi: 'सभी श्रेणियां',
    icon: <LayoutGrid size={22} />,
    iconClass: 'service-icon-all',
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
  const [selectedWorkerForProfile, setSelectedWorkerForProfile] = useState<NearbyWorker | null>(null);

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
    <div className="customer-home-container">
      {/* 1. EMOTIONAL HERO PROMPT & SEARCH INPUT */}
      <div className="customer-search-section">
        <div className="emotional-hero-header">
          <h1 className="emotional-hero-title">{t.needHelpHeading}</h1>
          <p className="emotional-hero-sub">{t.needHelpSub}</p>
        </div>

        <SearchInput
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* 2. VISUAL 2x4 SERVICE GRID WITH LUCIDE ICONS */}
      <section className="service-grid-section" aria-label="Service categories">
        <div className="service-grid-heading">
          <span>{t.popularServicesHeading}</span>
          {selectedCategoryKey !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategoryKey('all')}
              className="reset-filter-btn"
            >
              {lang === 'hi' ? 'सभी देखें (Reset)' : 'View All'}
            </Button>
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
                aria-pressed={isSelected}
              >
                <div className={`service-icon-container ${cat.iconClass}`}>
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
      </section>

      {/* 3. ACTIVE REQUESTS ALERT (Only when customer has open jobs) */}
      {customerJobs.length > 0 && (
        <div
          className="active-requests-alert"
          onClick={() => onViewApplicants(customerJobs[0])}
          role="button"
          tabIndex={0}
        >
          <div className="active-requests-content">
            <div className="alert-icon-wrap">
              <ClipboardList size={20} color="#34d399" />
            </div>
            <div>
              <div className="alert-title">
                {customerJobs.length} {t.activeRequestsPill}
              </div>
              <div className="alert-sub">
                {totalApplicantsCount > 0
                  ? lang === 'hi'
                    ? `${totalApplicantsCount} कामगारों ने आवेदन किया है · देखें`
                    : `${totalApplicantsCount} workers applied · Tap to view`
                  : lang === 'hi'
                  ? 'आवेदन की प्रतीक्षा में...'
                  : 'Waiting for applications...'}
              </div>
            </div>
          </div>
          <div className="alert-action-label">
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
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus size={16} />}
          onClick={onOpenPostJob}
        >
          {t.postJobButton}
        </Button>
      </div>

      {/* 5. WORKERS NEAR YOU SECTION */}
      <section aria-label="Nearby workers">
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
            <Badge variant="warning">
              {lang === 'hi' ? selectedCategoryMeta?.nameHi : selectedCategoryMeta?.nameEn}
            </Badge>
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
            <EmptyState
              icon={<UserX size={26} />}
              title={
                selectedCategoryKey !== 'all' && selectedCategoryMeta
                  ? lang === 'hi'
                    ? `अभी ${selectedCategoryMeta.nameHi} के लिए 5 किमी में कोई वर्कर उपलब्ध नहीं है।`
                    : `No ${selectedCategoryMeta.nameEn} currently available within 5 km.`
                  : t.noWorkersFound
              }
              description={
                lang === 'hi'
                  ? 'सिर्फ 60 सेकंड में काम पोस्ट करें — पास के कामगार तुरंत सूचना प्राप्त करेंगे।'
                  : 'Post your work request in 60s — nearby workers will be notified immediately.'
              }
              action={
                <Button variant="primary" size="md" onClick={onOpenPostJob}>
                  {t.postJobButton}
                </Button>
              }
            />
          ) : (
            filteredWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                lang={lang}
                worker={worker}
                onRequestHire={onRequestHireWorker}
                onViewProfile={(w) => setSelectedWorkerForProfile(w)}
              />
            ))
          )}
        </div>
      </section>

      {/* 7. VERIFIED WORKER TRUST PROFILE MODAL SHEET */}
      <WorkerProfileSheet
        lang={lang}
        worker={selectedWorkerForProfile}
        isOpen={Boolean(selectedWorkerForProfile)}
        onClose={() => setSelectedWorkerForProfile(null)}
        onHireWorker={(worker) => {
          setSelectedWorkerForProfile(null);
          onRequestHireWorker(worker);
        }}
      />
    </div>
  );
};
