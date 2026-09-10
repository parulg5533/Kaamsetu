'use client';

import React, { useState } from 'react';
import { Search, Plus, Briefcase, Users, Clock, MapPin, Sparkles, Filter } from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { WorkerCard, NearbyWorker } from './WorkerCard';

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
  const [selectedSkillId, setSelectedSkillId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'WORKERS' | 'MY_POSTS'>('WORKERS');

  // Filtered workers based on search query and category
  const filteredWorkers = workers.filter((w) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      w.name.toLowerCase().includes(query) ||
      w.locality.toLowerCase().includes(query) ||
      w.skills.some((s) => s.name.toLowerCase().includes(query));

    const matchesCategory =
      selectedSkillId === 'ALL' || w.skills.some((s) => s.id === selectedSkillId);

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. Search Bar */}
      <div className="customer-search-section">
        <div className="customer-search-bar">
          <Search size={18} color="#f59e0b" />
          <input
            type="text"
            className="search-input"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 2. Category Filter Pills */}
        <div className="category-scroll-container">
          <button
            className={`category-chip ${selectedSkillId === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedSkillId('ALL')}
          >
            ⭐ {lang === 'hi' ? 'सभी श्रेणियां' : 'All Categories'}
          </button>
          {skillsList.map((skill) => (
            <button
              key={skill.id}
              className={`category-chip ${selectedSkillId === skill.id ? 'active' : ''}`}
              onClick={() => setSelectedSkillId(skill.id)}
            >
              {skill.name}
            </button>
          ))}
        </div>

        {/* 3. Hero Quick Post Job Card */}
        <div className="post-job-hero-card">
          <div>
            <div className="hero-text-title">{t.postJobCTA}</div>
            <div className="hero-text-sub">{t.postJobDesc}</div>
          </div>
          <button
            className="hero-action-btn"
            onClick={onOpenPostJob}
          >
            <Plus size={16} />
            {t.postJobButton}
          </button>
        </div>
      </div>

      {/* 4. Tab Switcher (Nearby Workers vs My Active Postings) */}
      <div style={{ padding: '0 20px', display: 'flex', gap: '8px' }}>
        <button
          className={`avail-btn ${activeTab === 'WORKERS' ? 'active-today' : ''}`}
          style={{ flex: 1, padding: '10px' }}
          onClick={() => setActiveTab('WORKERS')}
        >
          👷 {t.nearbyWorkersHeading.split(' (')[0]} ({filteredWorkers.length})
        </button>
        <button
          className={`avail-btn ${activeTab === 'MY_POSTS' ? 'active-tomorrow' : ''}`}
          style={{ flex: 1, padding: '10px' }}
          onClick={() => setActiveTab('MY_POSTS')}
        >
          📋 {t.activeJobsHeading} ({customerJobs.length})
        </button>
      </div>

      {/* 5. Content Feed */}
      <div className="feed-content">
        {activeTab === 'WORKERS' ? (
          loading ? (
            <>
              <div className="skeleton-card" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </>
          ) : filteredWorkers.length === 0 ? (
            <div className="empty-state">
              <Users size={36} />
              <p style={{ fontWeight: 700 }}>{t.noWorkersFound}</p>
              <button
                className="btn-apply"
                style={{ background: 'var(--primary)', color: '#000', padding: '8px 16px', fontSize: '0.84rem' }}
                onClick={onOpenPostJob}
              >
                {t.postJobButton}
              </button>
            </div>
          ) : (
            filteredWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                lang={lang}
                worker={worker}
                onRequestHire={onRequestHireWorker}
              />
            ))
          )
        ) : (
          /* My Active Job Postings */
          customerJobs.length === 0 ? (
            <div className="empty-state">
              <Briefcase size={36} />
              <p style={{ fontWeight: 700 }}>{t.noJobsPosted}</p>
              <button
                className="btn-apply"
                style={{ background: 'var(--primary)', color: '#000', padding: '8px 16px', fontSize: '0.84rem' }}
                onClick={onOpenPostJob}
              >
                {t.postJobButton}
              </button>
            </div>
          ) : (
            customerJobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  <div>
                    <div className="job-title">{job.title}</div>
                    <div className="business-sub">
                      <MapPin size={12} />
                      {job.locality} · {job.job_date}
                    </div>
                  </div>
                  <div className="wage-badge">₹{job.wage}/{lang === 'hi' ? 'दिन' : 'day'}</div>
                </div>

                <div className="job-meta-grid">
                  <div className="meta-chip">
                    <Clock size={12} />
                    {job.start_time} - {job.end_time}
                  </div>
                  <div className="meta-chip">
                    <Users size={12} />
                    {lang === 'hi' ? 'जरूरत:' : 'Needed:'} {job.workers_required} · {lang === 'hi' ? 'स्वीकृत:' : 'Accepted:'} {job.workers_accepted}
                  </div>
                  {job.food_provided && (
                    <div className="meta-chip food">
                      🍲 {t.foodProvided}
                    </div>
                  )}
                </div>

                <div className="job-actions">
                  <button
                    className="btn-apply"
                    style={{ background: '#3b82f6', color: '#fff' }}
                    onClick={() => onViewApplicants(job)}
                  >
                    <Users size={16} />
                    {t.viewApplicants} ({job.applicant_count})
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
