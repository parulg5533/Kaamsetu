'use client';

import React from 'react';
import { Compass, Briefcase, PhoneCall, User } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

export type NavTab = 'EXPLORE' | 'MY_JOBS' | 'CALLS' | 'PROFILE';

interface BottomNavProps {
  lang: Language;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  myJobsCount?: number;
  unlockedCallsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  lang,
  activeTab,
  onSelectTab,
  myJobsCount = 0,
  unlockedCallsCount = 0,
}) => {
  const t = translations[lang];

  return (
    <nav className="bottom-nav-bar" aria-label="Main Navigation">
      <button
        className={`bottom-nav-item ${activeTab === 'EXPLORE' ? 'active' : ''}`}
        onClick={() => onSelectTab('EXPLORE')}
      >
        <Compass size={20} />
        <span>{t.navExplore}</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'MY_JOBS' ? 'active' : ''}`}
        onClick={() => onSelectTab('MY_JOBS')}
      >
        <div style={{ position: 'relative' }}>
          <Briefcase size={20} />
          {myJobsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                background: '#f59e0b',
                color: '#000',
                fontSize: '0.62rem',
                fontWeight: 800,
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {myJobsCount}
            </span>
          )}
        </div>
        <span>{t.navMyJobs}</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'CALLS' ? 'active' : ''}`}
        onClick={() => onSelectTab('CALLS')}
      >
        <div style={{ position: 'relative' }}>
          <PhoneCall size={20} />
          {unlockedCallsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                background: '#10b981',
                color: '#fff',
                fontSize: '0.62rem',
                fontWeight: 800,
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unlockedCallsCount}
            </span>
          )}
        </div>
        <span>{t.navCalls}</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'PROFILE' ? 'active' : ''}`}
        onClick={() => onSelectTab('PROFILE')}
      >
        <User size={20} />
        <span>{t.navProfile}</span>
      </button>
    </nav>
  );
};
