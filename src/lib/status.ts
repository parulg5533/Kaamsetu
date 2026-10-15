// Single source of truth for lifecycle status strings (SQLite has no enums).
// Imported by both API routes and client components.

export const JOB_STATUS = {
  OPEN: 'OPEN',
  FILLED: 'FILLED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

// Application lifecycle:
//   APPLIED -> ACCEPTED -> IN_PROGRESS (arrival OTP verified) -> COMPLETED (both sides confirmed)
//   APPLIED -> REJECTED (job filled / declined)
//   APPLIED -> WITHDRAWN -> APPLIED (worker may re-apply after withdrawing)
export const APPLICATION_STATUS = {
  APPLIED: 'APPLIED',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type ApplicationStatus = (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

/** Statuses where the two parties are matched and may see each other's phone number. */
export const MATCHED_STATUSES: readonly string[] = [
  APPLICATION_STATUS.ACCEPTED,
  APPLICATION_STATUS.IN_PROGRESS,
  APPLICATION_STATUS.COMPLETED,
];

/** Statuses representing work that is booked or underway (not yet finished). */
export const ACTIVE_WORK_STATUSES: readonly string[] = [
  APPLICATION_STATUS.ACCEPTED,
  APPLICATION_STATUS.IN_PROGRESS,
];

export const USER_ROLE = {
  WORKER: 'WORKER',
  BUSINESS: 'BUSINESS',
} as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const AVAILABILITY = ['AVAILABLE_TODAY', 'AVAILABLE_TOMORROW', 'UNAVAILABLE'] as const;
export type Availability = (typeof AVAILABILITY)[number];

/** Stable, language-independent review tag keys. Translate only for display. */
export const FEEDBACK_TAGS = [
  'PUNCTUAL',
  'HARDWORKING',
  'SKILLED',
  'POLITE',
  'PAID_ON_TIME',
  'FAIR_WORKLOAD',
  'GOOD_FOOD',
  'RESPECTFUL',
] as const;
export type FeedbackTag = (typeof FEEDBACK_TAGS)[number];
