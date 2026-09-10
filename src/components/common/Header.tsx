'use client';

import React from 'react';
import { MapPin, Globe, Sparkles, LogOut, KeyRound } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  currentUser: {
    name: string;
    role: 'WORKER' | 'BUSINESS';
  } | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  const t = translations[lang];

  return (
    <header className="app-header">
      {/* Top Brand & Language Controls */}
      <div className="header-brand-row">
        <div className="brand-logo">
          <span>Kaam</span>Setu
        </div>

        <div className="header-controls">
          <button
            onClick={onToggleLang}
            className="lang-toggle-btn"
            title="Switch Language / भाषा बदलें"
            aria-label="Toggle language between English and Hindi"
          >
            <Globe size={13} color="#f59e0b" />
            <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          <button
            onClick={onOpenLogin}
            style={{
              background: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              borderRadius: '9999px',
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <KeyRound size={12} />
            {t.switchAccount}
          </button>

          {currentUser && (
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                borderRadius: '9999px',
                padding: '4px 8px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              title={t.signOut}
              aria-label="Sign out"
            >
              <LogOut size={12} />
            </button>
          )}
        </div>
      </div>

      {/* User Greeting and Locality */}
      <div className="header-user-row">
        <div>
          <div className="user-greeting-title">
            {currentUser ? `${currentUser.name.split(' ')[0]} 👋` : t.appName}
          </div>
          <div className="user-loc-pill">
            <MapPin size={12} color="#f59e0b" />
            {t.pilotLocality}
          </div>
        </div>

        {currentUser && (
          <div
            className={`role-pill-badge ${
              currentUser.role === 'BUSINESS' ? 'business' : ''
            }`}
          >
            {currentUser.role === 'WORKER' ? '👷' : '🏪'}
            <span>{currentUser.role === 'WORKER' ? t.worker : t.customer}</span>
          </div>
        )}
      </div>
    </header>
  );
};
