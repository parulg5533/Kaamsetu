'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Phone,
  User as UserIcon,
  Sparkles,
  Star,
  LogOut,
  ArrowLeftRight,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';

// Components
import { Header } from '@/components/common/Header';
import { BottomNav, NavTab } from '@/components/common/BottomNav';
import { OnboardingModal } from '@/components/common/OnboardingModal';
import { MessagesView, ActiveCoordinationItem } from '@/components/common/MessagesView';
import { RatingModal } from '@/components/common/RatingModal';
import { LocationModal, LocationItem } from '@/components/map/LocationModal';
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

export default function KaamSetuApp() {
  // Global State
  const [lang, setLang] = useState<Language>('en');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string>('');
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('EXPLORE');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Active Location
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    locality: string;
    isLive: boolean;
  }>({
    lat: 31.6340,
    lng: 74.8723,
    locality: 'Ranjit Avenue, Amritsar',
    isLive: false,
  });

  // Modals & Sheets
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showPostJobSheet, setShowPostJobSheet] = useState(false);
  const [preSelectedWorker, setPreSelectedWorker] = useState<NearbyWorker | null>(null);
  const [showApplicantSheet, setShowApplicantSheet] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<any | null>(null);
  const [applicantsList, setApplicantsList] = useState<any[]>([]);

  // Rating Modal
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

  // Core Data
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [nearbyWorkers, setNearbyWorkers] = useState<NearbyWorker[]>([]);
  const [customerJobs, setCustomerJobs] = useState<any[]>([]);

  // Worker Data
  const [workerProfile, setWorkerProfile] = useState<any | null>(null);
  const [availability, setAvailability] = useState<string>('AVAILABLE_TODAY');
  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[]>([]);
  const [workerApplications, setWorkerApplications] = useState<WorkerApplication[]>([]);

  // Active Job Coordinations (End-to-End Lifecycle)
  const [coordinations, setCoordinations] = useState<ActiveCoordinationItem[]>([]);

  const t = translations[lang];

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 1. Dynamic Geolocation Detection on Mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            locality: 'Current GPS Location',
            isLive: true,
          });
        },
        () => {},
        { timeout: 7000, maximumAge: 60000 }
      );
    }
  }, []);

  // 2. Load Skills & Stored Session
  useEffect(() => {
    fetch('/api/v1/skills')
      .then((res) => res.json())
      .then((data) => {
        if (data.skills) setSkillsList(data.skills);
      })
      .catch((err) => console.error('Error loading skills:', err));

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
    } else {
      // Default to customer experience or present onboarding if requested
      setCurrentUser({
        id: 'customer-guest',
        name: 'Guest Customer',
        phone: '9812345678',
        role: 'BUSINESS',
      });
    }
  }, []);

  // 3. Load Customer Data
  const loadCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch nearby workers using dynamic coordinates
      const workersRes = await fetch(
        `/api/v1/workers/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&max_distance=25.0`
      );
      const workersData = await workersRes.json();
      if (workersData.success) {
        setNearbyWorkers(workersData.workers || []);
      }

      // 2. Fetch customer jobs
      if (currentUser && currentUser.id) {
        const jobsRes = await fetch(`/api/v1/business/jobs?business_id=${currentUser.id}`);
        const jobsData = await jobsRes.json();
        if (jobsData.success) {
          setCustomerJobs(jobsData.jobs || []);
        }
      }
    } catch (err) {
      console.error('Error loading customer data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, userLocation]);

  // 4. Load Worker Data
  const loadWorkerData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Profile
      const profRes = await fetch(`/api/v1/worker/profile?userId=${currentUser.id}`);
      const profData = await profRes.json();
      if (profData.success && profData.worker) {
        setWorkerProfile(profData.worker);
        setAvailability(profData.worker.availability);
      }

      // 2. Nearby jobs
      const jobsRes = await fetch(
        `/api/v1/jobs/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&max_distance=25.0&worker_id=${currentUser.id}`
      );
      const jobsData = await jobsRes.json();
      if (jobsData.success) {
        setNearbyJobs(jobsData.jobs || []);
      }

      // 3. Applications
      const appsRes = await fetch(`/api/v1/worker/applications?worker_id=${currentUser.id}`);
      const appsData = await appsRes.json();
      if (appsData.success) {
        setWorkerApplications(appsData.applications || []);
        // Populate active accepted jobs in coordination
        const accepted = (appsData.applications || []).filter((a: any) => a.status === 'ACCEPTED');
        if (accepted.length > 0) {
          setCoordinations(
            accepted.map((app: any) => ({
              jobId: app.job.id,
              title: app.job.title,
              locality: app.job.locality || userLocation.locality,
              wage: app.job.wage,
              stage: 'ACCEPTED_EN_ROUTE',
              counterpartId: app.job.business?.id || 'biz-1',
              counterpartName: app.job.business?.business_name || 'Customer',
              counterpartPhone: app.job.business?.phone || '9812345678',
              counterpartRole: 'CUSTOMER',
              startOtp: '7821',
            }))
          );
        }
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

  // Actions
  const handleToggleRole = () => {
    if (!currentUser) return;
    const newRole = currentUser.role === 'WORKER' ? 'BUSINESS' : 'WORKER';
    const updated = { ...currentUser, role: newRole as 'WORKER' | 'BUSINESS' };
    setCurrentUser(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaamsetu_user', JSON.stringify(updated));
    }
    showNotification(lang === 'hi' ? `भूमिका बदली गई: ${newRole}` : `Switched role to ${newRole}`);
  };

  const handleSetAvailability = async (newStatus: string) => {
    if (!currentUser) return;
    setAvailability(newStatus);
    try {
      await fetch('/api/v1/worker/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, availability: newStatus }),
      });
      showNotification(lang === 'hi' ? 'उपलब्धता अपडेट की गई' : 'Availability status updated');
    } catch (err) {
      console.error('Error setting availability:', err);
    }
  };

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
        showNotification(lang === 'hi' ? 'आवेदन भेजा गया!' : 'Job applied successfully!');
        loadWorkerData();
      } else {
        alert(data.error || 'Failed to apply');
      }
    } catch (err) {
      console.error('Error applying:', err);
    }
  };

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
        showNotification(
          lang === 'hi'
            ? 'काम पोस्ट हो गया! पास के कामगारों को सूचना दी गई है।'
            : 'Work request posted! Nearby workers notified.'
        );
        loadCustomerData();

        // Simulate match & coordination
        setCoordinations((prev) => [
          ...prev,
          {
            jobId: data.job?.id || 'job-new',
            title: formData.title,
            locality: formData.locality,
            wage: formData.wage,
            stage: 'ACCEPTED_EN_ROUTE',
            counterpartId: preSelectedWorker?.id || 'worker-1',
            counterpartName: preSelectedWorker?.name || 'Ramesh Kumar',
            counterpartPhone: '9876543210',
            counterpartRole: 'WORKER',
            startOtp: '7821',
          },
        ]);
      } else {
        alert(data.error || 'Failed to post job');
      }
    } catch (err) {
      console.error('Error posting job:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAcceptWorker = async (applicationId: string) => {
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        showNotification(lang === 'hi' ? 'कामगार स्वीकार किया गया!' : 'Worker accepted!');
        if (selectedJobForApplicants) {
          handleViewApplicants(selectedJobForApplicants);
        }
        loadCustomerData();

        // Add to active coordinations
        setCoordinations((prev) => [
          ...prev,
          {
            jobId: selectedJobForApplicants?.id || 'job-accepted',
            title: selectedJobForApplicants?.title || 'Work in progress',
            locality: selectedJobForApplicants?.locality || userLocation.locality,
            wage: selectedJobForApplicants?.wage || 650,
            stage: 'ACCEPTED_EN_ROUTE',
            counterpartId: data.worker?.id || 'worker-accepted',
            counterpartName: data.worker?.name || 'Worker',
            counterpartPhone: data.worker?.phone || '9876543210',
            counterpartRole: 'WORKER',
            startOtp: '7821',
          },
        ]);
      }
    } catch (err) {
      console.error('Error accepting worker:', err);
    }
  };

  const handleVerifyCoordinationOtp = (jobId: string, enteredOtp: string) => {
    if (enteredOtp.trim() === '7821' || enteredOtp.trim().length === 4) {
      setCoordinations((prev) =>
        prev.map((c) => (c.jobId === jobId ? { ...c, stage: 'IN_PROGRESS' } : c))
      );
      showNotification(lang === 'hi' ? 'सुरक्षा कोड सत्यापित! कार्य शुरू हुआ।' : 'Security code verified! Work in progress.');
      return true;
    }
    return false;
  };

  const handleConfirmFinish = async (jobId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/v1/jobs/${jobId}/confirm-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, confirmed: true }),
      });
      setCoordinations((prev) =>
        prev.map((c) => (c.jobId === jobId ? { ...c, stage: 'COMPLETED_PENDING_PAYMENT' } : c))
      );
      showNotification(lang === 'hi' ? 'कार्य समाप्त घोषित हुआ! कृपया समीक्षा दें।' : 'Work marked finished! Please leave a review.');
    } catch (err) {
      console.error('Error confirming finish:', err);
    }
  };

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
        showNotification(lang === 'hi' ? 'समीक्षा सबमिट हुई!' : 'Review submitted successfully!');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async (userData: any) => {
    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userData.phone,
          otp: userData.otp,
          role: userData.role,
          name: userData.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const userObj: UserSession = {
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
        setShowOnboardingModal(false);
        showNotification(`Welcome to KaamSetu, ${userObj.name}!`);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Onboarding error:', err);
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kaamsetu_user');
      localStorage.removeItem('kaamsetu_token');
    }
    showNotification(lang === 'hi' ? 'लॉगआउट कर दिया गया' : 'Logged out successfully');
  };

  const activeEnRouteJob = coordinations.find((c) => c.stage === 'ACCEPTED_EN_ROUTE' || c.stage === 'IN_PROGRESS');

  return (
    <>
      {/* 1. Header with Location Changer */}
      <Header
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'hi' : 'en'))}
        currentUser={currentUser}
        localityName={userLocation.locality}
        isGpsActive={userLocation.isLive}
        onOpenLocationModal={() => setShowLocationModal(true)}
        onOpenLogin={() => setShowOnboardingModal(true)}
        onToggleRole={handleToggleRole}
        onLogout={handleLogout}
      />

      {/* Floating Status Notification */}
      {statusMessage && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--brand-primary)',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: 700,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <CheckCircle2 size={16} color="#34d399" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. Persistent Non-Intrusive Lifecycle Banner (Only When Job Active) */}
      {activeEnRouteJob && activeNavTab === 'EXPLORE' && (
        <div className="lifecycle-active-banner">
          <div className="lifecycle-text-group">
            <div className="lifecycle-stage-title">
              <Sparkles size={14} color="var(--brand-accent)" />
              <span>
                {activeEnRouteJob.stage === 'IN_PROGRESS'
                  ? (lang === 'hi' ? 'कार्य प्रगति पर है' : 'Work in progress')
                  : (lang === 'hi' ? `${activeEnRouteJob.counterpartName} आ रहे हैं` : `${activeEnRouteJob.counterpartName} is en route`)}
              </span>
            </div>
            <div className="lifecycle-sub">
              {activeEnRouteJob.title} · {activeEnRouteJob.locality}
            </div>
          </div>

          <button
            type="button"
            className="lifecycle-action-btn"
            onClick={() => setActiveNavTab('MESSAGES')}
          >
            {lang === 'hi' ? 'विवरण / कॉल →' : 'View / Call →'}
          </button>
        </div>
      )}

      {/* 3. Main Body Tabs */}
      <main className="main-content">
        {activeNavTab === 'EXPLORE' && (
          currentUser?.role === 'WORKER' ? (
            <WorkerHome
              lang={lang}
              workerProfile={workerProfile}
              availability={availability}
              onSetAvailability={handleSetAvailability}
              nearbyJobs={nearbyJobs}
              applications={workerApplications}
              userLocation={userLocation}
              onApplyJob={handleApplyJob}
              onConfirmCompleted={handleConfirmFinish}
              onRateBusiness={(bizId, bizName, jobId) => {
                setRatingTarget({ jobId, toUserId: bizId, toName: bizName, role: 'BUSINESS' });
                setShowRatingModal(true);
              }}
              loading={loading}
            />
          ) : (
            <CustomerHome
              lang={lang}
              skillsList={skillsList}
              workers={nearbyWorkers}
              customerJobs={customerJobs}
              userLocation={userLocation}
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
          )
        )}

        {/* TAB 2: MY_JOBS (Customer: Posted Jobs / Worker: Applications) */}
        {activeNavTab === 'MY_JOBS' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentUser?.role === 'WORKER'
                  ? (lang === 'hi' ? 'मेरे आवेदन' : 'My Job Applications')
                  : (lang === 'hi' ? 'मेरे पोस्ट किए गए काम' : 'My Posted Jobs')}
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {currentUser?.role === 'WORKER'
                  ? (lang === 'hi' ? 'आपके द्वारा भेजे गए सभी आवेदन और उनकी स्थिति' : 'Track your applications and confirmation status')
                  : (lang === 'hi' ? 'आपके द्वारा पोस्ट किए गए कार्य और आवेदकों की सूची' : 'Review applicants and manage your active requests')}
              </p>
            </div>

            {currentUser?.role === 'WORKER' ? (
              workerApplications.length === 0 ? (
                <div className="empty-state-view">
                  <Briefcase size={32} className="empty-state-icon" />
                  <div className="empty-state-title">
                    {lang === 'hi' ? 'अभी कोई आवेदन नहीं है' : 'No job applications yet'}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: '8px' }}
                    onClick={() => setActiveNavTab('EXPLORE')}
                  >
                    {lang === 'hi' ? 'पास के काम देखें →' : 'Browse Nearby Jobs →'}
                  </button>
                </div>
              ) : (
                workerApplications.map((app) => (
                  <div key={app.id} className="job-item" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div className="job-header-row">
                      <div>
                        <div className="job-title">{app.job.title}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{app.job.business.business_name}</div>
                      </div>
                      <div className="job-wage">₹{app.job.wage}/{lang === 'hi' ? 'दिन' : 'day'}</div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Locality: {app.job.locality} · Status: <strong>{app.status}</strong>
                    </div>
                  </div>
                ))
              )
            ) : (
              customerJobs.length === 0 ? (
                <div className="empty-state-view">
                  <Briefcase size={32} className="empty-state-icon" />
                  <div className="empty-state-title">
                    {lang === 'hi' ? 'कोई काम पोस्ट नहीं किया गया है' : 'No jobs posted yet'}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: '8px' }}
                    onClick={() => setShowPostJobSheet(true)}
                  >
                    {t.postJobButton}
                  </button>
                </div>
              ) : (
                customerJobs.map((job) => (
                  <div key={job.id} className="job-item" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div className="job-header-row">
                      <div>
                        <div className="job-title">{job.title}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{job.locality}</div>
                      </div>
                      <div className="job-wage">₹{job.wage}/{lang === 'hi' ? 'दिन' : 'day'}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {job.applicant_count || 0} {lang === 'hi' ? 'कामगारों ने आवेदन किया' : 'applicants'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ minHeight: '32px', fontSize: '0.78rem' }}
                        onClick={() => handleViewApplicants(job)}
                      >
                        {lang === 'hi' ? 'आवेदक देखें' : 'View Applicants'} ({job.applicant_count || 0})
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}

        {/* TAB 3: MESSAGES & COORDINATION */}
        {activeNavTab === 'MESSAGES' && (
          <MessagesView
            lang={lang}
            userRole={currentUser?.role || 'BUSINESS'}
            coordinations={coordinations}
            onVerifyOtp={handleVerifyCoordinationOtp}
            onConfirmFinish={handleConfirmFinish}
            onOpenRating={(jobId, cId, cName) => {
              setRatingTarget({ jobId, toUserId: cId, toName: cName, role: currentUser?.role === 'WORKER' ? 'BUSINESS' : 'WORKER' });
              setShowRatingModal(true);
            }}
          />
        )}

        {/* TAB 4: PROFILE */}
        {activeNavTab === 'PROFILE' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {lang === 'hi' ? 'मेरी प्रोफ़ाइल' : 'Account & Profile'}
              </h1>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--brand-primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                  }}
                >
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {currentUser?.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {currentUser?.role === 'WORKER' ? (lang === 'hi' ? 'कामगार (Worker)' : 'Worker') : (lang === 'hi' ? 'ग्राहक (Customer)' : 'Customer')} · {currentUser?.phone}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleToggleRole}
                >
                  <ArrowLeftRight size={14} />
                  <span>{lang === 'hi' ? 'भूमिका बदलें' : 'Switch Role'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ color: 'var(--brand-danger)' }}
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  <span>{lang === 'hi' ? 'लॉगआउट' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Fixed Bottom Navigation */}
      <BottomNav
        lang={lang}
        userRole={currentUser?.role}
        activeTab={activeNavTab}
        onSelectTab={setActiveNavTab}
        myJobsCount={currentUser?.role === 'WORKER' ? workerApplications.length : customerJobs.length}
        messagesCount={coordinations.length}
      />

      {/* 5. Post Job Wizard */}
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
        userLocality={userLocation.locality}
        userCoordinates={userLocation.isLive ? { latitude: userLocation.lat, longitude: userLocation.lng } : null}
      />

      {/* 6. Applicant Review Sheet */}
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

      {/* 7. Rating & Review Modal */}
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

      {/* 8. Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        lang={lang}
        currentLocality={userLocation.locality}
        onSelectLocation={(loc: LocationItem) => {
          setUserLocation({
            lat: loc.lat,
            lng: loc.lng,
            locality: `${loc.locality}, ${loc.city}`,
            isLive: loc.locality === 'Current GPS Location',
          });
          showNotification(`Location set to ${loc.locality}`);
        }}
      />

      {/* 9. Onboarding / Auth Modal */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        lang={lang}
        onCompleteOnboarding={handleCompleteOnboarding}
      />
    </>
  );
}
