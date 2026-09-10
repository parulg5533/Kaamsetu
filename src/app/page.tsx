'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Briefcase,
  Clock,
  Utensils,
  CheckCircle2,
  Phone,
  MessageSquare,
  Plus,
  Star,
  Users,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface UserSession {
  id: string;
  name: string;
  phone: string;
  role: 'WORKER' | 'BUSINESS';
}

// Pre-seeded Demo Personas for 1-click evaluation
const DEMO_PERSONAS = [
  {
    id: 'worker-rahul',
    name: 'Rahul Kumar (Worker)',
    role: 'WORKER' as const,
    phone: '9876543210',
    title: 'Restaurant & Shop Helper',
    locality: 'Ranjit Avenue, Amritsar',
  },
  {
    id: 'biz-sharma',
    name: 'Sharma Restaurant (Business)',
    role: 'BUSINESS' as const,
    phone: '9812345678',
    title: 'Restaurant & Dhaba',
    locality: 'Lawrence Road, Amritsar',
  },
  {
    id: 'worker-aman',
    name: 'Aman Singh (Worker)',
    role: 'WORKER' as const,
    phone: '9876543211',
    title: 'Loading & Delivery Helper',
    locality: 'Mall Road, Amritsar',
  },
  {
    id: 'biz-punjab',
    name: 'Punjab Logistics (Business)',
    role: 'BUSINESS' as const,
    phone: '9812345680',
    title: 'Transport & Godown',
    locality: 'GT Road, Amritsar',
  },
];

export default function KaamSetuApp() {
  // Current user / persona state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string>('');
  const [activePersonaKey, setActivePersonaKey] = useState<string>('worker-rahul');

  // Worker state
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [availability, setAvailability] = useState<string>('AVAILABLE_TODAY');
  const [workerTab, setWorkerTab] = useState<'NEARBY' | 'APPLICATIONS'>('NEARBY');
  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);

  // Business state
  const [businessJobs, setBusinessJobs] = useState<any[]>([]);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<any | null>(null);
  const [applicantsList, setApplicantsList] = useState<any[]>([]);

  // Modals
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{
    jobId: string;
    toUserId: string;
    toName: string;
    role: string;
  } | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [selectedTag, setSelectedTag] = useState('Punctual');
  const [ratingComment, setRatingComment] = useState('');

  // Post Job Form State
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [postJobForm, setPostJobForm] = useState({
    skill_id: '',
    title: '',
    description: '',
    workers_required: 1,
    wage: 650,
    food_provided: true,
    job_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '20:00',
    locality: 'Lawrence Road, Amritsar',
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Dedicated Login Window state
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginRole, setLoginRole] = useState<'WORKER' | 'BUSINESS'>('WORKER');
  const [loginStep, setLoginStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginLocality, setLoginLocality] = useState('Amritsar');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Authenticate persona
  const switchPersona = useCallback(async (personaKey: string) => {
    const persona = DEMO_PERSONAS.find((p) => p.id === personaKey);
    if (!persona) return;

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: persona.phone,
          otp: '1234',
          role: persona.role,
          name: persona.name.split(' (')[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser({
          id: data.user.id,
          name: data.user.name,
          phone: data.user.phone,
          role: data.user.role,
        });
        setToken(data.token);
        setActivePersonaKey(personaKey);
      }
    } catch (err) {
      console.error('Failed to authenticate persona:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    switchPersona('worker-rahul');
    // Load skills
    fetch('/api/v1/skills')
      .then((res) => res.json())
      .then((data) => {
        if (data.skills) {
          setSkillsList(data.skills);
          if (data.skills.length > 0) {
            setPostJobForm((prev) => ({ ...prev, skill_id: data.skills[0].id }));
          }
        }
      });
  }, [switchPersona]);

  // Load Worker Data
  const loadWorkerData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'WORKER') return;
    try {
      // 1. Worker Profile
      const profRes = await fetch(`/api/v1/worker/profile?userId=${currentUser.id}`);
      const profData = await profRes.json();
      if (profData.success && profData.worker) {
        setWorkerProfile(profData.worker);
        setAvailability(profData.worker.availability);
      }

      // 2. Nearby Jobs
      const jobsRes = await fetch(
        `/api/v1/jobs/nearby?lat=31.6340&lng=74.8723&max_distance=10.0&worker_id=${currentUser.id}`
      );
      const jobsData = await jobsRes.json();
      if (jobsData.success) {
        setNearbyJobs(jobsData.jobs || []);
      }

      // 3. Worker Applications
      const appsRes = await fetch(
        `/api/v1/worker/applications?worker_id=${currentUser.id}`
      );
      const appsData = await appsRes.json();
      if (appsData.success) {
        setMyApplications(appsData.applications || []);
      }
    } catch (err) {
      console.error('Error loading worker data:', err);
    }
  }, [currentUser]);

  // Load Business Data
  const loadBusinessData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'BUSINESS') return;
    try {
      const res = await fetch(`/api/v1/business/jobs?business_id=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setBusinessJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Error loading business data:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === 'WORKER') {
      loadWorkerData();
    } else if (currentUser?.role === 'BUSINESS') {
      loadBusinessData();
    }
  }, [currentUser, loadWorkerData, loadBusinessData]);

  // Update Worker Availability
  const handleAvailabilityChange = async (newStatus: string) => {
    if (!currentUser) return;
    setAvailability(newStatus);
    try {
      await fetch('/api/v1/worker/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, availability: newStatus }),
      });
      showMessage('Availability updated: ' + newStatus.replace('_', ' '));
    } catch (err) {
      console.error('Error setting availability:', err);
    }
  };

  // 1-Tap Apply for Job
  const handleApply = async (jobId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: currentUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage('Applied successfully! Employer notified.');
        loadWorkerData();
      } else {
        alert(data.error || 'Failed to apply');
      }
    } catch (err) {
      console.error('Error applying for job:', err);
    }
  };

  // View applicants for business job
  const handleViewApplicants = async (job: any) => {
    setSelectedJobForApplicants(job);
    try {
      const res = await fetch(`/api/v1/business/jobs/${job.id}/applicants`);
      const data = await res.json();
      if (data.success) {
        setApplicantsList(data.applicants || []);
      }
    } catch (err) {
      console.error('Error loading applicants:', err);
    }
  };

  // Accept Worker
  const handleAcceptWorker = async (applicationId: string) => {
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        showMessage(`Worker accepted! Phone: ${data.worker.phone}`);
        if (selectedJobForApplicants) {
          handleViewApplicants(selectedJobForApplicants);
        }
        loadBusinessData();
      }
    } catch (err) {
      console.error('Error accepting worker:', err);
    }
  };

  // Post New Job
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/business/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...postJobForm,
          businessId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPostJobModal(false);
        showMessage('Job posted! Nearby workers can now discover it.');
        loadBusinessData();
      } else {
        alert(data.error || 'Failed to post job');
      }
    } catch (err) {
      console.error('Error posting job:', err);
    } finally {
      setLoading(false);
    }
  };

  // Confirm Completion Handshake
  const handleConfirmCompletion = async (jobId: string, workerId?: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/confirm-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          worker_id: workerId,
          confirmed: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage('Job completion verified! Please leave a review.');
        if (currentUser.role === 'WORKER') {
          loadWorkerData();
        } else {
          loadBusinessData();
        }
      }
    } catch (err) {
      console.error('Error confirming completion:', err);
    }
  };

  // Submit Rating Review
  const handleSubmitReview = async () => {
    if (!currentUser || !ratingTarget) return;
    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_user_id: currentUser.id,
          to_user_id: ratingTarget.toUserId,
          job_id: ratingTarget.jobId,
          rating: ratingValue,
          feedback_tag: selectedTag,
          comment: ratingComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRatingModal(false);
        setRatingComment('');
        showMessage(`Review submitted! Rating updated to ${data.new_rating} ⭐`);
        if (currentUser.role === 'WORKER') loadWorkerData();
        else loadBusinessData();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    }
  };

  const showMessage = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleOpenLogin = () => {
    setLoginError(null);
    setLoginStep('PHONE');
    setShowLoginModal(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    setWorkerProfile(null);
    setNearbyJobs([]);
    setMyApplications([]);
    setBusinessJobs([]);
    setShowLoginModal(true);
    setLoginStep('PHONE');
    showMessage('Logged out. Please sign in or choose an account.');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone || loginPhone.trim().length < 10) {
      setLoginError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setLoginStep('OTP');
        setLoginOtp('1234'); // Pre-fill prototype demo OTP
        showMessage(`OTP sent to +91 ${loginPhone.trim()}`);
      } else {
        setLoginError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setLoginError('Network error connecting to OTP service');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtp || loginOtp.trim().length < 4) {
      setLoginError('Please enter the 4-digit OTP');
      return;
    }
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loginPhone.trim(),
          otp: loginOtp.trim(),
          role: loginRole,
          name: loginName.trim() || (loginRole === 'WORKER' ? 'Worker User' : 'Local Business Owner'),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser({
          id: data.user.id,
          name: data.user.name,
          phone: data.user.phone,
          role: data.user.role,
        });
        setToken(data.token);
        setShowLoginModal(false);
        setLoginStep('PHONE');
        setLoginPhone('');
        setLoginName('');
        setLoginOtp('');
        showMessage(`Welcome to KaamSetu, ${data.user.name}!`);
      } else {
        setLoginError(data.error || 'Invalid OTP code');
      }
    } catch (err) {
      setLoginError('Authentication failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSelectDemoPersona = (personaKey: string) => {
    switchPersona(personaKey);
    setShowLoginModal(false);
  };

  return (
    <>
      {/* 1. TOP TESTING PERSONA SWITCHER BAR */}
      <div className="role-switcher-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="role-tag">
            <Sparkles size={14} />
            KaamSetu
          </div>
          {currentUser && (
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
              {currentUser.role === 'WORKER' ? '👷' : '🏪'} {currentUser.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleOpenLogin}
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🔑 Login / Switch
          </button>
          {currentUser && (
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Sign out"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>


      {/* Floating Status Notification */}
      {statusMessage && (
        <div
          style={{
            position: 'fixed',
            top: '56px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(16, 185, 129, 0.95)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 700,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <CheckCircle2 size={16} />
          {statusMessage}
        </div>
      )}

      {/* 2. APP HEADER */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-title">
            <span>Kaam</span>Setu
          </div>
          <div className="user-badge">
            <ShieldCheck size={14} color="#10b981" />
            {currentUser?.role === 'WORKER' ? 'Verified Worker' : 'Local Business'}
          </div>
        </div>

        <div className="user-greeting">
          <div>
            <div className="greeting-name">
              Good morning, {currentUser?.name?.split(' ')[0]} 👋
            </div>
            <div className="greeting-loc">
              <MapPin size={13} color="#f59e0b" />
              Amritsar Pilot Cluster
            </div>
          </div>

          {currentUser?.role === 'WORKER' && workerProfile && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fbbf24' }}>
                ⭐ {workerProfile.rating}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {workerProfile.jobs_completed} jobs completed
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 3. WORKER VIEW */}
      {currentUser?.role === 'WORKER' && (
        <>
          {/* Availability Toggle */}
          <div className="availability-container">
            <div className="availability-label">Your Daily Availability</div>
            <div className="availability-pills">
              <button
                className={`avail-pill ${
                  availability === 'AVAILABLE_TODAY' ? 'active-today' : ''
                }`}
                onClick={() => handleAvailabilityChange('AVAILABLE_TODAY')}
              >
                🟢 Today
              </button>
              <button
                className={`avail-pill ${
                  availability === 'AVAILABLE_TOMORROW' ? 'active-tomorrow' : ''
                }`}
                onClick={() => handleAvailabilityChange('AVAILABLE_TOMORROW')}
              >
                🔵 Tomorrow
              </button>
              <button
                className={`avail-pill ${
                  availability === 'UNAVAILABLE' ? 'active-off' : ''
                }`}
                onClick={() => handleAvailabilityChange('UNAVAILABLE')}
              >
                🔴 Off
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tab-bar">
            <button
              className={`tab-btn ${workerTab === 'NEARBY' ? 'active' : ''}`}
              onClick={() => setWorkerTab('NEARBY')}
            >
              <Briefcase size={16} />
              Jobs Near You ({nearbyJobs.length})
            </button>
            <button
              className={`tab-btn ${workerTab === 'APPLICATIONS' ? 'active' : ''}`}
              onClick={() => setWorkerTab('APPLICATIONS')}
            >
              <CheckCircle2 size={16} />
              My Jobs ({myApplications.length})
            </button>
          </div>

          {/* Worker Feed */}
          <div className="feed-content">
            {workerTab === 'NEARBY' ? (
              nearbyJobs.length === 0 ? (
                <div className="empty-state">
                  <Briefcase size={36} />
                  <p>No open jobs matching your radius right now.</p>
                </div>
              ) : (
                nearbyJobs.map((job) => (
                  <div key={job.id} className="job-card">
                    <div className="job-header">
                      <div>
                        <div className="job-title">{job.title}</div>
                        <div className="business-sub">
                          {job.business.business_name} · ⭐ {job.business.rating} ({job.business.jobs_completed} jobs)
                        </div>
                      </div>
                      <div className="wage-badge">₹{job.wage}/day</div>
                    </div>

                    <div className="job-meta-grid">
                      <div className="meta-chip distance">
                        <MapPin size={12} />
                        {job.distance_km} km away
                      </div>
                      <div className="meta-chip">
                        <Clock size={12} />
                        {job.job_date} · {job.start_time} - {job.end_time}
                      </div>
                      {job.food_provided && (
                        <div className="meta-chip food">
                          <Utensils size={12} />
                          Food Provided
                        </div>
                      )}
                    </div>

                    {job.description && (
                      <div className="job-description">{job.description}</div>
                    )}

                    <div className="job-actions">
                      {job.my_application_status === 'APPLIED' ? (
                        <div className="btn-applied">
                          <CheckCircle2 size={16} /> Applied · Waiting for Business
                        </div>
                      ) : job.my_application_status === 'ACCEPTED' ? (
                        <div className="btn-confirmed">
                          <CheckCircle2 size={16} /> Confirmed! Check My Jobs tab
                        </div>
                      ) : (
                        <button
                          className="btn-apply"
                          onClick={() => handleApply(job.id)}
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )
            ) : (
              /* My Applications & Confirmed Jobs */
              myApplications.length === 0 ? (
                <div className="empty-state">
                  <Briefcase size={36} />
                  <p>You have not applied to any jobs yet.</p>
                </div>
              ) : (
                myApplications.map((app) => (
                  <div key={app.id} className="job-card">
                    <div className="job-header">
                      <div>
                        <div className="job-title">{app.job.title}</div>
                        <div className="business-sub">
                          {app.job.business.business_name}
                        </div>
                      </div>
                      <div className="wage-badge">₹{app.job.wage}/day</div>
                    </div>

                    <div className="job-meta-grid">
                      <div className="meta-chip">
                        <Clock size={12} />
                        {app.job.job_date} · {app.job.start_time} - {app.job.end_time}
                      </div>
                      <div className="meta-chip">
                        <MapPin size={12} />
                        {app.job.locality}
                      </div>
                    </div>

                    {/* Contact details revealed if accepted */}
                    {app.status === 'ACCEPTED' || app.status === 'COMPLETED' ? (
                      <div className="unlocked-contact-box">
                        <div className="contact-header">
                          <ShieldCheck size={16} />
                          Employer Contact Unlocked
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#f8fafc' }}>
                          Owner: <strong>{app.job.business.owner_name}</strong>
                        </div>
                        <div className="contact-actions">
                          <a
                            href={`tel:${app.job.business.phone}`}
                            className="btn-call"
                          >
                            <Phone size={14} /> Call ({app.job.business.phone})
                          </a>
                          <a
                            href={`https://wa.me/91${app.job.business.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-whatsapp"
                          >
                            <MessageSquare size={14} /> WhatsApp
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="btn-applied">
                        Status: <strong>{app.status}</strong>
                      </div>
                    )}

                    {/* Completion Handshake */}
                    {app.status === 'ACCEPTED' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-apply"
                          style={{ background: '#10b981' }}
                          onClick={() => handleConfirmCompletion(app.job.id)}
                        >
                          <CheckCircle2 size={16} /> Mark as Completed
                        </button>
                        <button
                          className="btn-post-job"
                          style={{ background: '#3b82f6', color: '#fff' }}
                          onClick={() => {
                            setRatingTarget({
                              jobId: app.job.id,
                              toUserId: app.job.business.id,
                              toName: app.job.business.business_name,
                              role: 'BUSINESS',
                            });
                            setShowRatingModal(true);
                          }}
                        >
                          ⭐ Rate Business
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )
            )}
          </div>
        </>
      )}

      {/* 4. BUSINESS VIEW */}
      {currentUser?.role === 'BUSINESS' && (
        <>
          <div className="business-actions-bar">
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Active Jobs Dashboard</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                {businessJobs.length} Jobs Posted
              </div>
            </div>
            <button
              className="btn-post-job"
              onClick={() => setShowPostJobModal(true)}
            >
              <Plus size={16} />
              Post a Job
            </button>
          </div>

          <div className="feed-content">
            {businessJobs.length === 0 ? (
              <div className="empty-state">
                <Briefcase size={36} />
                <p>You have no active job postings. Click &quot;Post a Job&quot; above.</p>
              </div>
            ) : (
              businessJobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <div>
                      <div className="job-title">{job.title}</div>
                      <div className="business-sub">
                        {job.locality} · {job.job_date}
                      </div>
                    </div>
                    <div className="wage-badge">₹{job.wage}/day</div>
                  </div>

                  <div className="job-meta-grid">
                    <div className="meta-chip">
                      <Clock size={12} />
                      {job.start_time} - {job.end_time}
                    </div>
                    <div className="meta-chip">
                      <Users size={12} />
                      Needed: {job.workers_required} · Accepted: {job.workers_accepted}
                    </div>
                  </div>

                  <div className="job-actions">
                    <button
                      className="btn-apply"
                      style={{ background: '#3b82f6', color: '#fff' }}
                      onClick={() => handleViewApplicants(job)}
                    >
                      <Users size={16} />
                      View Applicants ({job.applicant_count})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* 5. MODAL: POST A JOB */}
      {showPostJobModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Post a New Job</div>
              <button
                className="btn-close"
                onClick={() => setShowPostJobModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Worker Category / Skill</label>
                <select
                  className="form-select"
                  value={postJobForm.skill_id}
                  onChange={(e) =>
                    setPostJobForm({
                      ...postJobForm,
                      skill_id: e.target.value,
                      title:
                        skillsList.find((s) => s.id === e.target.value)?.name ||
                        postJobForm.title,
                    })
                  }
                  required
                >
                  {skillsList.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Workers Required</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={postJobForm.workers_required}
                    onChange={(e) =>
                      setPostJobForm({
                        ...postJobForm,
                        workers_required: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Daily Wage (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    className="form-input"
                    value={postJobForm.wage}
                    onChange={(e) =>
                      setPostJobForm({
                        ...postJobForm,
                        wage: parseInt(e.target.value) || 600,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date of Work</label>
                <input
                  type="date"
                  className="form-input"
                  value={postJobForm.job_date}
                  onChange={(e) =>
                    setPostJobForm({ ...postJobForm, job_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={postJobForm.start_time}
                    onChange={(e) =>
                      setPostJobForm({ ...postJobForm, start_time: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={postJobForm.end_time}
                    onChange={(e) =>
                      setPostJobForm({ ...postJobForm, end_time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Landmark</label>
                <input
                  type="text"
                  className="form-input"
                  value={postJobForm.locality}
                  onChange={(e) =>
                    setPostJobForm({ ...postJobForm, locality: e.target.value })
                  }
                  placeholder="e.g. Lawrence Road, near Novelty Sweets"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Work Description</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={postJobForm.description}
                  onChange={(e) =>
                    setPostJobForm({ ...postJobForm, description: e.target.value })
                  }
                  placeholder="Brief note about the duties..."
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="food_check"
                  checked={postJobForm.food_provided}
                  onChange={(e) =>
                    setPostJobForm({
                      ...postJobForm,
                      food_provided: e.target.checked,
                    })
                  }
                />
                <label htmlFor="food_check" style={{ fontSize: '0.86rem', color: '#f8fafc', cursor: 'pointer' }}>
                  🍲 Food / Meals provided for this shift
                </label>
              </div>

              <button
                type="submit"
                className="btn-apply"
                style={{ marginTop: '8px' }}
                disabled={loading}
              >
                {loading ? 'Posting...' : 'Post Job to Local Network'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: VIEW APPLICANTS (BUSINESS) */}
      {selectedJobForApplicants && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <div className="modal-title">Applicants</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {selectedJobForApplicants.title} · {selectedJobForApplicants.locality}
                </div>
              </div>
              <button
                className="btn-close"
                onClick={() => setSelectedJobForApplicants(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {applicantsList.length === 0 ? (
                <div className="empty-state">
                  <Users size={32} />
                  <p>No applicants yet for this job.</p>
                </div>
              ) : (
                applicantsList.map((app) => (
                  <div
                    key={app.application_id}
                    className={`applicant-card ${
                      app.status === 'ACCEPTED' ? 'accepted-worker' : ''
                    }`}
                  >
                    <div className="applicant-header">
                      <div>
                        <div className="applicant-name">{app.name}</div>
                        <div className="applicant-meta">
                          <span>⭐ {app.rating}</span>
                          <span>·</span>
                          <span>{app.jobs_completed} jobs done</span>
                          <span>·</span>
                          <span style={{ color: '#34d399', fontWeight: 600 }}>
                            {app.distance_km} km away
                          </span>
                        </div>
                      </div>
                      {app.status === 'ACCEPTED' ? (
                        <div
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                          }}
                        >
                          ACCEPTED ✓
                        </div>
                      ) : (
                        <button
                          className="btn-accept"
                          onClick={() => handleAcceptWorker(app.application_id)}
                        >
                          Accept Worker
                        </button>
                      )}
                    </div>

                    {/* Unlocked contact if accepted */}
                    {app.status === 'ACCEPTED' && app.phone && (
                      <div className="unlocked-contact-box" style={{ marginTop: '6px' }}>
                        <div className="contact-header">
                          <Phone size={14} /> Contact Worker Directly
                        </div>
                        <div className="contact-actions">
                          <a href={`tel:${app.phone}`} className="btn-call">
                            <Phone size={13} /> Call {app.phone}
                          </a>
                          <a
                            href={`https://wa.me/91${app.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-whatsapp"
                          >
                            <MessageSquare size={13} /> WhatsApp
                          </a>
                        </div>
                        <button
                          style={{
                            marginTop: '8px',
                            background: '#f59e0b',
                            color: '#000',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setRatingTarget({
                              jobId: selectedJobForApplicants.id,
                              toUserId: app.worker_id,
                              toName: app.name,
                              role: 'WORKER',
                            });
                            setShowRatingModal(true);
                          }}
                        >
                          ⭐ Mark Worked & Rate Worker
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: MUTUAL RATING & REVIEW */}
      {showRatingModal && ratingTarget && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <div className="modal-title">Rate {ratingTarget.toName}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Reputation handshake for completed job
                </div>
              </div>
              <button
                className="btn-close"
                onClick={() => setShowRatingModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* 1-5 Star Picker */}
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  className={`star-btn ${ratingValue >= num ? 'active' : ''}`}
                  onClick={() => setRatingValue(num)}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Quick Feedback Chips */}
            <div className="tag-chips">
              {(ratingTarget.role === 'WORKER'
                ? ['Punctual', 'Hardworking', 'Polite', 'Quick Learner']
                : ['Paid On Time', 'Good Environment', 'Food Provided', 'Respectful']
              ).map((tag) => (
                <button
                  key={tag}
                  className={`tag-chip ${selectedTag === tag ? 'selected' : ''}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Optional Comment</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your experience..."
              />
            </div>

            <button
              className="btn-apply"
              onClick={handleSubmitReview}
            >
              Submit Rating & Update Profile
            </button>
          </div>
        </div>
      )}

      {/* 8. DEDICATED LOGIN WINDOW (WORKER OR BUSINESS) */}
      {(showLoginModal || !currentUser) && (
        <div className="login-window-overlay">
          <div className="login-window-box">
            <div className="login-window-header">
              {currentUser && (
                <button
                  className="btn-close"
                  style={{ position: 'absolute', top: '16px', right: '16px' }}
                  onClick={() => setShowLoginModal(false)}
                >
                  <X size={20} />
                </button>
              )}
              <div className="login-brand-title">
                <span>Kaam</span>Setu
              </div>
              <div className="login-subtitle">
                Connecting local work with local workers
              </div>
            </div>

            <div className="login-body">
              {loginError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertCircle size={14} />
                  {loginError}
                </div>
              )}

              {/* Role Selection Toggle Cards */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                  I want to enter as:
                </label>
                <div className="role-choice-grid">
                  <div
                    className={`role-choice-card ${loginRole === 'WORKER' ? 'selected' : ''}`}
                    onClick={() => setLoginRole('WORKER')}
                  >
                    {loginRole === 'WORKER' && <div className="role-selected-badge">✓</div>}
                    <div className="role-card-icon">👷</div>
                    <div className="role-card-title">Worker / Karigar</div>
                    <div className="role-card-desc">Mujhe kaam chahiye. Daily helper, loading, delivery.</div>
                  </div>

                  <div
                    className={`role-choice-card ${loginRole === 'BUSINESS' ? 'selected business' : ''}`}
                    onClick={() => setLoginRole('BUSINESS')}
                  >
                    {loginRole === 'BUSINESS' && <div className="role-selected-badge business">✓</div>}
                    <div className="role-card-icon">🏪</div>
                    <div className="role-card-title">Business / Dukandar</div>
                    <div className="role-card-desc">Mujhe worker chahiye. Shop, restaurant, godown.</div>
                  </div>
                </div>
              </div>

              {loginStep === 'PHONE' ? (
                /* Step 1: Mobile & Basic Profile */
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      {loginRole === 'WORKER' ? 'Worker Mobile Number' : 'Business Owner Mobile Number'}
                    </label>
                    <div className="phone-input-wrapper">
                      <div className="phone-prefix">🇮🇳 +91</div>
                      <input
                        type="tel"
                        maxLength={10}
                        className="phone-input-field"
                        placeholder="98765 43210"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {loginRole === 'WORKER' ? 'Your Name (e.g. Rahul Kumar)' : 'Business Name (e.g. Sharma Restaurant)'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={loginRole === 'WORKER' ? 'e.g. Rahul Kumar' : 'e.g. Sharma Restaurant'}
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Locality / Area</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ranjit Avenue, Amritsar"
                      value={loginLocality}
                      onChange={(e) => setLoginLocality(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-apply"
                    style={{
                      marginTop: '4px',
                      background: loginRole === 'WORKER' ? 'var(--primary)' : '#3b82f6',
                      color: loginRole === 'WORKER' ? '#000' : '#fff',
                    }}
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'Sending OTP...' : `Continue as ${loginRole === 'WORKER' ? 'Worker' : 'Business'} →`}
                  </button>
                </form>
              ) : (
                /* Step 2: OTP Verification */
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.86rem', color: '#f8fafc', fontWeight: 600 }}>
                      Enter 4-Digit Verification Code
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                      Sent to +91 {loginPhone} ({loginRole === 'WORKER' ? '👷 Worker' : '🏪 Business'})
                    </div>
                  </div>

                  <input
                    type="text"
                    maxLength={4}
                    className="otp-input-box"
                    placeholder="••••"
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value)}
                    required
                    autoFocus
                  />

                  <div className="test-otp-hint">
                    <span>💡 Prototype Test OTP: <strong>1234</strong></span>
                    <button
                      type="button"
                      className="btn-autofill-otp"
                      onClick={() => setLoginOtp('1234')}
                    >
                      Auto-Fill 1234
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn-apply"
                    style={{
                      background: loginRole === 'WORKER' ? 'var(--primary)' : '#3b82f6',
                      color: loginRole === 'WORKER' ? '#000' : '#fff',
                    }}
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'Verifying...' : `Verify & Log In as ${loginRole === 'WORKER' ? 'Worker' : 'Business'} ✓`}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoginStep('PHONE')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    ← Change mobile number
                  </button>
                </form>
              )}

              {/* Quick Demo Accounts */}
              <div className="login-divider">Or quick test with demo profiles</div>
              <div className="demo-account-list">
                {DEMO_PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    className="demo-account-btn"
                    onClick={() => handleSelectDemoPersona(p.id)}
                  >
                    <span className="demo-role-emoji">
                      {p.role === 'WORKER' ? '👷' : '🏪'}
                    </span>
                    <div style={{ overflow: 'hidden' }}>
                      <div className="demo-name">{p.name.split(' (')[0]}</div>
                      <div className="demo-detail">{p.role} · {p.locality.split(',')[0]}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

