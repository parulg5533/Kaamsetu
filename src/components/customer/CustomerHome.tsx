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
  Map as MapIcon,
  List as ListIcon,
  Search,
  X,
  UserX,
  Star,
  MapPin,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { WorkerCard, NearbyWorker } from './WorkerCard';
import { WorkerProfileSheet } from './WorkerProfileSheet';
import { GoogleMap, MapMarkerItem } from '@/components/map/GoogleMap';
import { BottomSheet } from '@/components/ui/BottomSheet';

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
  userLocation?: {
    lat: number;
    lng: number;
    locality: string;
    isLive: boolean;
  };
  onOpenPostJob: () => void;
  onRequestHireWorker: (worker: NearbyWorker) => void;
  onViewApplicants: (job: CustomerJob) => void;
  loading: boolean;
}

interface CategoryFilter {
  key: string;
  nameEn: string;
  nameHi: string;
  icon: React.ReactNode;
  matchPattern: string;
}

const CATEGORY_CHIPS: CategoryFilter[] = [
  { key: 'all', nameEn: 'All Services', nameHi: 'सभी काम', icon: <Briefcase size={14} />, matchPattern: 'all' },
  { key: 'electrician', nameEn: 'Electrician', nameHi: 'बिजली मिस्त्री', icon: <Zap size={14} />, matchPattern: 'electric' },
  { key: 'plumber', nameEn: 'Plumber', nameHi: 'नल मिस्त्री', icon: <Wrench size={14} />, matchPattern: 'plumb' },
  { key: 'cleaner', nameEn: 'Cleaner', nameHi: 'सफाई कर्मी', icon: <Sparkles size={14} />, matchPattern: 'clean' },
  { key: 'painter', nameEn: 'Painter', nameHi: 'पेंटर', icon: <Paintbrush size={14} />, matchPattern: 'paint' },
  { key: 'carpenter', nameEn: 'Carpenter', nameHi: 'बढ़ई', icon: <Hammer size={14} />, matchPattern: 'carpent' },
  { key: 'helper', nameEn: 'Labour & Shift', nameHi: 'लोडिंग व मजदूर', icon: <Truck size={14} />, matchPattern: 'load' },
  { key: 'cook', nameEn: 'Cook & Kitchen', nameHi: 'रसोइया', icon: <Utensils size={14} />, matchPattern: 'restaurant' },
];

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  lang,
  skillsList,
  workers,
  customerJobs,
  userLocation = { lat: 31.6340, lng: 74.8723, locality: 'Amritsar', isLive: false },
  onOpenPostJob,
  onRequestHireWorker,
  onViewApplicants,
  loading,
}) => {
  const t = translations[lang];

  // View state: 'map' or 'list'
  const [activeView, setActiveView] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('all');

  // Worker Sheets
  const [previewWorker, setPreviewWorker] = useState<NearbyWorker | null>(null);
  const [selectedWorkerForProfile, setSelectedWorkerForProfile] = useState<NearbyWorker | null>(null);

  // Filter workers based on search and category
  const filteredWorkers = workers.filter((w) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      w.name.toLowerCase().includes(query) ||
      (w.locality && w.locality.toLowerCase().includes(query)) ||
      w.skills.some((s) => s.name.toLowerCase().includes(query));

    if (selectedCategoryKey === 'all') return matchesSearch;

    const cat = CATEGORY_CHIPS.find((c) => c.key === selectedCategoryKey);
    const matchesCategory = cat
      ? w.skills.some((s) => s.name.toLowerCase().includes(cat.matchPattern))
      : true;

    return matchesSearch && matchesCategory;
  });

  // Convert workers to Google Map markers
  const mapMarkers: MapMarkerItem[] = filteredWorkers.map((w, idx) => {
    // Distribute around center if coordinates are clustered
    const offsetLat = (idx % 3 - 1) * 0.0035;
    const offsetLng = (Math.floor(idx / 3) % 3 - 1) * 0.0035;
    return {
      id: w.id,
      lat: userLocation.lat + offsetLat,
      lng: userLocation.lng + offsetLng,
      title: w.name,
      priceLabel: `₹${w.expected_wage}`,
      rating: w.rating,
      subtitle: w.skills[0]?.name || 'Worker',
      raw: w,
    };
  });

  const handleSelectMapMarker = (marker: MapMarkerItem) => {
    if (marker.raw) {
      setPreviewWorker(marker.raw);
    }
  };

  const totalApplicants = customerJobs.reduce((acc, j) => acc + (j.applicant_count || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* 1. Prompt & Search Section */}
      <div className="customer-hero">
        <h1 className="hero-prompt-title">{t.needHelpHeading}</h1>
        <p className="hero-prompt-sub">{t.needHelpSub}</p>

        <div className="search-input-box">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder={lang === 'hi' ? 'बिजली मिस्त्री, प्लंबर, पेंटर, हेल्पर खोजें...' : 'Search for electrician, plumber, cleaner, painter...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Horizontally Scrollable Categories */}
      <div className="category-scroll-container">
        {CATEGORY_CHIPS.map((cat) => {
          const isSelected = selectedCategoryKey === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              className={`category-chip ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedCategoryKey(isSelected && cat.key !== 'all' ? 'all' : cat.key)}
            >
              <span className="category-chip-icon">{cat.icon}</span>
              <span>{lang === 'hi' ? cat.nameHi : cat.nameEn}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Active Work Requests Alert (If any open jobs) */}
      {customerJobs.length > 0 && (
        <div
          onClick={() => onViewApplicants(customerJobs[0])}
          style={{
            margin: '10px 16px 0 16px',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={18} color="var(--brand-success)" />
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {customerJobs.length} {lang === 'hi' ? 'सक्रिय काम की मांग' : 'Active Work Request(s)'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {totalApplicants > 0
                  ? (lang === 'hi' ? `${totalApplicants} कामगारों ने आवेदन किया है` : `${totalApplicants} workers applied · Tap to view`)
                  : (lang === 'hi' ? 'आवेदन की प्रतीक्षा है...' : 'Waiting for nearby worker applications...')}
              </div>
            </div>
          </div>
          <ChevronRight size={16} color="var(--text-muted)" />
        </div>
      )}

      {/* 4. Map & List Mode Control Bar */}
      <div className="map-control-bar">
        <div className="nearby-count-title">
          <span>{lang === 'hi' ? 'पास के कामगार' : 'Nearby Workers'}</span>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            ({filteredWorkers.length})
          </span>
        </div>

        <div className="view-toggle-group">
          <button
            type="button"
            className={`view-toggle-btn ${activeView === 'map' ? 'active' : ''}`}
            onClick={() => setActiveView('map')}
          >
            <MapIcon size={14} />
            <span>Map</span>
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${activeView === 'list' ? 'active' : ''}`}
            onClick={() => setActiveView('list')}
          >
            <ListIcon size={14} />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* 5. Main Content Area: Map View or List View */}
      {activeView === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Interactive Google Map with custom price markers */}
          <GoogleMap
            center={{ lat: userLocation.lat, lng: userLocation.lng }}
            markers={mapMarkers}
            selectedMarkerId={previewWorker?.id}
            onSelectMarker={handleSelectMapMarker}
            height="290px"
          />

          {/* Quick List Preview below map */}
          <div className="feed-section">
            <div className="section-headline-row">
              <div className="section-headline">
                {lang === 'hi' ? 'उपलब्ध कामगार' : 'Available Today'}
              </div>
              <button
                type="button"
                className="section-link"
                onClick={() => setActiveView('list')}
              >
                {lang === 'hi' ? 'पूरी सूची देखें →' : 'See all workers →'}
              </button>
            </div>

            {loading ? (
              <div>
                <div className="skeleton-row" />
                <div className="skeleton-row" />
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="empty-state-view">
                <UserX size={28} className="empty-state-icon" />
                <div className="empty-state-title">
                  {lang === 'hi' ? 'इस श्रेणी में कोई कामगार नहीं मिला' : 'No workers found nearby'}
                </div>
                <div className="empty-state-desc">
                  {lang === 'hi' ? 'काम पोस्ट करें, पास के कामगार तुरंत आवेदन करेंगे।' : 'Post your work request and nearby workers will be notified instantly.'}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '8px' }}
                  onClick={onOpenPostJob}
                >
                  {t.postJobButton}
                </button>
              </div>
            ) : (
              filteredWorkers.slice(0, 4).map((w) => (
                <WorkerCard
                  key={w.id}
                  lang={lang}
                  worker={w}
                  onRequestHire={onRequestHireWorker}
                  onViewProfile={(worker) => setSelectedWorkerForProfile(worker)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* List View: Full vertical results */}
      {activeView === 'list' && (
        <div className="feed-section" style={{ flex: 1 }}>
          {loading ? (
            <div>
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="empty-state-view">
              <UserX size={32} className="empty-state-icon" />
              <div className="empty-state-title">
                {lang === 'hi' ? 'कोई कामगार उपलब्ध नहीं है' : 'No workers available right now'}
              </div>
              <div className="empty-state-desc">
                {lang === 'hi'
                  ? 'अपना काम पोस्ट करें — जैसे ही कोई कामगार उपलब्ध होगा, वह आवेदन करेगा।'
                  : 'Post a job now — nearby workers will apply as soon as they become available.'}
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '8px' }}
                onClick={onOpenPostJob}
              >
                {t.postJobButton}
              </button>
            </div>
          ) : (
            filteredWorkers.map((w) => (
              <WorkerCard
                key={w.id}
                lang={lang}
                worker={w}
                onRequestHire={onRequestHireWorker}
                onViewProfile={(worker) => setSelectedWorkerForProfile(worker)}
              />
            ))
          )}
        </div>
      )}

      {/* 6. Worker Quick Preview Bottom Sheet (Triggered by Map Marker Tap) */}
      <BottomSheet
        isOpen={Boolean(previewWorker)}
        onClose={() => setPreviewWorker(null)}
        title={previewWorker?.name || 'Worker Preview'}
        subtitle={previewWorker?.locality ? `${previewWorker.locality} · ${previewWorker.distance_km} km away` : 'Nearby Worker'}
        footer={
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const w = previewWorker;
                setPreviewWorker(null);
                if (w) setSelectedWorkerForProfile(w);
              }}
            >
              {lang === 'hi' ? 'प्रोफ़ाइल देखें' : 'View Profile'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const w = previewWorker;
                setPreviewWorker(null);
                if (w) onRequestHireWorker(w);
              }}
            >
              {lang === 'hi' ? 'हायर करें' : 'Hire Now'}
            </button>
          </div>
        }
      >
        {previewWorker && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {previewWorker.skills[0]?.name || 'Worker'}
                </span>
                <ShieldCheck size={16} color="var(--brand-success)" />
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                ₹{previewWorker.expected_wage}/{lang === 'hi' ? 'दिन' : 'day'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                {previewWorker.rating} ({previewWorker.jobs_completed} {lang === 'hi' ? 'काम' : 'jobs'})
              </span>
              <span>·</span>
              <span>{previewWorker.distance_km} km away</span>
              <span>·</span>
              <span style={{ color: 'var(--brand-success)', fontWeight: 600 }}>
                {lang === 'hi' ? 'आज उपलब्ध' : 'Available Today'}
              </span>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* 7. Worker Full Profile View */}
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
