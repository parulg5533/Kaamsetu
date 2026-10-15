'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Star, Info } from 'lucide-react';

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  priceLabel: string; // e.g. "₹700" or "₹800/day"
  rating?: number;
  subtitle?: string;
  raw?: any;
}

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers: MapMarkerItem[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: MapMarkerItem) => void;
  height?: string;
  className?: string;
}

type MapError = 'NO_KEY' | 'LOAD_FAILED' | 'AUTH_FAILURE' | 'INIT_FAILED';

// Quiet, uncluttered Google Maps light style (Uber/Google Maps consumer grade)
const MINIMAL_MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ lightness: 20 }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cce5ff' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
];

const SCRIPT_ID = 'google-maps-script';
const STAR_SVG =
  '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';

/* ------------------------------------------------------------------------ */
/* Module-level Google Maps loader (script injected once, promise cached)    */
/* ------------------------------------------------------------------------ */

let mapsPromise: Promise<void> | null = null;
let authFailed = false;
let authHooked = false;
const authListeners = new Set<() => void>();

function hookAuthFailure() {
  if (authHooked || typeof window === 'undefined') return;
  authHooked = true;
  (window as any).gm_authFailure = () => {
    authFailed = true;
    authListeners.forEach((listener) => listener());
  };
}

/**
 * Injects the Google Maps JS script once and caches the load promise.
 * On failure the cache is cleared (and the <script> removed) so a later mount can retry.
 */
export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser'));
  }
  hookAuthFailure();

  if ((window as any).google?.maps) return Promise.resolve();
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      mapsPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };
    document.head.appendChild(script);
  });

  return mapsPromise;
}

/* ------------------------------------------------------------------------ */
/* Overlay classes (created lazily once the google.maps namespace exists)    */
/* ------------------------------------------------------------------------ */

interface OverlayClasses {
  Price: new (item: MapMarkerItem, selected: boolean, onActivate: (item: MapMarkerItem) => void) => any;
  User: new () => any;
}

let overlayClasses: { g: any; classes: OverlayClasses } | null = null;

function getOverlayClasses(g: any): OverlayClasses {
  if (overlayClasses && overlayClasses.g === g) return overlayClasses.classes;

  class PriceMarkerOverlay extends g.maps.OverlayView {
    private el: HTMLButtonElement | null = null;
    private item: MapMarkerItem;
    private selected: boolean;
    private onActivate: (item: MapMarkerItem) => void;
    private pos: any;

    constructor(item: MapMarkerItem, selected: boolean, onActivate: (item: MapMarkerItem) => void) {
      super();
      this.item = item;
      this.selected = selected;
      this.onActivate = onActivate;
      this.pos = new g.maps.LatLng(item.lat, item.lng);
    }

    onAdd() {
      // Native <button>: focusable and activated by Enter/Space via the click event.
      const el = document.createElement('button');
      el.type = 'button';
      el.style.position = 'absolute';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onActivate(this.item);
      });
      this.el = el;
      this.applyState();
      this.getPanes()?.overlayMouseTarget.appendChild(el);
      this.draw();
    }

    private applyState() {
      const el = this.el;
      if (!el) return;
      el.className = `custom-price-marker${this.selected ? ' active' : ''}`;
      el.setAttribute('aria-label', `${this.item.title}, ${this.item.priceLabel}`);
      el.setAttribute('aria-pressed', this.selected ? 'true' : 'false');
      el.textContent = '';

      const label = document.createElement('span');
      label.textContent = this.item.priceLabel;
      el.appendChild(label);

      if (this.item.rating) {
        const rating = document.createElement('span');
        rating.className = 'marker-rating';
        rating.innerHTML = STAR_SVG;
        rating.appendChild(document.createTextNode(` ${this.item.rating}`));
        el.appendChild(rating);
      }
    }

    update(item: MapMarkerItem, selected: boolean) {
      this.item = item;
      this.selected = selected;
      this.pos = new g.maps.LatLng(item.lat, item.lng);
      this.applyState();
      this.draw();
    }

    draw() {
      const projection = this.getProjection();
      if (!projection || !this.el) return;
      const px = projection.fromLatLngToDivPixel(this.pos);
      if (px) {
        this.el.style.left = px.x + 'px';
        this.el.style.top = px.y + 'px';
      }
    }

    onRemove() {
      if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
      this.el = null;
    }
  }

  class UserLocationOverlay extends g.maps.OverlayView {
    private div: HTMLDivElement | null = null;
    private pos: any = null;

    onAdd() {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.transform = 'translate(-50%, -50%)';
      div.style.pointerEvents = 'none';
      div.innerHTML = `
        <div style="position: relative; width: 18px; height: 18px;">
          <div style="position: absolute; inset: -6px; border-radius: 50%; background: rgba(37, 99, 235, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 16px; height: 16px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `;
      this.div = div;
      this.getPanes()?.overlayMouseTarget.appendChild(div);
      this.draw();
    }

    setPosition(lat: number, lng: number) {
      this.pos = new g.maps.LatLng(lat, lng);
      this.draw();
    }

    draw() {
      const projection = this.getProjection();
      if (!projection || !this.div || !this.pos) return;
      const px = projection.fromLatLngToDivPixel(this.pos);
      if (px) {
        this.div.style.left = px.x + 'px';
        this.div.style.top = px.y + 'px';
      }
    }

    onRemove() {
      if (this.div && this.div.parentNode) this.div.parentNode.removeChild(this.div);
      this.div = null;
    }
  }

  const classes: OverlayClasses = {
    Price: PriceMarkerOverlay as unknown as OverlayClasses['Price'],
    User: UserLocationOverlay as unknown as OverlayClasses['User'],
  };
  overlayClasses = { g, classes };
  return classes;
}

/* ------------------------------------------------------------------------ */
/* Component                                                                 */
/* ------------------------------------------------------------------------ */

export const GoogleMap: React.FC<GoogleMapProps> = ({
  center,
  zoom = 14,
  markers,
  selectedMarkerId,
  onSelectMarker,
  height = '290px',
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userOverlayRef = useRef<any>(null);
  const markerOverlaysRef = useRef<Map<string, any>>(new Map());
  const onSelectRef = useRef(onSelectMarker);

  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<MapError | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Keep the latest callback without rebuilding markers when its identity changes.
  useEffect(() => {
    onSelectRef.current = onSelectMarker;
  }, [onSelectMarker]);

  // 1. Load the script and subscribe to auth-failure notifications.
  useEffect(() => {
    if (!apiKey) return;
    let isMounted = true;

    const handleAuthFailure = () => {
      if (isMounted) setLoadError('AUTH_FAILURE');
    };
    authListeners.add(handleAuthFailure);
    if (authFailed) handleAuthFailure();

    loadGoogleMaps(apiKey)
      .then(() => {
        if (isMounted && !authFailed) setMapReady(true);
      })
      .catch(() => {
        if (isMounted) setLoadError('LOAD_FAILED');
      });

    return () => {
      isMounted = false;
      authListeners.delete(handleAuthFailure);
    };
  }, [apiKey]);

  // 2. Create the map once, then pan it when the center changes.
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || !(window as any).google?.maps) return;
    const g = (window as any).google;

    try {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new g.maps.Map(mapContainerRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom,
          disableDefaultUI: true,
          zoomControl: true,
          styles: MINIMAL_MAP_STYLES,
          gestureHandling: 'greedy',
        });
      } else {
        mapInstanceRef.current.panTo({ lat: center.lat, lng: center.lng });
        mapInstanceRef.current.setZoom(zoom);
      }
    } catch (err) {
      console.error('Error creating Google Map instance:', err);
      setLoadError('INIT_FAILED');
    }
  }, [mapReady, center.lat, center.lng, zoom]);

  // 3. User-location pulse overlay follows the center.
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const g = (window as any).google;
    if (!g?.maps) return;

    if (!userOverlayRef.current) {
      const { User } = getOverlayClasses(g);
      userOverlayRef.current = new User();
      userOverlayRef.current.setMap(mapInstanceRef.current);
    }
    userOverlayRef.current.setPosition(center.lat, center.lng);
  }, [mapReady, center.lat, center.lng]);

  // 4. Diff price-pin overlays by marker id: add new, update existing, remove missing.
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const g = (window as any).google;
    if (!g?.maps) return;

    const { Price } = getOverlayClasses(g);
    const map = mapInstanceRef.current;
    const overlays = markerOverlaysRef.current;
    const activate = (item: MapMarkerItem) => onSelectRef.current?.(item);
    const nextIds = new Set(markers.map((m) => m.id));

    overlays.forEach((overlay, id) => {
      if (!nextIds.has(id)) {
        overlay.setMap(null);
        overlays.delete(id);
      }
    });

    markers.forEach((item) => {
      const selected = selectedMarkerId === item.id;
      const existing = overlays.get(item.id);
      if (existing) {
        existing.update(item, selected);
      } else {
        const overlay = new Price(item, selected, activate);
        overlay.setMap(map);
        overlays.set(item.id, overlay);
      }
    });
  }, [mapReady, markers, selectedMarkerId]);

  // Remove every overlay when the component unmounts.
  useEffect(() => {
    const overlays = markerOverlaysRef.current;
    return () => {
      overlays.forEach((overlay) => overlay.setMap(null));
      overlays.clear();
      if (userOverlayRef.current) userOverlayRef.current.setMap(null);
      userOverlayRef.current = null;
    };
  }, []);

  // Fallback: no API key, or the script / auth / init failed. Never claim "loaded" here.
  const fallbackMessage: string | null = !apiKey
    ? 'Map preview unavailable (no API key)'
    : loadError
      ? 'Map failed to load'
      : null;

  if (fallbackMessage) {
    return (
      <div className={`map-viewport dev-map-placeholder ${className}`} style={{ height }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div className="dev-map-badge">
            <Navigation size={12} style={{ color: 'var(--brand-accent)' }} />
            <span>Map Coordinates: {center.lat.toFixed(4)}°N, {center.lng.toFixed(4)}°E</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {markers.length} nearby markers
          </div>
        </div>

        <div style={{ margin: 'auto 0', textAlign: 'center', padding: '10px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <Info size={14} color="var(--brand-accent)" />
            {fallbackMessage}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Select any nearby pin below to see details:
          </div>
        </div>

        {/* Keyboard-accessible pin list used when the live map is unavailable */}
        <div className="dev-map-pin-list">
          {markers.map((m) => {
            const isSelected = selectedMarkerId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className={`dev-pin-chip ${isSelected ? 'active' : ''}`}
                aria-label={`${m.title}, ${m.priceLabel}`}
                aria-pressed={isSelected}
                onClick={() => onSelectRef.current?.(m)}
              >
                <MapPin size={12} color={isSelected ? 'var(--brand-accent-hover)' : 'var(--text-muted)'} />
                <span>{m.title}</span>
                <strong style={{ color: isSelected ? 'var(--brand-accent-hover)' : 'var(--brand-primary)' }}>
                  {m.priceLabel}
                </strong>
                {m.rating && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.72rem' }}>
                    <Star size={10} fill="#f59e0b" color="#f59e0b" /> {m.rating}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`map-viewport ${className}`} style={{ height }}>
      <div ref={mapContainerRef} className="google-map-canvas" />
    </div>
  );
};
