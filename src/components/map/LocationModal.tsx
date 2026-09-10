'use client';

import React, { useState } from 'react';
import { Search, Navigation, Clock, MapPin, X, Check } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Language } from '@/lib/translations';

export interface LocationItem {
  locality: string;
  city: string;
  lat: number;
  lng: number;
}

// Popular locations in pilot region with accurate coordinates
const POPULAR_LOCALITIES: LocationItem[] = [
  { locality: 'Ranjit Avenue', city: 'Amritsar', lat: 31.6340, lng: 74.8723 },
  { locality: 'Lawrence Road', city: 'Amritsar', lat: 31.6375, lng: 74.8780 },
  { locality: 'Mall Road', city: 'Amritsar', lat: 31.6390, lng: 74.8750 },
  { locality: 'Hall Bazaar', city: 'Amritsar', lat: 31.6310, lng: 74.8765 },
  { locality: 'Putligarh', city: 'Amritsar', lat: 31.6280, lng: 74.8550 },
  { locality: 'GT Road Industrial', city: 'Amritsar', lat: 31.6250, lng: 74.8650 },
  { locality: 'Civil Lines', city: 'Amritsar', lat: 31.6430, lng: 74.8820 },
  { locality: 'Golden Temple Area', city: 'Amritsar', lat: 31.6200, lng: 74.8765 },
  { locality: 'Connaught Place', city: 'New Delhi', lat: 28.6315, lng: 77.2167 },
  { locality: 'Sector 17', city: 'Chandigarh', lat: 30.7415, lng: 76.7681 },
];

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentLocality: string;
  onSelectLocation: (loc: LocationItem) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentLocality,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [recentLocations] = useState<LocationItem[]>([
    { locality: 'Ranjit Avenue', city: 'Amritsar', lat: 31.6340, lng: 74.8723 },
    { locality: 'Lawrence Road', city: 'Amritsar', lat: 31.6375, lng: 74.8780 },
  ]);

  if (!isOpen) return null;

  // Filter localities by search query
  const filteredPopular = POPULAR_LOCALITIES.filter((item) =>
    item.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUseCurrentLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setIsDetectingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsDetectingGps(false);
          onSelectLocation({
            locality: 'Current GPS Location',
            city: 'Local Area',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          onClose();
        },
        (err) => {
          setIsDetectingGps(false);
          alert(lang === 'hi' ? 'GPS अनुमति नहीं मिली।' : 'GPS location access was denied or timed out.');
        },
        { timeout: 8000 }
      );
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'hi' ? 'स्थान चुनें' : 'Choose Your Location'}
      subtitle={lang === 'hi' ? 'पास के कामगारों और काम को खोजने के लिए' : 'To discover verified workers and jobs nearby'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 1. Search Box */}
        <div className="search-input-box" style={{ height: '44px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder={lang === 'hi' ? 'इलाका, लैंडमार्क या शहर खोजें...' : 'Search locality, landmark, or area...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* 2. One-Tap Current GPS Location Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isDetectingGps}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--brand-primary)',
              color: 'var(--text-inverse)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Navigation size={15} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isDetectingGps
                ? (lang === 'hi' ? 'स्थान खोज रहे हैं...' : 'Detecting GPS location...')
                : (lang === 'hi' ? 'वर्तमान स्थान का उपयोग करें' : 'Use Current Location')}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {lang === 'hi' ? 'GPS द्वारा सटीक पास के कामगार दिखाएं' : 'Using device GPS for precise nearby discovery'}
            </div>
          </div>
        </button>

        {/* 3. Recent Locations */}
        {!searchQuery && recentLocations.length > 0 && (
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              {lang === 'hi' ? 'हाल के स्थान' : 'Recent Locations'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recentLocations.map((loc) => (
                <div
                  key={loc.locality}
                  onClick={() => {
                    onSelectLocation(loc);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {loc.locality}, {loc.city}
                    </span>
                  </div>
                  {currentLocality.includes(loc.locality) && (
                    <Check size={16} color="var(--brand-accent)" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Nearby / Searched Areas */}
        <div>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            {searchQuery ? (lang === 'hi' ? 'खोज परिणाम' : 'Search Results') : (lang === 'hi' ? 'प्रमुख क्षेत्र' : 'Popular Nearby Areas')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '220px', overflowY: 'auto' }}>
            {filteredPopular.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '12px', textAlign: 'center' }}>
                {lang === 'hi' ? 'कोई क्षेत्र नहीं मिला' : 'No matching area found'}
              </div>
            ) : (
              filteredPopular.map((loc) => (
                <div
                  key={loc.locality}
                  onClick={() => {
                    onSelectLocation(loc);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={15} color="var(--brand-accent)" />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {loc.locality}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        {loc.city}
                      </div>
                    </div>
                  </div>
                  {currentLocality.includes(loc.locality) && (
                    <Check size={16} color="var(--brand-accent)" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
