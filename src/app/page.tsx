'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, MapPin, Briefcase, Phone, User as UserIcon } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

// Components
import { Header } from '@/components/common/Header';
import { BottomNav, NavTab } from '@/components/common/BottomNav';
import { LoginModal } from '@/components/common/LoginModal';
import { RatingModal } from '@/components/common/RatingModal';
import { CustomerHome } from '@/components/customer/CustomerHome';
import { PostJobSheet } from '@/components/customer/PostJobSheet';
import { ApplicantSheet } from '@/components/customer/ApplicantSheet';
import { WorkerHome } from '@/components/worker/WorkerHome';
import { NearbyWorker } from '@/components/customer/WorkerCard';
import { NearbyJob } from '@/components/worker/JobCard';
import { WorkerApplication } from '@/components/worker/ApplicationsList';

interface UserSession {
  id: string;
  name: string;
  phone: string;
  role: 'WORKER' | 'BUSINESS';
}

const DEMO_PERSONAS = [
  {
    id: 'worker-rahul',
    name: 'Rahul Kumar (Worker)',
    role: 'WORKER' as const,
    phone: '9876543210',
    title: 'Daily Helper & Assistant',
    locality: 'Ranjit Avenue, Amritsar',
  },
  {
    id: 'biz-sharma',
    name: 'Sharma Ji (Customer / काम देने वाला)',
    role: 'BUSINESS' as const,
    phone: '9812345678',
    title: 'Household & Home Repairs',
    locality: 'Lawrence Road, Amritsar',
  },
  {
    id: 'worker-aman',
    name: 'Aman Singh (Worker)',
    role: 'WORKER' as const,
    phone: '9876543211',
    title: 'Loading & Heavy Work',
    locality: 'Mall Road, Amritsar',
  },
  {
    id: 'biz-punjab',
    name: 'Anita Verma (Customer / काम देने वाला)',
    role: 'BUSINESS' as const,
    phone: '9812345680',
    title: 'Home Renovation & Cleaning',
    locality: 'GT Road, Amritsar',
  },
  {
    id: 'worker-ramesh',
    name: 'Ramesh Mistri (Electrician)',
    role: 'WORKER' as const,
    phone: '9876543213',
    title: 'Electrician & Wiring',
    locality: 'Putligarh, Amritsar',
  },
];

export default function KaamSetuApp() {
  // Global App States
  const [lang, setLang] = useState<Language>('en');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string>('');
  const [activePersonaKey, setActivePersonaKey] = useState<string>('worker-rahul');
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('EXPLORE');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Environment Mode: Real User Mode (default) vs Demo Mode
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Dynamic Geolocation with Graceful Pilot Cluster Fallback
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    locality: string;
    isLive: boolean;
  }>({
    lat: 31.6340,
    lng: 74.8723,
    locality: 'Amritsar (Pilot)',
    isLive: false,
  });

  // Common Data
  const [skillsList, setSkillsList] = useState<any[]>([]);

  // Customer / Business Data
  const [nearbyWorkers, setNearbyWorkers] = useState<NearbyWorker[]>([]);
  const [customerJobs, setCustomerJobs] = useState<any[]>([]);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<any | null>(null);
  const [applicantsList, setApplicantsList] = useState<any[]>([]);

  // Worker Data
  const [workerProfile, setWorkerProfile] = useState<any | null>(null);
  const [availability, setAvailability] = useState<string>('AVAILABLE_TODAY');
  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[]>([]);
  const [workerApplications, setWorkerApplications] = useState<WorkerApplication[]>([]);

  // Modals & Sheets
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPostJobSheet, setShowPostJobSheet] = useState(false);
  const [preSelectedWorker, setPreSelectedWorker] = useState<NearbyWorker | null>(null);
  const [showApplicantSheet, setShowApplicantSheet] = useState(false);
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

  // Login Form States
  const [loginRole, setLoginRole] = useState<'WORKER' | 'BUSINESS'>('WORKER');
  const [loginStep, setLoginStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginLocality, setLoginLocality] = useState('Amritsar');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const t = translations[lang];

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Toggle Language
  const handleToggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  // Switch Demo Persona (Only used in Demo Mode)
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
        const userObj = {
          id: data.user.id,
          name: data.user.name,
          phone: data.user.phone,
          role: data.user.role,
        };
        setCurrentUser(userObj);
        setToken(data.token);
        setActivePersonaKey(personaKey);
        setShowLoginModal(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('kaamsetu_user', JSON.stringify(userObj));
          localStorage.setItem('kaamsetu_token', data.token);
        }
      }
    } catch (err) {
      console.error('Failed to switch persona:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Dynamic Geolocation Detection with Fallback
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            locality: t.currentLocationGps,
            isLive: true,
          });
        },
        (err) => {
          console.log('GPS not available, using default pilot cluster:', err.message);
        },
        { timeout: 7000, maximumAge: 60000 }
      );
    }
  }, [t.currentLocationGps]);

  // 2. Initial Setup: Load Skills, Check Real User Session or Demo Mode
  useEffect(() => {
    fetch('/api/v1/skills')
      .then((res) => res.json())
      .then((data) => {
        if (data.skills) setSkillsList(data.skills);
      })
      .catch((err) => console.error('Error loading skills:', err));

    // Check URL or localStorage for Demo Mode flag
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isDemoRequested = urlParams?.get('demo') === 'true' || urlParams?.get('demo') === '1';
    const isDemoStored = typeof window !== 'undefined' && localStorage.getItem('kaamsetu_demo_mode') === 'true';
    const demoActive = isDemoRequested || isDemoStored;
    setIsDemoMode(demoActive);

    // Check localStorage for persisted Real User Session
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('kaamsetu_user') : null;
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('kaamsetu_token') : null;

    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('kaamsetu_user');
        localStorage.removeItem('kaamsetu_token');
      }
    } else if (demoActive) {
      // In explicit Demo Mode without saved session, start with demo persona
      switchPersona('worker-rahul');
    } else {
      // In Real User Mode without saved session, present onboarding / login
      setShowLoginModal(true);
    }
  }, [switchPersona]);

  // Toggle Demo Mode
  const handleToggleDemoMode = () => {
    setIsDemoMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('kaamsetu_demo_mode', next ? 'true' : 'false');
      }
      if (next && !currentUser) {
        switchPersona('worker-rahul');
      }
      return next;
    });
  };

  // Load Customer Data (Uses dynamic GPS userLocation)
  const loadCustomerData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'BUSINESS') return;
    setLoading(true);
    try {
      // 1. Fetch Nearby Workers for Customer Discovery using dynamic coordinates
      const workersRes = await fetch(
        `/api/v1/workers/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&max_distance=25.0`
      );
      const workersData = await workersRes.json();
      if (workersData.success) {
        setNearbyWorkers(workersData.workers || []);
      }

      // 2. Fetch Customer's Jobs
      const jobsRes = await fetch(`/api/v1/business/jobs?business_id=${currentUser.id}`);
      const jobsData = await jobsRes.json();
      if (jobsData.success) {
        setCustomerJobs(jobsData.jobs || []);
      }
    } catch (err) {
      console.error('Error loading customer data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, userLocation]);

  // Load Worker Data (Uses dynamic GPS userLocation)
  const loadWorkerData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'WORKER') return;
    setLoading(true);
    try {
      // 1. Fetch Worker Profile
      const profRes = await fetch(`/api/v1/worker/profile?userId=${currentUser.id}`);
      const profData = await profRes.json();
      if (profData.success && profData.worker) {
        setWorkerProfile(profData.worker);
        setAvailability(profData.worker.availability);
      }

      // 2. Fetch Nearby Jobs using dynamic coordinates
      const jobsRes = await fetch(
        `/api/v1/jobs/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&max_distance=25.0&worker_id=${currentUser.id}`
      );
      const jobsData = await jobsRes.json();
      if (jobsData.success) {
        setNearbyJobs(jobsData.jobs || []);
      }

      // 3. Fetch Worker Applications
      const appsRes = await fetch(`/api/v1/worker/applications?worker_id=${currentUser.id}`);
      const appsData = await appsRes.json();
      if (appsData.success) {
        setWorkerApplications(appsData.applications || []);
      }
    } catch (err) {
      console.error('Error loading worker data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, userLocation]);

  useEffect(() => {
    if (currentUser?.role === 'BUSINESS') {
      loadCustomerData();
    } else if (currentUser?.role === 'WORKER') {
      loadWorkerData();
    }
  }, [currentUser, loadCustomerData, loadWorkerData]);

  // Worker: Update Availability
  const handleSetAvailability = async (newStatus: string) => {
    if (!currentUser) return;
    setAvailability(newStatus);
    try {
      await fetch('/api/v1/worker/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, availability: newStatus }),
      });
      showNotification(lang === 'hi' ? 'आपकी उपलब्धता अपडेट हो गई!' : 'Availability updated!');
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  };

  // Worker: 1-Tap Apply
  const handleApplyJob = async (jobId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: currentUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(lang === 'hi' ? 'आवेदन भेजा गया! काम देने वाले को सूचित कर दिया गया है।' : 'Applied! Customer notified.');
        loadWorkerData();
      } else {
        alert(data.error || 'Failed to apply');
      }
    } catch (err) {
      console.error('Error applying:', err);
    }
  };

  // Customer: Post Job
  const handlePostJobSubmit = async (formData: any) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/business/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          businessId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPostJobSheet(false);
        setPreSelectedWorker(null);
        showNotification(lang === 'hi' ? 'जॉब पोस्ट हो गया! पास के कामगारों को भेज दिया गया है।' : 'Job posted! Nearby workers notified.');
        loadCustomerData();
      } else {
        alert(data.error || 'Failed to post job');
      }
    } catch (err) {
      console.error('Error posting job:', err);
    } finally {
      setLoading(false);
    }
  };

  // Customer: View Applicants
  const handleViewApplicants = async (job: any) => {
    setSelectedJobForApplicants(job);
    setShowApplicantSheet(true);
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

  // Customer: Accept Worker
  const handleAcceptWorker = async (applicationId: string) => {
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        showNotification(lang === 'hi' ? `वर्कर स्वीकार हुआ! फोन नंबर: ${data.worker.phone}` : `Worker accepted! Phone: ${data.worker.phone}`);
        if (selectedJobForApplicants) {
          handleViewApplicants(selectedJobForApplicants);
        }
        loadCustomerData();
      }
    } catch (err) {
      console.error('Error accepting worker:', err);
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
        showNotification(lang === 'hi' ? 'काम पूरा हुआ! कृपया रेटिंग और समीक्षा दें।' : 'Work verified completed! Please leave a review.');
        if (currentUser.role === 'WORKER') loadWorkerData();
        else loadCustomerData();
      }
    } catch (err) {
      console.error('Error confirming completion:', err);
    }
  };

  // Submit Review
  const handleSubmitReview = async () => {
    if (!currentUser || !ratingTarget) return;
    setLoading(true);
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
        showNotification(lang === 'hi' ? `समीक्षा सबमिट हुई! नई रेटिंग: ${data.new_rating} ⭐` : `Review submitted! Rating updated to ${data.new_rating} ⭐`);
        if (currentUser.role === 'WORKER') loadWorkerData();
        else loadCustomerData();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setLoading(false);
    }
  };

  // Phone OTP Flow Handlers
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone || loginPhone.trim().length < 10) {
      setLoginError(lang === 'hi' ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
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
        setLoginOtp('1234');
        showNotification(`OTP sent to +91 ${loginPhone.trim()}`);
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
      setLoginError(lang === 'hi' ? 'कृपया 4 अंकों का OTP दर्ज करें' : 'Please enter the 4-digit OTP');
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
          name: loginName.trim() || (loginRole === 'WORKER' ? 'Worker User' : 'Customer'),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const userObj = {
          id: data.user.id,
          name: data.user.name,
          phone: data.user.phone,
          role: data.user.role,
        };
        setCurrentUser(userObj);
        setToken(data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('kaamsetu_user', JSON.stringify(userObj));
          localStorage.setItem('kaamsetu_token', data.token);
        }
        setShowLoginModal(false);
        setLoginStep('PHONE');
        setLoginPhone('');
        setLoginName('');
        setLoginOtp('');
        showNotification(lang === 'hi' ? `लॉगिन सफल: ${data.user.name}!` : `Logged in as ${data.user.name}!`);
      } else {
        setLoginError(data.error || 'Invalid OTP code');
      }
    } catch (err) {
      setLoginError('Authentication failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kaamsetu_user');
      localStorage.removeItem('kaamsetu_token');
    }
    setWorkerProfile(null);
    setNearbyJobs([]);
    setWorkerApplications([]);
    setCustomerJobs([]);
    setShowLoginModal(true);
    setLoginStep('PHONE');
    showNotification(lang === 'hi' ? 'लॉगआउट कर दिया गया' : 'Logged out successfully');
  };

  // Unlocked Calls count (contacts unlocked)
  const unlockedCallsCount =
    currentUser?.role === 'WORKER'
      ? workerApplications.filter((a) => a.status === 'ACCEPTED' || a.status === 'COMPLETED').length
      : customerJobs.reduce((acc, j) => acc + (j.accepted_count || 0), 0);

  return (
    <>
      {/* 1. TOP TESTING PERSONA SWITCHER BAR (Visible ONLY in Demo Mode) */}
      {isDemoMode && (
        <div
          className="role-switcher-bar"
          style={{
            background: 'linear-gradient(90deg, #78350f, #92400e)',
            borderBottom: '1px solid #b45309',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              className="role-tag"
              style={{
                background: 'rgba(0,0,0,0.35)',
                color: '#fbbf24',
                borderColor: '#d97706',
              }}
            >
              <Sparkles size={13} />
              {t.demoModeActive}
            </div>
            {currentUser && (
              <span style={{ fontSize: '0.74rem', color: '#fef3c7', fontWeight: 600 }}>
                {currentUser.role === 'WORKER' ? '👷' : '🏠'} {currentUser.name}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              aria-label="Select Demo Persona"
              className="role-select"
              style={{
                padding: '3px 8px',
                fontSize: '0.74rem',
                background: '#451a03',
                color: '#fef3c7',
                borderColor: '#b45309',
              }}
              value={activePersonaKey}
              onChange={(e) => switchPersona(e.target.value)}
            >
              {DEMO_PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.role === 'WORKER' ? '👷' : '🏠'} {p.name.split(' (')[0]}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleToggleDemoMode}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fde68a',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title={t.exitDemoMode}
            >
              ✕ {t.exitDemoMode}
            </button>
          </div>
        </div>
      )}

      {/* Floating Status Notification */}
      {statusMessage && (
        <div
          style={{
            position: 'fixed',
            top: isDemoMode ? '52px' : '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(16, 185, 129, 0.96)',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 700,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <CheckCircle2 size={16} />
          {statusMessage}
        </div>
      )}

      {/* 2. HEADER */}
      <Header
        lang={lang}
        onToggleLang={handleToggleLang}
        currentUser={currentUser}
        localityName={userLocation.locality}
        isGpsActive={userLocation.isLive}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      {/* 3. MAIN WORKSPACE BASED ON ROLE & ACTIVE TAB */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeNavTab === 'EXPLORE' && (
          currentUser?.role === 'BUSINESS' ? (
            <CustomerHome
              lang={lang}
              skillsList={skillsList}
              workers={nearbyWorkers}
              customerJobs={customerJobs}
              onOpenPostJob={() => {
                setPreSelectedWorker(null);
                setShowPostJobSheet(true);
              }}
              onRequestHireWorker={(worker) => {
                setPreSelectedWorker(worker);
                setShowPostJobSheet(true);
              }}
              onViewApplicants={handleViewApplicants}
              loading={loading}
            />
          ) : (
            <WorkerHome
              lang={lang}
              workerProfile={workerProfile}
              availability={availability}
              onSetAvailability={handleSetAvailability}
              nearbyJobs={nearbyJobs}
              applications={workerApplications}
              onApplyJob={handleApplyJob}
              onConfirmCompleted={handleConfirmCompletion}
              onRateBusiness={(bizId, bizName, jobId) => {
                setRatingTarget({
                  jobId,
                  toUserId: bizId,
                  toName: bizName,
                  role: 'BUSINESS',
                });
                setShowRatingModal(true);
              }}
              loading={loading}
            />
          )
        )}

        {/* Tab 2: MY_JOBS (Direct view of applications or postings) */}
        {activeNavTab === 'MY_JOBS' && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="section-title">
              <Briefcase size={18} color="#f59e0b" />
              {currentUser?.role === 'WORKER' ? t.myApplicationsHeading : t.activeJobsHeading}
            </div>

            {currentUser?.role === 'WORKER' ? (
              <div className="feed-content" style={{ padding: 0 }}>
                {workerApplications.length === 0 ? (
                  <div className="empty-state">
                    <Briefcase size={36} />
                    <p style={{ fontWeight: 700 }}>{t.noApplicationsYet}</p>
                    <button
                      className="btn-apply"
                      style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                      onClick={() => setActiveNavTab('EXPLORE')}
                    >
                      {lang === 'hi' ? 'पास के काम देखें →' : 'Browse Nearby Jobs →'}
                    </button>
                  </div>
                ) : (
                  workerApplications.map((app) => (
                    <div key={app.id} className="job-card">
                      <div className="job-header">
                        <div>
                          <div className="job-title">{app.job.title}</div>
                          <div className="business-sub">{app.job.business.business_name}</div>
                        </div>
                        <div className="wage-badge">₹{app.job.wage}/{lang === 'hi' ? 'दिन' : 'day'}</div>
                      </div>
                      <div className="job-meta-grid">
                        <div className="meta-chip">
                          <MapPin size={12} />
                          {app.job.locality}
                        </div>
                        <div className="meta-chip">
                          Status: <strong>{app.status}</strong>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="feed-content" style={{ padding: 0 }}>
                {customerJobs.length === 0 ? (
                  <div className="empty-state">
                    <Briefcase size={36} />
                    <p style={{ fontWeight: 700 }}>{t.noJobsPosted}</p>
                    <button
                      className="btn-apply"
                      style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                      onClick={() => setShowPostJobSheet(true)}
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
                          <div className="business-sub">{job.locality}</div>
                        </div>
                        <div className="wage-badge">₹{job.wage}/{lang === 'hi' ? 'दिन' : 'day'}</div>
                      </div>
                      <div className="job-actions">
                        <button
                          className="btn-apply"
                          style={{ background: '#3b82f6', color: '#fff' }}
                          onClick={() => handleViewApplicants(job)}
                        >
                          {t.viewApplicants} ({job.applicant_count})
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: CALLS & CONTACTS (All unlocked telephone/WhatsApp actions) */}
        {activeNavTab === 'CALLS' && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="section-title">
              <Phone size={18} color="#10b981" />
              {lang === 'hi' ? 'अनलॉक किए गए संपर्क और कॉल' : 'Unlocked Contacts & Calls'}
            </div>

            {unlockedCallsCount === 0 ? (
              <div className="empty-state">
                <Phone size={36} />
                <p style={{ fontWeight: 700 }}>
                  {lang === 'hi'
                    ? 'अभी कोई संपर्क अनलॉक नहीं हुआ है।'
                    : 'No direct contacts unlocked yet.'}
                </p>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {lang === 'hi'
                    ? 'जब कोई काम स्वीकार (Accept) होता है, तब दोनों पक्षों का फोन नंबर यहाँ दिखाई देता है।'
                    : 'When a job is accepted, direct phone and WhatsApp contacts unlock here.'}
                </span>
              </div>
            ) : (
              currentUser?.role === 'WORKER' ? (
                workerApplications
                  .filter((a) => a.status === 'ACCEPTED' || a.status === 'COMPLETED')
                  .map((app) => (
                    <div key={app.id} className="unlocked-contact-box">
                      <div className="contact-header">
                        <ShieldCheck size={16} />
                        {app.job.business.business_name}
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#f8fafc' }}>
                        {app.job.title} · {app.job.locality}
                      </div>
                      <div className="contact-actions">
                        <a href={`tel:${app.job.business.phone}`} className="btn-call">
                          <Phone size={14} /> Call ({app.job.business.phone})
                        </a>
                        <a
                          href={`https://wa.me/91${app.job.business.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-whatsapp"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  ))
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                    {lang === 'hi' ? 'आपके द्वारा स्वीकार किए गए कामगार:' : 'Workers accepted across your active jobs:'}
                  </p>
                  {customerJobs.map((j) => (
                    <button
                      key={j.id}
                      className="btn-apply"
                      style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', justifyContent: 'space-between' }}
                      onClick={() => handleViewApplicants(j)}
                    >
                      <span>{j.title} ({j.locality})</span>
                      <span style={{ color: '#34d399' }}>{j.accepted_count} Accepted →</span>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Tab 4: PROFILE */}
        {activeNavTab === 'PROFILE' && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="section-title">
              <UserIcon size={18} color="#f59e0b" />
              {t.navProfile}
            </div>

            <div className="worker-card" style={{ gap: '14px' }}>
              <div className="worker-card-header">
                <div className="worker-name-group">
                  <div className="worker-avatar" style={{ width: '56px', height: '56px', fontSize: '1.3rem' }}>
                    {currentUser?.name.charAt(0)}
                  </div>
                  <div>
                    <div className="worker-name" style={{ fontSize: '1.1rem' }}>
                      {currentUser?.name}
                      <ShieldCheck size={18} color="#10b981" />
                    </div>
                    <div className="worker-trade">
                      {currentUser?.role === 'WORKER' ? t.worker : t.customer} · {currentUser?.phone}
                    </div>
                  </div>
                </div>
              </div>

              <div className="worker-badges-row">
                <div className="trust-badge verified">
                  <CheckCircle2 size={13} />
                  {t.verifiedPhone}
                </div>
                <div className="trust-badge distance">
                  <MapPin size={13} color={userLocation.isLive ? "#10b981" : "#f59e0b"} />
                  {userLocation.locality || t.pilotLocality}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="btn-apply"
                  style={{ background: 'var(--primary-light)', color: '#fbbf24', border: '1px solid var(--primary-border)' }}
                  onClick={() => setShowLoginModal(true)}
                >
                  {currentUser ? t.switchAccount : t.login}
                </button>
                <button
                  className="btn-apply"
                  style={{ background: 'var(--danger-light)', color: '#f87171', border: '1px solid var(--danger)' }}
                  onClick={handleLogout}
                >
                  {t.signOut}
                </button>
              </div>

              {/* Developer / Demo Mode Switcher in Profile */}
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleToggleDemoMode}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isDemoMode ? '#fbbf24' : '#64748b',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {isDemoMode ? `✓ ${t.demoModeActive}` : `🧪 ${t.enterDemoMode}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. FIXED MOBILE BOTTOM NAVIGATION */}
      <BottomNav
        lang={lang}
        activeTab={activeNavTab}
        onSelectTab={setActiveNavTab}
        myJobsCount={
          currentUser?.role === 'WORKER' ? workerApplications.length : customerJobs.length
        }
        unlockedCallsCount={unlockedCallsCount}
      />

      {/* 5. MODAL: POST JOB BOTTOM SHEET */}
      <PostJobSheet
        lang={lang}
        isOpen={showPostJobSheet}
        onClose={() => {
          setShowPostJobSheet(false);
          setPreSelectedWorker(null);
        }}
        skillsList={skillsList}
        onSubmit={handlePostJobSubmit}
        loading={loading}
        preSelectedSkillId={preSelectedWorker?.skills[0]?.id}
        preSelectedWorkerName={preSelectedWorker?.name}
      />

      {/* 6. MODAL: APPLICANT REVIEW SHEET */}
      <ApplicantSheet
        lang={lang}
        isOpen={showApplicantSheet}
        onClose={() => {
          setShowApplicantSheet(false);
          setSelectedJobForApplicants(null);
        }}
        job={selectedJobForApplicants}
        applicants={applicantsList}
        onAcceptWorker={handleAcceptWorker}
        onRateWorker={(workerId, workerName) => {
          setRatingTarget({
            jobId: selectedJobForApplicants?.id || '',
            toUserId: workerId,
            toName: workerName,
            role: 'WORKER',
          });
          setShowRatingModal(true);
        }}
        loading={loading}
      />

      {/* 7. MODAL: MUTUAL RATING & REVIEW */}
      <RatingModal
        lang={lang}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        target={ratingTarget}
        ratingValue={ratingValue}
        onChangeRating={setRatingValue}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        comment={ratingComment}
        onChangeComment={setRatingComment}
        onSubmitReview={handleSubmitReview}
        loading={loading}
      />

      {/* 8. MODAL: DEDICATED LOGIN WINDOW */}
      <LoginModal
        lang={lang}
        isOpen={showLoginModal || !currentUser}
        onClose={() => setShowLoginModal(false)}
        canClose={Boolean(currentUser)}
        loginRole={loginRole}
        onSelectRole={setLoginRole}
        loginStep={loginStep}
        onSetStep={setLoginStep}
        phone={loginPhone}
        onChangePhone={setLoginPhone}
        name={loginName}
        onChangeName={setLoginName}
        locality={loginLocality}
        onChangeLocality={setLoginLocality}
        otp={loginOtp}
        onChangeOtp={setLoginOtp}
        error={loginError}
        loading={loginLoading}
        onSendOtp={handleSendOtp}
        onVerifyOtp={handleVerifyOtp}
        demoPersonas={DEMO_PERSONAS}
        onSelectDemoPersona={(personaKey) => switchPersona(personaKey)}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onContinueAsGuest={() => setShowLoginModal(false)}
      />
    </>
  );
}
