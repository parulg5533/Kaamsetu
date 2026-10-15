'use client';

import React from 'react';
import { MapPin, Globe, ChevronDown, ArrowLeftRight } from 'lucide-react';
import { Language } from '@/lib/translations';

export interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  currentUser: {
    name: string;
    role: 'WORKER' | 'BUSINESS';
    phone?: string;
  } | null;
  localityName?: string;
  isGpsActive?: boolean;
  onOpenLocationModal: () => void;
  /** Shown when logged out. */
  onOpenLogin: () => void;
  /** Shown when logged in (avatar button). */
  onOpenProfile: () => void;
  onToggleRole?: () => Promise<void> | void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  currentUser,
  localityName = 'Ranjit Avenue, Amritsar',
  isGpsActive = false,
  onOpenLocationModal,
  onOpenLogin,
  onOpenProfile,
  onToggleRole,
}) => {
  return (
    <header className="app-header">
      {/* Location Selector (Uber / Zomato style) */}
      <button
        type="button"
        className="header-location-btn"
        onClick={onOpenLocationModal}
        aria-label="Change location"
      >
        <div className="header-location-icon">
          <MapPin size={18} color="var(--brand-accent)" />
        </div>
        <div className="header-location-text">
          <div className="header-location-locality">
            <span>{localityName}</span>
            {isGpsActive && (
              <span
                role="img"
                aria-label={lang === 'hi' ? 'लाइव GPS सक्रिय' : 'Live GPS active'}
                title={lang === 'hi' ? 'लाइव GPS सक्रिय' : 'Live GPS active'}
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#16a34a',
                  boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.2)',
                  flexShrink: 0,
                }}
              />
            )}
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div className="header-location-sub">
            {lang === 'hi' ? 'स्थान बदलें' : 'Change Location'}
          </div>
        </div>
      </button>

      {/* Right Controls: Lang + Profile / Role Switch */}
      <div className="header-actions">
        {/* Language Switch */}
        <button
          type="button"
          onClick={onToggleLang}
          className="lang-switch-btn"
          aria-label="Toggle language"
        >
          <Globe size={13} />
          <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
        </button>

        {/* Quick Role Toggle (Worker <-> Customer) */}
        {currentUser && onToggleRole && (
          <button
            type="button"
            onClick={() => {
              void onToggleRole();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title={lang === 'hi' ? 'भूमिका बदलें' : 'Switch role'}
          >
            <ArrowLeftRight size={12} />
            <span>{currentUser.role === 'WORKER' ? 'Worker' : 'Customer'}</span>
          </button>
        )}

        {/* Profile Avatar / Login */}
        {currentUser ? (
          <button
            type="button"
            className="header-profile-btn"
            onClick={onOpenProfile}
            aria-label={lang === 'hi' ? 'प्रोफ़ाइल खोलें' : 'Open profile'}
            title={currentUser.name}
          >
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            style={{ minHeight: '32px', padding: '4px 12px', fontSize: '0.78rem' }}
            onClick={onOpenLogin}
          >
            {lang === 'hi' ? 'लॉगिन' : 'Login'}
          </button>
        )}
      </div>
    </header>
  );
};
