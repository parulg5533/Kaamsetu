'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LogOut,
  ArrowLeftRight,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import type { MeUser } from '@/lib/me';
import type { ActiveWorkItem } from '@/lib/types/active-work';
import type { NearbyJob, WorkerApplication } from '@/lib/types/worker';
import type { ApplicationStatus, Availability, FeedbackTag } from '@/lib/status';

// Components
import { Header } from '@/components/common/Header';
import { BottomNav, NavTab } from '@/components/common/BottomNav';
import { OnboardingModal, OnboardingCompletePayload } from '@/components/common/OnboardingModal';
import { MessagesView } from '@/components/common/MessagesView';
import { RatingModal } from '@/components/common/RatingModal';
import { LocationModal, LocationItem } from '@/components/map/LocationModal';
import { CustomerHome, CustomerHomeSkill, CustomerJob } from '@/components/customer/CustomerHome';
import { PostJobSheet, PostJobPayload, InvitedWorker } from '@/components/customer/PostJobSheet';
import { ApplicantSheet, Applicant, ApplicantSheetJob } from '@/components/customer/ApplicantSheet';
import { WorkerHome, WorkerHomeProps } from '@/components/worker/WorkerHome';
import { NearbyWorker } from '@/components/customer/WorkerCard';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

interface UserLocation {
  lat: number;
  lng: number;
  locality: string;
  isLive: boolean;
}

interface Notice {
  text: string;
  variant: 'success' | 'error';
}

interface RatingTarget {
  applicationId: string;
  toName: string;
  role: 'WORKER' | 'BUSINESS';
}

type WorkerProfileState = NonNullable<WorkerHomeProps['workerProfile']>;

type ApiData<T> = Partial<T> & { error?: string };

/** Skill as returned by GET /api/v1/skills. */
type SkillOption = CustomerHomeSkill & { slug: string };

interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: ApiData<T>;
}

const NETWORK_ERROR = 'Network error. Please try again.';
const NOTICE_DURATION_MS = 3500;
const ACTIVE_WORK_POLL_MS = 25000;
const NEARBY_MAX_DISTANCE = '25.0';

const DEFAULT_LOCATION: UserLocation = {
  lat: 31.634,
  lng: 74.8723,
  locality: 'Ranjit Avenue, Amritsar',
  isLive: false,
};

const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, { en: string; hi: string }> = {
  APPLIED: { en: 'Applied', hi: 'आवेदन किया' },
  ACCEPTED: { en: 'Accepted', hi: 'स्वीकृत' },
  IN_PROGRESS: { en: 'In progress', hi: 'काम जारी है' },
  COMPLETED: { en: 'Completed', hi: 'पूरा हुआ' },
  REJECTED: { en: 'Not selected', hi: 'चुना नहीं गया' },
  WITHDRAWN: { en: 'Withdrawn', hi: 'वापस लिया' },
};

/** Thin fetch wrapper. Session cookie is sent automatically (same-origin). Never throws. */
async function api<T extends object>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const headers = new Headers(init?.headers);
    if (init?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const res = await fetch(path, { ...init, headers, credentials: 'same-origin' });
    let data: ApiData<T> = {};
    try {
      data = ((await res.json()) ?? {}) as ApiData<T>;
    } catch {
      data = {};
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: NETWORK_ERROR } as ApiData<T> };
  }
}

const jsonBody = (body: unknown): string => JSON.stringify(body);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function KaamSetuApp() {
  // Global state
  const [lang, setLang] = useState<Language>('en');
  const [currentUser, setCurrentUser] = useState<MeUser | null>(null);
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('EXPLORE');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false); // data loading
  const [actionBusy, setActionBusy] = useState(false); // posting a job, submitting a review

  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_LOCATION);

  // Modals & sheets
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showPostJobSheet, setShowPostJobSheet] = useState(false);
  const [invitedWorker, setInvitedWorker] = useState<InvitedWorker | null>(null);
  const [showApplicantSheet, setShowApplicantSheet] = useState(false);
  const [applicantJob, setApplicantJob] = useState<ApplicantSheetJob | null>(null);
  const [applicants, setApplicants] = useState<Applicant[] | null>(null);

  // Rating modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<RatingTarget | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [selectedTag, setSelectedTag] = useState<FeedbackTag | null>(null);
  const [ratingComment, setRatingComment] = useState('');

  // Core data
  const [skillsList, setSkillsList] = useState<SkillOption[]>([]);
  const [nearbyWorkers, setNearbyWorkers] = useState<NearbyWorker[]>([]);
  const [customerJobs, setCustomerJobs] = useState<CustomerJob[]>([]);

  // Worker data
  const [workerProfile, setWorkerProfile] = useState<WorkerProfileState | null>(null);
  const [availability, setAvailability] = useState<Availability>('AVAILABLE_TODAY');
  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[]>([]);
  const [workerApplications, setWorkerApplications] = useState<WorkerApplication[]>([]);

  // Active work (server-side lifecycle)
  const [activeWork, setActiveWork] = useState<ActiveWorkItem[]>([]);

  // Refs: one notification timer, and request counters to drop stale responses.
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customerReqRef = useRef(0);
  const workerReqRef = useRef(0);
  const activeWorkReqRef = useRef(0);
  const applicantsReqRef = useRef(0);

  const t = translations[lang];
  const tr = (en: string, hi: string) => (lang === 'hi' ? hi : en);

  const showNotification = useCallback((text: string, variant: Notice['variant'] = 'success') => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice({ text, variant });
    noticeTimerRef.current = setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, NOTICE_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  // 1. Initial GPS detection on mount
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

  // 2. Skills and the current session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const skillsRes = await api<{ skills: SkillOption[] }>('/api/v1/skills');
      if (!cancelled && skillsRes.ok && skillsRes.data.skills) {
        setSkillsList(skillsRes.data.skills);
      }
      const meRes = await api<{ user: MeUser | null }>('/api/v1/auth/me');
      if (!cancelled && meRes.ok) {
        setCurrentUser(meRes.data.user ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 3. Data loaders (guarded against stale responses)
  const loadCustomerData = useCallback(
    async (lat: number, lng: number, hasBusiness: boolean) => {
      const reqId = ++customerReqRef.current;
      setLoading(true);
      const [workersRes, jobsRes] = await Promise.all([
        api<{ workers: NearbyWorker[] }>(
          `/api/v1/workers/nearby?lat=${lat}&lng=${lng}&max_distance=${NEARBY_MAX_DISTANCE}`
        ),
        hasBusiness ? api<{ jobs: CustomerJob[] }>('/api/v1/business/jobs') : Promise.resolve(null),
      ]);
      if (reqId !== customerReqRef.current) return;
      if (workersRes.ok) setNearbyWorkers(workersRes.data.workers ?? []);
      setCustomerJobs(jobsRes && jobsRes.ok ? jobsRes.data.jobs ?? [] : []);
      setLoading(false);
    },
    []
  );

  const loadWorkerData = useCallback(async (lat: number, lng: number) => {
    const reqId = ++workerReqRef.current;
    setLoading(true);
    const [profRes, jobsRes, appsRes] = await Promise.all([
      api<{ worker: WorkerProfileState }>('/api/v1/worker/profile'),
      api<{ jobs: NearbyJob[] }>(
        `/api/v1/jobs/nearby?lat=${lat}&lng=${lng}&max_distance=${NEARBY_MAX_DISTANCE}`
      ),
      api<{ applications: WorkerApplication[] }>('/api/v1/worker/applications'),
    ]);
    if (reqId !== workerReqRef.current) return;
    if (profRes.ok && profRes.data.worker) {
      setWorkerProfile(profRes.data.worker);
      setAvailability(profRes.data.worker.availability as Availability);
    }
    if (jobsRes.ok) setNearbyJobs(jobsRes.data.jobs ?? []);
    if (appsRes.ok) setWorkerApplications(appsRes.data.applications ?? []);
    setLoading(false);
  }, []);

  const loadActiveWork = useCallback(async () => {
    const reqId = ++activeWorkReqRef.current;
    const res = await api<{ items: ActiveWorkItem[] }>('/api/v1/me/active-work');
    if (reqId !== activeWorkReqRef.current) return;
    if (res.ok) setActiveWork(res.data.items ?? []);
  }, []);

  /** Loads applicants for one job. A newer call (another job opened, or a refresh) makes this result stale. */
  const loadApplicants = async (jobId: string) => {
    const reqId = ++applicantsReqRef.current;
    const res = await api<{ applicants: Applicant[] }>(`/api/v1/business/jobs/${jobId}/applicants`);
    if (reqId !== applicantsReqRef.current) return;
    if (res.ok) {
      setApplicants(res.data.applicants ?? []);
    } else {
      setApplicants([]);
      showNotification(res.data.error || tr('Could not load applicants', 'आवेदक लोड नहीं हो सके'), 'error');
    }
  };

  // Load the data for the current role (or the logged-out customer view).
  useEffect(() => {
    if (currentUser?.role === 'WORKER') {
      loadWorkerData(userLocation.lat, userLocation.lng);
    } else {
      loadCustomerData(
        userLocation.lat,
        userLocation.lng,
        currentUser?.role === 'BUSINESS' && currentUser.has_business
      );
    }
  }, [currentUser, userLocation.lat, userLocation.lng, loadWorkerData, loadCustomerData]);

  // Active work: load on login/logout.
  useEffect(() => {
    if (!currentUser) {
      activeWorkReqRef.current++;
      setActiveWork([]);
      return;
    }
    loadActiveWork();
  }, [currentUser, loadActiveWork]);

  // Active work: poll while the Messages tab is open.
  useEffect(() => {
    if (!currentUser || activeNavTab !== 'MESSAGES') return;
    loadActiveWork();
    const id = setInterval(loadActiveWork, ACTIVE_WORK_POLL_MS);
    return () => clearInterval(id);
  }, [currentUser, activeNavTab, loadActiveWork]);

  /** Re-fetches active work and the role's lists after any lifecycle or posting action. */
  const refreshAfterAction = () => {
    loadActiveWork();
    if (currentUser?.role === 'WORKER') {
      loadWorkerData(userLocation.lat, userLocation.lng);
    } else if (currentUser?.role === 'BUSINESS') {
      loadCustomerData(userLocation.lat, userLocation.lng, currentUser.has_business);
    }
  };

  /** Returns true when logged in; otherwise opens onboarding and returns false. */
  const requireLogin = (): boolean => {
    if (currentUser) return true;
    setShowOnboardingModal(true);
    return false;
  };

  const openRating = (target: RatingTarget) => {
    setRatingTarget(target);
    setRatingValue(5);
    setSelectedTag(null);
    setRatingComment('');
    setShowRatingModal(true);
  };

  // -------------------------------------------------------------------------
  // Auth & role
  // -------------------------------------------------------------------------

  const handleCompleteOnboarding = async (
    data: OnboardingCompletePayload
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await api<{ user: MeUser }>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: jsonBody({
        phone: data.phone,
        otp: data.otp,
        role: data.role,
        name: data.name,
        locality: data.locality,
        latitude: data.latitude,
        longitude: data.longitude,
      }),
    });
    if (!res.ok || !res.data.user) {
      return { ok: false, error: res.data.error };
    }
    setCurrentUser(res.data.user);
    setShowOnboardingModal(false);
    showNotification(tr(`Welcome to KaamSetu, ${res.data.user.name}!`, `KaamSetu में स्वागत है, ${res.data.user.name}!`));
    return { ok: true };
  };

  const handleLogout = async () => {
    const res = await api('/api/v1/auth/logout', { method: 'POST' });
    // Invalidate every in-flight request so nothing repopulates the cleared state.
    customerReqRef.current++;
    workerReqRef.current++;
    activeWorkReqRef.current++;
    applicantsReqRef.current++;

    setCurrentUser(null);
    setActiveWork([]);
    setWorkerProfile(null);
    setWorkerApplications([]);
    setNearbyJobs([]);
    setCustomerJobs([]);
    setInvitedWorker(null);
    setShowPostJobSheet(false);
    setShowApplicantSheet(false);
    setApplicantJob(null);
    setApplicants(null);
    setShowRatingModal(false);
    setActiveNavTab('EXPLORE');

    if (res.ok) {
      showNotification(tr('Logged out successfully', 'लॉगआउट कर दिया गया'));
    } else {
      showNotification(res.data.error || tr('Signed out here, but the server did not confirm', 'यहाँ लॉगआउट हुआ, पर सर्वर ने पुष्टि नहीं की'), 'error');
    }
  };

  const handleToggleRole = async () => {
    if (!currentUser) {
      setShowOnboardingModal(true);
      return;
    }
    const nextRole = currentUser.role === 'WORKER' ? 'BUSINESS' : 'WORKER';
    const res = await api<{ user: MeUser }>('/api/v1/me/role', {
      method: 'POST',
      body: jsonBody({
        role: nextRole,
        locality: userLocation.locality,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      }),
    });
    if (!res.ok || !res.data.user) {
      showNotification(res.data.error || tr('Could not switch role', 'भूमिका नहीं बदली जा सकी'), 'error');
      return;
    }
    setCurrentUser(res.data.user);
    showNotification(
      tr(`Switched role to ${res.data.user.role}`, `भूमिका बदली गई: ${res.data.user.role}`)
    );
  };

  // -------------------------------------------------------------------------
  // Location
  // -------------------------------------------------------------------------

  const handleSelectLocation = (loc: LocationItem) => {
    const locality = loc.city ? `${loc.locality}, ${loc.city}` : loc.locality;
    setUserLocation({ lat: loc.lat, lng: loc.lng, locality, isLive: loc.isLive });
    showNotification(tr(`Location set to ${locality}`, `स्थान सेट किया गया: ${locality}`));
  };

  // -------------------------------------------------------------------------
  // Worker actions
  // -------------------------------------------------------------------------

  const handleSetAvailability = async (newStatus: Availability) => {
    if (!currentUser) return;
    const previous = availability;
    setAvailability(newStatus);
    const res = await api('/api/v1/worker/availability', {
      method: 'PUT',
      body: jsonBody({ availability: newStatus }),
    });
    if (!res.ok) {
      setAvailability(previous);
      showNotification(res.data.error || tr('Could not update availability', 'उपलब्धता अपडेट नहीं हो सकी'), 'error');
      return;
    }
    showNotification(tr('Availability status updated', 'उपलब्धता अपडेट की गई'));
  };

  const handleApplyJob = async (jobId: string) => {
    if (!requireLogin()) return;
    const res = await api<{ auto_accepted: boolean }>(`/api/v1/jobs/${jobId}/apply`, { method: 'POST' });
    if (!res.ok) {
      showNotification(res.data.error || tr('Could not apply for this job', 'इस काम के लिए आवेदन नहीं हो सका'), 'error');
    } else if (res.data.auto_accepted) {
      showNotification(tr('Hired directly!', 'सीधे काम पर रखा गया!'));
    } else {
      showNotification(tr('Job applied successfully!', 'आवेदन भेजा गया!'));
    }
    refreshAfterAction();
  };

  const handleWithdrawJob = async (jobId: string) => {
    const res = await api(`/api/v1/jobs/${jobId}/withdraw`, { method: 'POST' });
    if (!res.ok) {
      showNotification(res.data.error || tr('Could not withdraw application', 'आवेदन वापस नहीं हो सका'), 'error');
    } else {
      showNotification(tr('Application withdrawn', 'आवेदन वापस लिया गया'));
    }
    refreshAfterAction();
  };

  /** Marks this side of an application as finished. Used by the worker home and the Messages tab. */
  const handleConfirmCompletion = async (applicationId: string): Promise<void> => {
    const res = await api<{ completed: boolean }>(
      `/api/v1/applications/${applicationId}/confirm-completion`,
      { method: 'POST' }
    );
    if (!res.ok) {
      showNotification(res.data.error || tr('Could not mark work finished', 'काम समाप्त नहीं हो सका'), 'error');
    } else if (res.data.completed) {
      showNotification(tr('Work completed! Please leave a review.', 'काम पूरा हुआ! कृपया समीक्षा दें।'));
    } else {
      showNotification(tr('Waiting for the other side to confirm', 'दूसरे पक्ष की पुष्टि का इंतज़ार है'));
    }
    refreshAfterAction();
  };

  // -------------------------------------------------------------------------
  // Active work actions (Messages tab)
  // -------------------------------------------------------------------------

  const handleStartWork = async (applicationId: string, otp: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await api(`/api/v1/applications/${applicationId}/start`, {
      method: 'POST',
      body: jsonBody({ otp }),
    });
    if (!res.ok) {
      return { ok: false, error: res.data.error };
    }
    showNotification(tr('Work started!', 'काम शुरू हुआ!'));
    refreshAfterAction();
    return { ok: true };
  };

  const handleConfirmPayment = async (applicationId: string): Promise<void> => {
    const res = await api(`/api/v1/applications/${applicationId}/confirm-payment`, { method: 'POST' });
    if (!res.ok) {
      showNotification(res.data.error || tr('Could not confirm payment', 'भुगतान की पुष्टि नहीं हो सकी'), 'error');
    } else {
      showNotification(tr('Payment confirmed', 'भुगतान की पुष्टि हुई'));
    }
    refreshAfterAction();
  };

  // -------------------------------------------------------------------------
  // Customer actions
  // -------------------------------------------------------------------------

  const openPostJob = (invite: InvitedWorker | null) => {
    if (!requireLogin()) return;
    setInvitedWorker(invite);
    setShowPostJobSheet(true);
  };

  const handleRequestHireWorker = (worker: NearbyWorker) => {
    openPostJob({ id: worker.id, name: worker.name, skillSlug: worker.skills[0]?.slug });
  };

  const handlePostJobSubmit = async (payload: PostJobPayload): Promise<boolean> => {
    if (!requireLogin()) return false;
    const invited = invitedWorker;
    setActionBusy(true);
    const res = await api<{ job: CustomerJob }>('/api/v1/business/jobs', {
      method: 'POST',
      body: jsonBody(payload),
    });
    setActionBusy(false);
    if (!res.ok) {
      showNotification(res.data.error || tr('Could not post job', 'काम पोस्ट नहीं हो सका'), 'error');
      return false;
    }
    setShowPostJobSheet(false);
    setInvitedWorker(null);
    showNotification(
      invited
        ? tr(`Request sent to ${invited.name}`, `${invited.name} को अनुरोध भेजा गया`)
        : tr('Job posted — waiting for applicants', 'काम पोस्ट हुआ — आवेदकों का इंतज़ार है')
    );
    refreshAfterAction();
    return true;
  };

  const openApplicants = async (job: ApplicantSheetJob) => {
    setApplicantJob(job);
    setApplicants(null);
    setShowApplicantSheet(true);
    await loadApplicants(job.id);
  };

  const handleAcceptWorker = async (applicationId: string): Promise<void> => {
    const jobId = applicantJob?.id;
    const res = await api(`/api/v1/applications/${applicationId}/accept`, { method: 'POST' });
    if (res.ok) {
      showNotification(tr('Worker accepted!', 'कामगार स्वीकार किया गया!'));
    } else {
      showNotification(res.data.error || tr('Could not accept worker', 'कामगार स्वीकार नहीं हो सका'), 'error');
    }
    if (jobId) loadApplicants(jobId);
    refreshAfterAction();
  };

  const handleRateWorker = (workerId: string, workerName: string) => {
    const applicant = applicants?.find((a) => a.worker_id === workerId);
    if (!applicant) {
      showNotification(tr('Could not find this applicant', 'यह आवेदक नहीं मिला'), 'error');
      return;
    }
    openRating({ applicationId: applicant.application_id, toName: workerName, role: 'WORKER' });
  };

  // -------------------------------------------------------------------------
  // Reviews
  // -------------------------------------------------------------------------

  const handleSubmitReview = async () => {
    if (!currentUser || !ratingTarget) return;
    setActionBusy(true);
    const res = await api('/api/v1/reviews', {
      method: 'POST',
      body: jsonBody({
        application_id: ratingTarget.applicationId,
        rating: ratingValue,
        feedback_tag: selectedTag,
        comment: ratingComment,
      }),
    });
    setActionBusy(false);
    if (!res.ok) {
      showNotification(res.data.error || tr('Could not submit review', 'समीक्षा सबमिट नहीं हो सकी'), 'error');
      return;
    }
    setShowRatingModal(false);
    setRatingComment('');
    showNotification(tr('Review submitted successfully!', 'समीक्षा सबमिट हुई!'));
    refreshAfterAction();
  };

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const banner = activeWork.find((item) => item.stage === 'IN_PROGRESS' || item.stage === 'ACCEPTED');
  const isWorker = currentUser?.role === 'WORKER';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      {/* 1. Header with location changer */}
      <Header
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'hi' : 'en'))}
        currentUser={currentUser}
        localityName={userLocation.locality}
        isGpsActive={userLocation.isLive}
        onOpenLocationModal={() => setShowLocationModal(true)}
        onOpenLogin={() => setShowOnboardingModal(true)}
        onOpenProfile={() => setActiveNavTab('PROFILE')}
        onToggleRole={handleToggleRole}
      />

      {/* Floating status notification */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: notice.variant === 'error' ? 'var(--brand-danger)' : 'var(--brand-primary)',
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
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          {notice.variant === 'error' ? (
            <AlertCircle size={16} color="#ffffff" />
          ) : (
            <CheckCircle2 size={16} color="#34d399" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* 2. Lifecycle banner (only while work is accepted or in progress) */}
      {banner && activeNavTab === 'EXPLORE' && (
        <div className="lifecycle-active-banner">
          <div className="lifecycle-text-group">
            <div className="lifecycle-stage-title">
              <Sparkles size={14} color="var(--brand-accent)" />
              <span>
                {banner.stage === 'IN_PROGRESS'
                  ? tr('Work in progress', 'कार्य प्रगति पर है')
                  : tr(`${banner.counterpart.name} is en route`, `${banner.counterpart.name} आ रहे हैं`)}
              </span>
            </div>
            <div className="lifecycle-sub">
              {banner.title}
              {banner.locality ? ` · ${banner.locality}` : ''}
            </div>
          </div>

          <button
            type="button"
            className="lifecycle-action-btn"
            onClick={() => setActiveNavTab('MESSAGES')}
          >
            {tr('View / Call →', 'विवरण / कॉल →')}
          </button>
        </div>
      )}

      {/* 3. Main body tabs */}
      <main className="main-content">
        {activeNavTab === 'EXPLORE' &&
          (isWorker ? (
            <WorkerHome
              lang={lang}
              workerProfile={workerProfile}
              availability={availability}
              onSetAvailability={handleSetAvailability}
              nearbyJobs={nearbyJobs}
              applications={workerApplications}
              userLocation={userLocation}
              onApplyJob={handleApplyJob}
              onWithdrawJob={handleWithdrawJob}
              onConfirmCompleted={handleConfirmCompletion}
              onRateBusiness={(_businessId, businessName, applicationId) =>
                openRating({ applicationId, toName: businessName, role: 'BUSINESS' })
              }
              onOpenMessages={() => setActiveNavTab('MESSAGES')}
              loading={loading}
            />
          ) : (
            <CustomerHome
              lang={lang}
              skillsList={skillsList}
              workers={nearbyWorkers}
              customerJobs={customerJobs}
              userLocation={userLocation}
              onOpenPostJob={() => openPostJob(null)}
              onRequestHireWorker={handleRequestHireWorker}
              onViewApplicants={openApplicants}
              onOpenMyJobs={() => setActiveNavTab('MY_JOBS')}
              loading={loading}
            />
          ))}

        {/* TAB 2: MY_JOBS (customer: posted jobs / worker: applications) */}
        {activeNavTab === 'MY_JOBS' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {isWorker
                  ? tr('My Job Applications', 'मेरे आवेदन')
                  : tr('My Posted Jobs', 'मेरे पोस्ट किए गए काम')}
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {isWorker
                  ? tr('Track your applications and their status', 'आपके सभी आवेदन और उनकी स्थिति')
                  : tr('Review applicants and manage your active requests', 'आपके द्वारा पोस्ट किए गए कार्य और आवेदकों की सूची')}
              </p>
            </div>

            {isWorker ? (
              workerApplications.length === 0 ? (
                <div className="empty-state-view">
                  <Briefcase size={32} className="empty-state-icon" />
                  <div className="empty-state-title">{tr('No job applications yet', 'अभी कोई आवेदन नहीं है')}</div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: '8px' }}
                    onClick={() => setActiveNavTab('EXPLORE')}
                  >
                    {tr('Browse Nearby Jobs →', 'पास के काम देखें →')}
                  </button>
                </div>
              ) : (
                workerApplications.map((app) => {
                  const label = APPLICATION_STATUS_LABEL[app.status];
                  return (
                    <div
                      key={app.id}
                      className="job-item"
                      style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                    >
                      <div className="job-header-row">
                        <div>
                          <div className="job-title">{app.job.title}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {app.job.business.business_name}
                          </div>
                        </div>
                        <div className="job-wage">₹{app.job.wage}/{tr('day', 'दिन')}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {app.job.locality} ·{' '}
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {label ? tr(label.en, label.hi) : app.status}
                          </strong>
                        </div>
                        {app.status === 'APPLIED' && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ minHeight: '30px', fontSize: '0.78rem' }}
                            onClick={() => handleWithdrawJob(app.job.id)}
                          >
                            {tr('Withdraw', 'वापस लें')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            ) : customerJobs.length === 0 ? (
              <div className="empty-state-view">
                <Briefcase size={32} className="empty-state-icon" />
                <div className="empty-state-title">{tr('No jobs posted yet', 'कोई काम पोस्ट नहीं किया गया है')}</div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '8px' }}
                  onClick={() => openPostJob(null)}
                >
                  {t.postJobButton}
                </button>
              </div>
            ) : (
              customerJobs.map((job) => (
                <div
                  key={job.id}
                  className="job-item"
                  style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="job-header-row">
                    <div>
                      <div className="job-title">{job.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{job.locality}</div>
                    </div>
                    <div className="job-wage">₹{job.wage}/{tr('day', 'दिन')}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {job.applicant_count || 0} {tr('applicants', 'कामगारों ने आवेदन किया')}
                    </span>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ minHeight: '32px', fontSize: '0.78rem' }}
                      onClick={() => openApplicants(job)}
                    >
                      {tr('View Applicants', 'आवेदक देखें')} ({job.applicant_count || 0})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: MESSAGES & COORDINATION */}
        {activeNavTab === 'MESSAGES' && (
          <MessagesView
            lang={lang}
            items={activeWork}
            onStartWork={handleStartWork}
            onConfirmFinish={handleConfirmCompletion}
            onConfirmPayment={handleConfirmPayment}
            onOpenRating={(applicationId, counterpartName, counterpartRole) =>
              openRating({ applicationId, toName: counterpartName, role: counterpartRole })
            }
          />
        )}

        {/* TAB 4: PROFILE */}
        {activeNavTab === 'PROFILE' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {tr('Account & Profile', 'मेरी प्रोफ़ाइल')}
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
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : '?'}
                </div>

                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {currentUser?.name || tr('Guest', 'अतिथि')}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {currentUser
                      ? `${isWorker ? tr('Worker', 'कामगार (Worker)') : tr('Customer', 'ग्राहक (Customer)')} · ${currentUser.phone}`
                      : tr('Not logged in', 'लॉग इन नहीं है')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                {currentUser ? (
                  <>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={handleToggleRole}>
                      <ArrowLeftRight size={14} />
                      <span>{tr('Switch Role', 'भूमिका बदलें')}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ color: 'var(--brand-danger)' }}
                      onClick={handleLogout}
                    >
                      <LogOut size={14} />
                      <span>{tr('Sign Out', 'लॉगआउट')}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => setShowOnboardingModal(true)}
                  >
                    {tr('Log in', 'लॉग इन करें')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Fixed bottom navigation */}
      <BottomNav
        lang={lang}
        userRole={currentUser?.role}
        activeTab={activeNavTab}
        onSelectTab={setActiveNavTab}
        myJobsCount={isWorker ? workerApplications.length : customerJobs.length}
        messagesCount={activeWork.length}
      />

      {/* 5. Post job wizard */}
      <PostJobSheet
        lang={lang}
        isOpen={showPostJobSheet}
        onClose={() => {
          setShowPostJobSheet(false);
          setInvitedWorker(null);
        }}
        skillsList={skillsList}
        onSubmit={handlePostJobSubmit}
        loading={actionBusy}
        userLocality={userLocation.locality}
        userCoordinates={{ latitude: userLocation.lat, longitude: userLocation.lng }}
        invitedWorker={invitedWorker}
      />

      {/* 6. Applicant review sheet */}
      <ApplicantSheet
        lang={lang}
        isOpen={showApplicantSheet}
        onClose={() => {
          setShowApplicantSheet(false);
          setApplicantJob(null);
          setApplicants(null);
          applicantsReqRef.current++;
        }}
        job={applicantJob}
        applicants={applicants}
        onAcceptWorker={handleAcceptWorker}
        onRateWorker={handleRateWorker}
      />

      {/* 7. Rating & review modal */}
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
        loading={actionBusy}
      />

      {/* 8. Location modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        lang={lang}
        currentLocality={userLocation.locality}
        onSelectLocation={handleSelectLocation}
      />

      {/* 9. Onboarding / auth modal */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        lang={lang}
        onCompleteOnboarding={handleCompleteOnboarding}
      />
    </>
  );
}
