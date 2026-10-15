'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Navigation, Clock, MapPin, X, Check } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Language } from '@/lib/translations';

export interface LocationItem {
  locality: string;
  city: string;
  lat: number;
  lng: number;
  /** true when the position came from the device GPS (live), false for a picked area. */
  isLive: boolean;
}

// Popular locations in pilot region with accurate coordinates
const POPULAR_LOCALITIES: LocationItem[] = [
  { locality: 'Ranjit Avenue', city: 'Amritsar', lat: 31.6340, lng: 74.8723, isLive: false },
  { locality: 'Lawrence Road', city: 'Amritsar', lat: 31.6375, lng: 74.8780, isLive: false },
  { locality: 'Mall Road', city: 'Amritsar', lat: 31.6390, lng: 74.8750, isLive: false },
  { locality: 'Hall Bazaar', city: 'Amritsar', lat: 31.6310, lng: 74.8765, isLive: false },
  { locality: 'Putligarh', city: 'Amritsar', lat: 31.6280, lng: 74.8550, isLive: false },
  { locality: 'GT Road Industrial', city: 'Amritsar', lat: 31.6250, lng: 74.8650, isLive: false },
  { locality: 'Civil Lines', city: 'Amritsar', lat: 31.6430, lng: 74.8820, isLive: false },
  { locality: 'Golden Temple Area', city: 'Amritsar', lat: 31.6200, lng: 74.8765, isLive: false },
  { locality: 'Connaught Place', city: 'New Delhi', lat: 28.6315, lng: 77.2167, isLive: false },
  { locality: 'Sector 17', city: 'Chandigarh', lat: 30.7415, lng: 76.7681, isLive: false },
];

const RECENT_LOCATIONS: LocationItem[] = [
  { locality: 'Ranjit Avenue', city: 'Amritsar', lat: 31.6340, lng: 74.8723, isLive: false },
  { locality: 'Lawrence Road', city: 'Amritsar', lat: 31.6375, lng: 74.8780, isLive: false },
];

type GpsError = 'unsupported' | 'denied' | 'timeout' | 'unavailable';

// Minimal typing for the parts of the Google Maps JS API we touch (no global typings assumed).
interface GeocoderAddressComponent {
  long_name: string;
  types: string[];
}
interface GeocoderResult {
  address_components: GeocoderAddressComponent[];
}
interface GoogleGeocoder {
  geocode(
    request: { location: { lat: number; lng: number } },
    callback: (results: GeocoderResult[] | null, status: string) => void
  ): void;
}
interface GoogleWindow {
  google?: { maps?: { Geocoder?: new () => GoogleGeocoder } };
}

/**
 * Reverse-geocodes a point with Google Maps when it is loaded.
 * Resolves null when the API is unavailable, fails, or does not answer in time.
 */
function reverseGeocodeArea(lat: number, lng: number): Promise<{ locality: string; city: string } | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const Geocoder = (window as unknown as GoogleWindow).google?.maps?.Geocoder;
    if (!Geocoder) {
      resolve(null);
      return;
    }
    const timer = window.setTimeout(() => resolve(null), 4000);
    try {
      new Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
        window.clearTimeout(timer);
        const components = results?.[0]?.address_components ?? [];
        const find = (...types: string[]) =>
          components.find((c) => types.some((t) => c.types.includes(t)))?.long_name;
        const locality = find('sublocality_level_1', 'sublocality', 'neighborhood', 'locality');
        const city = find('locality', 'administrative_area_level_2') ?? '';
        resolve(status === 'OK' && locality ? { locality, city } : null);
      });
    } catch {
      window.clearTimeout(timer);
      resolve(null);
    }
  });
}

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
  const [gpsError, setGpsError] = useState<GpsError | null>(null);
  // Each GPS request gets a token; bumping the ref invalidates any request still in flight.
  const gpsTokenRef = useRef(0);

  const hi = lang === 'hi';

  const cancelGps = () => {
    gpsTokenRef.current += 1;
    setIsDetectingGps(false);
  };

  // Invalidate pending GPS work when the modal closes or unmounts.
  useEffect(() => {
    if (!isOpen) {
      gpsTokenRef.current += 1;
      setIsDetectingGps(false);
      setGpsError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      gpsTokenRef.current += 1;
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    cancelGps();
    onClose();
  };

  const handlePick = (loc: LocationItem) => {
    cancelGps();
    onSelectLocation(loc);
    onClose();
  };

  // Filter localities by search query
  const filteredPopular = POPULAR_LOCALITIES.filter((item) =>
    item.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsError('unsupported');
      return;
    }

    const token = gpsTokenRef.current + 1;
    gpsTokenRef.current = token;
    setGpsError(null);
    setIsDetectingGps(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const area = await reverseGeocodeArea(lat, lng);
        if (token !== gpsTokenRef.current) return; // user picked elsewhere, closed, or unmounted

        setIsDetectingGps(false);
        onSelectLocation({
          locality: area?.locality ?? `Near you (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          city: area?.city ?? '',
          lat,
          lng,
          isLive: true,
        });
        onClose();
      },
      (err) => {
        if (token !== gpsTokenRef.current) return;
        setIsDetectingGps(false);
        if (err.code === err.PERMISSION_DENIED) setGpsError('denied');
        else if (err.code === err.TIMEOUT) setGpsError('timeout');
        else setGpsError('unavailable');
      },
      { timeout: 8000 }
    );
  };

  const GPS_ERROR_TEXT: Record<GpsError, string> = {
    unsupported: hi
      ? 'इस डिवाइस पर लोकेशन समर्थित नहीं है। नीचे से क्षेत्र चुनें।'
      : 'Location is not supported on this device. Pick an area below.',
    denied: hi
      ? 'लोकेशन की अनुमति नहीं मिली। ब्राउज़र सेटिंग्स में अनुमति दें या नीचे से क्षेत्र चुनें।'
      : 'Location permission was denied. Allow it in your browser settings or pick an area below.',
    timeout: hi
      ? 'लोकेशन खोजने में बहुत समय लगा। फिर से कोशिश करें या नीचे से क्षेत्र चुनें।'
      : 'Finding your location took too long. Try again or pick an area below.',
    unavailable: hi
      ? 'आपकी लोकेशन पता नहीं चल पाई। फिर से कोशिश करें या नीचे से क्षेत्र चुनें।'
      : 'Your location could not be determined. Try again or pick an area below.',
  };

  const rowButtonStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    font: 'inherit',
    color: 'inherit',
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={hi ? 'स्थान चुनें' : 'Choose Your Location'}
      subtitle={hi ? 'पास के कामगारों और काम को खोजने के लिए' : 'To discover verified workers and jobs nearby'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 1. Search Box */}
        <div className="search-input-box" style={{ height: '44px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder={hi ? 'इलाका, लैंडमार्क या शहर खोजें...' : 'Search locality, landmark, or area...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              aria-label={hi ? 'खोज साफ़ करें' : 'Clear search'}
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* 2. One-Tap Current GPS Location Button */}
        <div>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isDetectingGps}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              cursor: isDetectingGps ? 'wait' : 'pointer',
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
                  ? (hi ? 'स्थान खोज रहे हैं...' : 'Detecting GPS location...')
                  : (hi ? 'वर्तमान स्थान का उपयोग करें' : 'Use Current Location')}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {hi ? 'GPS द्वारा सटीक पास के कामगार दिखाएं' : 'Using device GPS for precise nearby discovery'}
              </div>
            </div>
          </button>
          {gpsError && (
            <div
              role="alert"
              style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--brand-danger)', marginTop: '6px', padding: '0 4px' }}
            >
              {GPS_ERROR_TEXT[gpsError]}
            </div>
          )}
        </div>

        {/* 3. Popular areas (static list) */}
        {!searchQuery && RECENT_LOCATIONS.length > 0 && (
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              {hi ? 'लोकप्रिय क्षेत्र' : 'Popular areas'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {RECENT_LOCATIONS.map((loc) => (
                <button
                  key={loc.locality}
                  type="button"
                  onClick={() => handlePick(loc)}
                  style={{
                    ...rowButtonStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {loc.locality}, {loc.city}
                    </span>
                  </span>
                  {currentLocality.includes(loc.locality) && (
                    <Check size={16} color="var(--brand-accent)" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Nearby / Searched Areas */}
        <div>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            {searchQuery ? (hi ? 'खोज परिणाम' : 'Search Results') : (hi ? 'प्रमुख क्षेत्र' : 'Popular Nearby Areas')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '220px', overflowY: 'auto' }}>
            {filteredPopular.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '12px', textAlign: 'center' }}>
                {hi ? 'कोई क्षेत्र नहीं मिला' : 'No matching area found'}
              </div>
            ) : (
              filteredPopular.map((loc) => (
                <button
                  key={loc.locality}
                  type="button"
                  onClick={() => handlePick(loc)}
                  style={{
                    ...rowButtonStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={15} color="var(--brand-accent)" />
                    <span style={{ display: 'block' }}>
                      <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {loc.locality}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        {loc.city}
                      </span>
                    </span>
                  </span>
                  {currentLocality.includes(loc.locality) && (
                    <Check size={16} color="var(--brand-accent)" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
