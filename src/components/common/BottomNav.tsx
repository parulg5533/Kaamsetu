'use client';

import React from 'react';
import { Home, Briefcase, MessageSquare, User } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

export type NavTab = 'EXPLORE' | 'MY_JOBS' | 'MESSAGES' | 'PROFILE';

interface BottomNavProps {
  lang: Language;
  userRole?: 'WORKER' | 'BUSINESS';
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  myJobsCount?: number;
  messagesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  lang,
  userRole = 'BUSINESS',
  activeTab,
  onSelectTab,
  myJobsCount = 0,
  messagesCount = 0,
}) => {
  const isWorker = userRole === 'WORKER';

  return (
    <nav className="bottom-nav" aria-label="Main Navigation">
      {/* 1. Home */}
      <button
        type="button"
        className={`nav-item ${activeTab === 'EXPLORE' ? 'active' : ''}`}
        onClick={() => onSelectTab('EXPLORE')}
      >
        <Home size={20} />
        <span>{lang === 'hi' ? 'होम' : 'Home'}</span>
      </button>

      {/* 2. Jobs / Applications */}
      <button
        type="button"
        className={`nav-item ${activeTab === 'MY_JOBS' ? 'active' : ''}`}
        onClick={() => onSelectTab('MY_JOBS')}
      >
        <div style={{ position: 'relative' }}>
          <Briefcase size={20} />
          {myJobsCount > 0 && (
            <span className="nav-badge">{myJobsCount}</span>
          )}
        </div>
        <span>{isWorker ? (lang === 'hi' ? 'आवेदन' : 'Applications') : (lang === 'hi' ? 'मेरे काम' : 'Jobs')}</span>
      </button>

      {/* 3. Messages & Coordination */}
      <button
        type="button"
        className={`nav-item ${activeTab === 'MESSAGES' ? 'active' : ''}`}
        onClick={() => onSelectTab('MESSAGES')}
      >
        <div style={{ position: 'relative' }}>
          <MessageSquare size={20} />
          {messagesCount > 0 && (
            <span className="nav-badge">{messagesCount}</span>
          )}
        </div>
        <span>{lang === 'hi' ? 'संदेश' : 'Messages'}</span>
      </button>

      {/* 4. Profile */}
      <button
        type="button"
        className={`nav-item ${activeTab === 'PROFILE' ? 'active' : ''}`}
        onClick={() => onSelectTab('PROFILE')}
      >
        <User size={20} />
        <span>{lang === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}</span>
      </button>
    </nav>
  );
};
