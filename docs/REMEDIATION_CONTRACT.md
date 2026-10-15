# Remediation contract (source of truth for all agents)

Stack: Next.js 14.2 App Router (route `params` are synchronous objects), Prisma 5 + SQLite, TypeScript strict, zod 3, jose 5.
Path alias `@/` → `src/`. Never commit. Do not run `prisma migrate`, `prisma db push` or the seed — the orchestrator does that.

## Shared libraries (already written — import, do not rewrite)

| File | Exports |
|---|---|
| `src/lib/auth.ts` | `createSession(userId)`, `destroySession()`, `getSessionUserId()`, `getCurrentUser()` (user incl. `workerProfile` & `business`, or null), `requireUser()`, `requireWorker()` → `{user, worker}`, `requireBusiness()` → `{user, business}`. The require* helpers THROW `HttpError` (401/403). |
| `src/lib/http.ts` | `ok(data, status?)` → `{success:true, ...data}`, `fail(status, code, msg)`, `HttpError(status, code, msg)`, `handleRouteError(err, context)`, `readJson(request)` |
| `src/lib/validation.ts` | zod schemas: `sendOtpSchema`, `verifyOtpSchema`, `switchRoleSchema`, `createJobSchema`, `updateWorkerProfileSchema`, `availabilitySchema`, `startWorkSchema`, `reviewSchema`, `nearbyQuerySchema`, `queryToObject(searchParams)` |
| `src/lib/status.ts` | `JOB_STATUS`, `APPLICATION_STATUS`, `MATCHED_STATUSES`, `ACTIVE_WORK_STATUSES`, `USER_ROLE`, `AVAILABILITY`, `FEEDBACK_TAGS` |
| `src/lib/otp.ts` | `generateOtp()`, `generateArrivalCode()`, `hashOtp(phone, code)`, `safeEqual(a,b)`, `sendOtpSms(phone, code)`, `isOtpDevMode()`, `OTP_TTL_MS`, `OTP_MAX_ATTEMPTS`, `OTP_RESEND_COOLDOWN_MS`, `OTP_MAX_PER_HOUR` |
| `src/lib/geo.ts` | `calculateDistanceKm`, `boundingBox(lat,lng,km)`, `approximateCoord(v)` |
| `src/lib/date.ts` | `localISODate(d?)`, `addDaysISO(days, d?)` |

## Route handler rules (ALL API routes)

1. Every handler body is wrapped in `try { ... } catch (err) { return handleRouteError(err, '<route name>'); }`.
2. Identity comes ONLY from `requireUser/requireWorker/requireBusiness/getCurrentUser`. NEVER read a user id from body or query (`userId`, `workerId`, `businessId`, `worker_id`, `business_id`, `from_user_id` are all gone).
3. Validate input with the zod schemas (`schema.parse(...)`; ZodError is turned into 400 by handleRouteError).
4. Return with `ok({...})` / throw `HttpError`. Never put `error.message` in a response.
5. Multi-step writes go inside `prisma.$transaction(async (tx) => {...})`. Race-sensitive transitions use conditional `updateMany({ where: { id, status: <expected> } })` and check `count`.
6. Add `export const dynamic = 'force-dynamic';` to every route file that reads cookies or query params.
7. Response JSON keys are snake_case (existing convention).

## Data model changes (prisma/schema.prisma — already applied)

- `Skill.slug` (unique). Slugs: `electrician, plumber, cleaner, painter, carpenter, helper` (Loading/Unloading), `hospitality` (Restaurant Helper / Cook), `general` (General Helper), `construction`, `shop`, `delivery`.
- `Job.invitedWorkerId String?`
- `Application`: removed `workerConfirmedCompleted`/`businessConfirmedCompleted`; added `arrivalOtp String?`, `arrivalOtpAttempts Int`, `startedAt`, `workerConfirmedAt`, `businessConfirmedAt`, `completedAt`, `paymentConfirmedAt` (all `DateTime?`).
- New `OtpRequest { id, phone, codeHash, attempts, expiresAt, consumedAt?, createdAt, userId? }`.

## Lifecycle (server-enforced)

Application: `APPLIED → ACCEPTED → IN_PROGRESS → COMPLETED`; `APPLIED → REJECTED`; `APPLIED ↔ WITHDRAWN`.
Job: `OPEN → FILLED` (when `workersAccepted == workersRequired`) `→ IN_PROGRESS` (first worker starts) `→ COMPLETED` (no ACCEPTED/IN_PROGRESS applications left and at least one COMPLETED). `CANCELLED` is reserved.

## API contract

`MeUser` = `{ id, name, phone, role: 'WORKER'|'BUSINESS', has_worker_profile: boolean, has_business: boolean, locality: string|null, latitude: number|null, longitude: number|null }` (location taken from the profile matching `role`).

| Method & path | Auth | Request | Response (besides `success`) | Errors |
|---|---|---|---|---|
| POST `/api/v1/auth/send-otp` | none | `{phone}` | `{message, dev_otp?}` (dev_otp only when `isOtpDevMode()`) | 400 invalid phone, 429 `RATE_LIMITED` (30 s cooldown, 5/hour per phone) |
| POST `/api/v1/auth/verify-otp` | none | `verifyOtpSchema` | sets cookie; `{user: MeUser, is_new_user}` | 400 `INVALID_OTP` / `OTP_EXPIRED`, 429 `TOO_MANY_ATTEMPTS` |
| POST `/api/v1/auth/logout` | none | – | `{}` | – |
| GET `/api/v1/auth/me` | optional | – | `{user: MeUser \| null}` (200 even when logged out) | – |
| POST `/api/v1/me/role` | user | `switchRoleSchema` | `{user: MeUser}` — sets `User.role`, creates the missing WorkerProfile/Business using the given location (fallback: the other profile's location) | 400 if a profile must be created and no location is known |
| GET `/api/v1/me/active-work` | user | – | `{items: ActiveWorkItem[]}` | – |
| GET `/api/v1/skills` | none | – | `{skills: [{id,name,slug,category,iconName}]}` | – |
| GET `/api/v1/workers/nearby` | none | `nearbyQuerySchema` query (`lat`,`lng` required) | `{count, workers: [{id,name,city,locality,experience_years,expected_wage,availability,rating,rating_count,jobs_completed,distance_km,latitude,longitude,skills:[{id,name,slug,category}]}]}` — coords via `approximateCoord`, NO phone, only `user.isActive`, bounding-box prefilter, `take: 200`, excludes the caller | 400 |
| GET `/api/v1/jobs/nearby` | optional | `nearbyQuerySchema` query | `{count, jobs: [{id,title,description,skill_id,skill_name,skill_slug,wage,food_provided,job_date,start_time,end_time,locality,latitude,longitude,workers_required,workers_accepted,distance_km,is_invited,business:{id,business_name,business_type,locality,rating,rating_count,jobs_completed},my_application_status,application_id}]}` — OPEN jobs only (plus jobs where the caller has an application), excludes the caller's own jobs, bounding-box prefilter | 400 |
| POST `/api/v1/business/jobs` | business | `createJobSchema` | 201 `{job}` | 400 unknown skill / invited worker not found |
| GET `/api/v1/business/jobs` | business | – | `{jobs: [{id,title,description,skill_name,skill_slug,wage,food_provided,job_date,start_time,end_time,locality,latitude,longitude,status,workers_required,workers_accepted,applicant_count (status APPLIED),accepted_count (MATCHED_STATUSES),invited_worker_id}]}` | – |
| GET `/api/v1/business/jobs/[id]/applicants` | business, owns job | – | `{job_id,title,status,workers_required,workers_accepted,applicants:[{application_id,worker_id,name,phone (only MATCHED_STATUSES),city,locality,rating,rating_count,jobs_completed,experience_years,expected_wage,distance_km,status,applied_at,skills:string[]}]}` | 403, 404 |
| POST `/api/v1/jobs/[id]/apply` | worker | – | `{application, auto_accepted: boolean}` — if `job.invitedWorkerId === me` the application is accepted immediately via `acceptApplication` | 404, 400 `NOT_OPEN`, 400 `OWN_JOB`, 409 `ALREADY_APPLIED` (APPLIED/ACCEPTED/IN_PROGRESS/COMPLETED), 403 `REJECTED` |
| POST `/api/v1/jobs/[id]/withdraw` | worker | – | `{application}` | 404, 409 unless status APPLIED |
| POST `/api/v1/applications/[id]/accept` | business, owns job | – | `{application, worker:{id,name,phone}, job_status}` | 403, 404, 409 `NOT_PENDING`, 409 `JOB_FULL` |
| GET `/api/v1/applications/[id]/arrival-code` | business, owns job | – | `{code}` | 403, 404, 409 unless ACCEPTED |
| POST `/api/v1/applications/[id]/start` | worker, owns application | `startWorkSchema` | `{application}` | 400 `WRONG_CODE` (increments attempts), 429 after 5 wrong attempts, 409 unless ACCEPTED |
| POST `/api/v1/applications/[id]/confirm-completion` | worker or business party | – | `{application, completed: boolean, waiting_for: 'WORKER'\|'BUSINESS'\|null}` — idempotent | 403, 404, 409 unless IN_PROGRESS/COMPLETED |
| POST `/api/v1/applications/[id]/confirm-payment` | business party | – | `{application}` — sets `paymentConfirmedAt` (idempotent) | 409 unless COMPLETED |
| POST `/api/v1/reviews` | user | `reviewSchema` | `{review, new_rating}` — caller must be a party of a COMPLETED application; target is the other party; `jobId` from the application; upsert on (job, from, to); target profile chosen by role in that application (worker → WorkerProfile, business → Business); rating/ratingCount recomputed from Review rows inside the transaction | 403, 404, 409 unless COMPLETED |
| GET `/api/v1/worker/profile` | worker | – | `{worker:{id,name,phone,city,locality,latitude,longitude,experience_years,expected_wage,availability,rating,rating_count,jobs_completed,skills:[{id,name,slug,category}]}}` | – |
| PUT `/api/v1/worker/profile` | worker | `updateWorkerProfileSchema` | `{worker}` (same shape as GET) | 400 unknown skill ids |
| PUT `/api/v1/worker/availability` | worker | `availabilitySchema` | `{availability}` | – |
| GET `/api/v1/worker/applications` | worker | – | `{applications:[{id,status,applied_at,started_at,worker_confirmed,business_confirmed,completed_at,job:{id,title,description,skill_name,wage,food_provided,job_date,start_time,end_time,locality,status,business:{id,business_name,business_type,locality,phone (MATCHED only),owner_name (MATCHED only)}}}]}` | – |

The old route `POST /api/v1/jobs/[id]/confirm-completion` is DELETED (replaced by the per-application one).

`ActiveWorkItem` = `{ application_id, job_id, title, locality, wage, job_date, start_time, end_time, stage: 'ACCEPTED'|'IN_PROGRESS'|'COMPLETED', my_role: 'WORKER'|'BUSINESS', counterpart: {id, name, phone}, arrival_code: string|null (business only, while ACCEPTED), i_confirmed, other_confirmed, payment_confirmed, i_reviewed }`.
Includes ACCEPTED/IN_PROGRESS applications where the caller is the worker OR the job's business, plus COMPLETED ones from the last 7 days where `!i_reviewed` or (business and `!payment_confirmed`). Sorted: IN_PROGRESS, ACCEPTED, COMPLETED.

## Shared lifecycle module

`src/lib/lifecycle.ts` exports `acceptApplication(applicationId: string, actingBusinessId: string | null)` used by both the accept route and auto-accept on apply (`actingBusinessId = null` means "system acting for the invited worker"; ownership check skipped). It runs one `$transaction`:
1. Load application + job; 404 if missing; if `actingBusinessId` and `job.businessId !== actingBusinessId` → 403.
2. `application.updateMany({where:{id, status:'APPLIED'}, data:{status:'ACCEPTED', arrivalOtp: generateArrivalCode(), arrivalOtpAttempts:0}})`; count 0 → 409 `NOT_PENDING`.
3. `job.updateMany({where:{id: job.id, status:'OPEN', workersAccepted:{lt: job.workersRequired}}, data:{workersAccepted:{increment:1}}})`; count 0 → throw 409 `JOB_FULL` (rolls back step 2).
4. Re-read job; if `workersAccepted >= workersRequired` → set job `FILLED` and `updateMany` remaining `APPLIED` applications of that job to `REJECTED`.
5. Return `{application, worker:{id,name,phone}, job_status}`.
