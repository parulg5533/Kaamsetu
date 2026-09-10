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

// Quiet, uncluttered Google Maps light style (Uber/Google Maps consumer grade)
const MINIMAL_MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ lightness: 20 }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cce5ff' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
];

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
  const markersRef = useRef<{ [id: string]: any }>({});

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // 1. Script Loader for Google Maps JavaScript API
  useEffect(() => {
    if (!apiKey) {
      setMapError('API_KEY_NOT_CONFIGURED');
      return;
    }

    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setMapLoaded(true);
      };

      script.onerror = () => {
        setMapError('FAILED_TO_LOAD_SCRIPT');
      };

      // Listen for auth failure
      (window as any).gm_authFailure = () => {
        setMapError('AUTH_FAILURE');
      };

      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setMapLoaded(true));
      script.addEventListener('error', () => setMapError('FAILED_TO_LOAD_SCRIPT'));
    }
  }, [apiKey]);

  // 2. Initialize Map Instance
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !(window as any).google?.maps) return;

    const g = (window as any).google;
    try {
      if (!mapInstanceRef.current) {
        const map = new g.maps.Map(mapContainerRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom,
          disableDefaultUI: true,
          zoomControl: true,
          styles: MINIMAL_MAP_STYLES,
          gestureHandling: 'greedy',
        });
        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.panTo({ lat: center.lat, lng: center.lng });
      }
    } catch (err: any) {
      console.error('Error creating Google Map instance:', err);
      setMapError('MAP_INIT_ERROR');
    }
  }, [mapLoaded, center.lat, center.lng, zoom]);

  // 3. Render Custom Markers via OverlayView
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !(window as any).google?.maps) return;

    const g = (window as any).google;
    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((overlay: any) => {
      if (overlay && overlay.setMap) overlay.setMap(null);
    });
    markersRef.current = {};

    // Center marker (User GPS position pulse)
    class UserLocationOverlay extends g.maps.OverlayView {
      div: HTMLDivElement | null = null;
      position: any;

      constructor(pos: any) {
        super();
        this.position = pos;
      }

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
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(div);
      }

      draw() {
        const overlayProjection = this.getProjection();
        if (!overlayProjection || !this.div) return;
        const pos = overlayProjection.fromLatLngToDivPixel(this.position);
        if (pos) {
          this.div.style.left = pos.x + 'px';
          this.div.style.top = pos.y + 'px';
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const userOverlay = new UserLocationOverlay(new g.maps.LatLng(center.lat, center.lng));
    userOverlay.setMap(map);
    markersRef.current['__user_loc'] = userOverlay;

    // Custom HTML Price Pills for Workers or Jobs
    markers.forEach((item) => {
      class PriceMarkerOverlay extends g.maps.OverlayView {
        div: HTMLDivElement | null = null;
        position: any;

        constructor(pos: any) {
          super();
          this.position = pos;
        }

        onAdd() {
          const isSelected = selectedMarkerId === item.id;
          const div = document.createElement('div');
          div.className = `custom-price-marker ${isSelected ? 'active' : ''}`;
          div.style.position = 'absolute';
          div.style.cursor = 'pointer';

          const ratingHtml = item.rating
            ? `<span class="marker-rating"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> ${item.rating}</span>`
            : '';

          div.innerHTML = `
            <span>${item.priceLabel}</span>
            ${ratingHtml}
          `;

          div.onclick = (e: any) => {
            e.stopPropagation();
            if (onSelectMarker) onSelectMarker(item);
          };

          this.div = div;
          const panes = this.getPanes();
          panes?.overlayMouseTarget.appendChild(div);
        }

        draw() {
          const overlayProjection = this.getProjection();
          if (!overlayProjection || !this.div) return;
          const pos = overlayProjection.fromLatLngToDivPixel(this.position);
          if (pos) {
            this.div.style.left = pos.x + 'px';
            this.div.style.top = pos.y + 'px';
          }
        }

        onRemove() {
          if (this.div && this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
          }
        }
      }

      const overlay = new PriceMarkerOverlay(new g.maps.LatLng(item.lat, item.lng));
      overlay.setMap(map);
      markersRef.current[item.id] = overlay;
    });
  }, [mapLoaded, markers, selectedMarkerId, center.lat, center.lng, onSelectMarker]);

  // Non-blocking Dev Placeholder when Google Maps API key is not configured or fails
  if (mapError) {
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
            {apiKey
              ? 'Google Maps loaded in dev-ready mode'
              : 'Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env for live tiles'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Tap any nearby pin below to inspect details directly:
          </div>
        </div>

        {/* Interactive pin selector in development fallback */}
        <div className="dev-map-pin-list">
          {markers.map((m) => {
            const isSelected = selectedMarkerId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className={`dev-pin-chip ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectMarker && onSelectMarker(m)}
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
