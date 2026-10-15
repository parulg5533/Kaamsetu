# KaamSetu REST API (v1)

Base URL: `/api/v1`. Bodies are `application/json`. Response keys are `snake_case`.

Source of truth: [`docs/REMEDIATION_CONTRACT.md`](docs/REMEDIATION_CONTRACT.md). Input schemas are in `src/lib/validation.ts`; status strings are in `src/lib/status.ts`.

---

## Conventions

### Success

Every success response has `"success": true` plus the route's fields.

```json
{ "success": true, "user": { "id": "clx…" } }
```

### Errors

```json
{ "success": false, "code": "NOT_OPEN", "error": "This job is no longer accepting applications" }
```

`error` is a human-readable message and is safe to show. Internal error details are logged server-side and never returned.

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body or query failed validation. `error` is `"<field>: <message>"`. |
| 400 | `BAD_JSON` | Body is not valid JSON. |
| 400 | `INVALID_REFERENCE` | A referenced record does not exist (for example an unknown skill id). |
| 401 | `UNAUTHENTICATED` | No valid `ks_session` cookie. |
| 403 | `FORBIDDEN` | Caller is not allowed (not the owner, not a party, wrong role). |
| 404 | `NOT_FOUND` | Record does not exist. |
| 409 | `NOT_PENDING`, `JOB_FULL`, `ALREADY_APPLIED`, ... | Current state does not allow the action. Route sections list the specific codes. |
| 429 | `RATE_LIMITED`, `TOO_MANY_ATTEMPTS` | Throttled. |
| 500 | `INTERNAL_ERROR` | Unexpected failure. |

### Identity

The server derives the caller from the session cookie. Clients never send their own user id. Fields such as `userId`, `workerId`, `businessId`, `worker_id`, `business_id` and `from_user_id` are not accepted. IDs that refer to *other* records (for example `invited_worker_id`) are still accepted.

### Privacy

Worker coordinates in discovery responses are rounded to about 110 m. Phone numbers are never returned by discovery endpoints. They appear only once an application is in a matched status (ACCEPTED, IN_PROGRESS, COMPLETED).

---

## Authentication

KaamSetu uses an httpOnly cookie. Do not send an `Authorization` header.

1. `POST /auth/send-otp` with a phone number. A 4-digit code is sent by SMS.
2. `POST /auth/verify-otp` with the phone and code. On success the server sets the cookie `ks_session`.
3. The browser sends `ks_session` on every later request. It is a signed JWT (HS256, signed with `AUTH_SECRET`), `httpOnly`, `SameSite=Lax`, `Secure` in production, valid for **30 days**.
4. `POST /auth/logout` clears the cookie.

Requests without a valid cookie are treated as logged out.

Auth levels used in the endpoint tables:

| Level | Meaning |
|---|---|
| none | No session needed. |
| optional | Works logged out. Extra fields are returned when logged in. |
| user | Any logged-in user. |
| worker | Logged in with a worker profile (`requireWorker`). |
| business | Logged in with a business profile (`requireBusiness`). |
| owns job | Business that owns the job. |
| party | Worker or business on the application. |

### MeUser

```json
{
  "id": "clx…",
  "name": "Rahul Kumar",
  "phone": "9876543210",
  "role": "WORKER",
  "has_worker_profile": true,
  "has_business": false,
  "locality": "Lawrence Road",
  "latitude": 31.62,
  "longitude": 74.87
}
```

`locality`, `latitude` and `longitude` come from the profile matching `role`.

---

## Auth

### POST /auth/send-otp
Auth: none

Request:
```json
{ "phone": "9876543210" }
```

Response:
```json
{ "success": true, "message": "OTP sent to 9876543210", "dev_otp": "1234" }
```

`dev_otp` is returned only in dev mode (`OTP_DEV_MODE=true` and `NODE_ENV` not `production`).

Errors: 400 `VALIDATION_ERROR` (not a 10-digit Indian mobile number starting with 6-9). 429 `RATE_LIMITED` (30 s cooldown per phone; at most 5 codes per hour per phone).

### POST /auth/verify-otp
Auth: none. Sets the `ks_session` cookie.

Request:
```json
{
  "phone": "9876543210",
  "otp": "1234",
  "role": "WORKER",
  "name": "Rahul Kumar",
  "locality": "Lawrence Road",
  "latitude": 31.62,
  "longitude": 74.87
}
```

`role` defaults to `WORKER`. `name`, `locality`, `latitude` and `longitude` are used when the account is created.

Response:
```json
{ "success": true, "user": { "…MeUser" }, "is_new_user": false }
```

Errors: 400 `INVALID_OTP`. 400 `OTP_EXPIRED` (codes expire after 5 minutes). 429 `TOO_MANY_ATTEMPTS` (5 wrong attempts).

### POST /auth/logout
Auth: none. Clears `ks_session`.

Response: `{ "success": true }`

### GET /auth/me
Auth: optional. Always returns 200.

Response: `{ "success": true, "user": null }` when logged out, otherwise `{ "success": true, "user": { "…MeUser" } }`.

### POST /me/role
Auth: user. Switches the active role. Creates the missing profile (WorkerProfile or Business) from the supplied location, falling back to the other profile's location.

Request:
```json
{ "role": "BUSINESS", "locality": "GT Road", "latitude": 31.6, "longitude": 74.9 }
```

Response: `{ "success": true, "user": { "…MeUser" } }`

Errors: 400 `VALIDATION_ERROR`. 400 when a profile must be created and no location is known.

### GET /me/active-work
Auth: user.

Returns the caller's live work:
- ACCEPTED and IN_PROGRESS applications where the caller is the worker, or the job's business.
- COMPLETED applications from the last 7 days where the caller has not reviewed yet (a business also sees ones awaiting payment confirmation).

Sorted IN_PROGRESS, ACCEPTED, COMPLETED.

Response:
```json
{
  "success": true,
  "items": [
    {
      "application_id": "app_1",
      "job_id": "job_1",
      "title": "Kitchen helper",
      "locality": "Lawrence Road",
      "wage": 800,
      "job_date": "2026-10-17",
      "start_time": "10:00",
      "end_time": "20:00",
      "stage": "ACCEPTED",
      "my_role": "BUSINESS",
      "counterpart": { "id": "usr_3", "name": "Aman Singh", "phone": "9876543211" },
      "arrival_code": "4821",
      "i_confirmed": false,
      "other_confirmed": false,
      "payment_confirmed": false,
      "i_reviewed": false
    }
  ]
}
```

`arrival_code` is non-null only for the business while `stage` is `ACCEPTED`.

---

## Catalogue and discovery

### GET /skills
Auth: none.

Response:
```json
{
  "success": true,
  "skills": [
    { "id": "sk_1", "name": "Electrician & Wiring", "slug": "electrician", "category": "TECHNICAL", "iconName": "zap" }
  ]
}
```

Slugs: `electrician`, `plumber`, `cleaner`, `painter`, `carpenter`, `helper` (Loading / Unloading), `hospitality` (Restaurant Helper / Cook), `general` (General Helper), `construction`, `shop`, `delivery`.

### GET /workers/nearby
Auth: none.

Query (`nearbyQuerySchema`):

| Param | Required | Notes |
|---|---|---|
| `lat` | yes | -90 to 90 |
| `lng` | yes | -180 to 180 |
| `max_distance` | no | km, 0.5 to 50, default 10 |
| `skill_id` | no | Filter by skill id. |

Returns active workers, excluding the caller, at most 200. Distance is exact Haversine after a bounding-box prefilter.

Response:
```json
{
  "success": true,
  "count": 1,
  "workers": [
    {
      "id": "usr_3",
      "name": "Aman Singh",
      "city": "Amritsar",
      "locality": "Mall Road",
      "experience_years": 3,
      "expected_wage": 700,
      "availability": "AVAILABLE_TODAY",
      "rating": 4.5,
      "rating_count": 12,
      "jobs_completed": 20,
      "distance_km": 1.4,
      "latitude": 31.634,
      "longitude": 74.872,
      "skills": [{ "id": "sk_1", "name": "Electrician & Wiring", "slug": "electrician", "category": "TECHNICAL" }]
    }
  ]
}
```

Errors: 400 `VALIDATION_ERROR`.

### GET /jobs/nearby
Auth: optional.

Query: same as `/workers/nearby`.

Returns OPEN jobs, plus any job where the caller already has an application. Excludes the caller's own jobs. Logged-out callers get `my_application_status: null` and `application_id: null`.

Response (abbreviated):
```json
{
  "success": true,
  "count": 1,
  "jobs": [
    {
      "id": "job_1",
      "title": "Kitchen helper",
      "description": "Evening shift",
      "skill_id": "sk_2",
      "skill_name": "Restaurant Helper",
      "skill_slug": "hospitality",
      "wage": 800,
      "food_provided": true,
      "job_date": "2026-10-17",
      "start_time": "10:00",
      "end_time": "20:00",
      "locality": "Lawrence Road",
      "latitude": 31.62,
      "longitude": 74.87,
      "workers_required": 2,
      "workers_accepted": 1,
      "distance_km": 0.8,
      "is_invited": false,
      "business": {
        "id": "usr_1",
        "business_name": "Sharma Restaurant",
        "business_type": "Restaurant",
        "locality": "Lawrence Road",
        "rating": 4.6,
        "rating_count": 30,
        "jobs_completed": 55
      },
      "my_application_status": null,
      "application_id": null
    }
  ]
}
```

`is_invited` is true when the job's `invitedWorkerId` is the caller.

Errors: 400 `VALIDATION_ERROR`.

---

## Business: jobs

### POST /business/jobs
Auth: business.

Request (`createJobSchema`):
```json
{
  "skill_id": "sk_2",
  "title": "Kitchen helper",
  "description": "Evening shift",
  "workers_required": 2,
  "wage": 800,
  "food_provided": true,
  "job_date": "2026-10-17",
  "start_time": "10:00",
  "end_time": "20:00",
  "locality": "Lawrence Road",
  "latitude": 31.62,
  "longitude": 74.87,
  "invited_worker_id": null
}
```

Rules:
- `title`: 2 to 100 characters.
- `wage`: integer, INR per day, 300 to 5000.
- `workers_required`: 1 to 20.
- `job_date`: `YYYY-MM-DD`. `start_time` / `end_time`: `HH:MM`, with `end_time` after `start_time`.
- `invited_worker_id`: a worker's user id to hire that worker directly. Their application is auto-accepted when they apply.

Response: `201 { "success": true, "job": { "…" } }`

Errors: 400 `VALIDATION_ERROR`. 400 `INVALID_REFERENCE` (unknown skill, or invited worker not found).

### GET /business/jobs
Auth: business.

Response:
```json
{
  "success": true,
  "jobs": [
    {
      "id": "job_1",
      "title": "Kitchen helper",
      "description": "Evening shift",
      "skill_name": "Restaurant Helper",
      "skill_slug": "hospitality",
      "wage": 800,
      "food_provided": true,
      "job_date": "2026-10-17",
      "start_time": "10:00",
      "end_time": "20:00",
      "locality": "Lawrence Road",
      "latitude": 31.62,
      "longitude": 74.87,
      "status": "OPEN",
      "workers_required": 2,
      "workers_accepted": 1,
      "applicant_count": 3,
      "accepted_count": 1,
      "invited_worker_id": null
    }
  ]
}
```

`applicant_count` counts APPLIED applications. `accepted_count` counts applications in ACCEPTED, IN_PROGRESS or COMPLETED.

### GET /business/jobs/{id}/applicants
Auth: business, owns job.

Response:
```json
{
  "success": true,
  "job_id": "job_1",
  "title": "Kitchen helper",
  "status": "OPEN",
  "workers_required": 2,
  "workers_accepted": 1,
  "applicants": [
    {
      "application_id": "app_1",
      "worker_id": "usr_3",
      "name": "Aman Singh",
      "phone": "9876543211",
      "city": "Amritsar",
      "locality": "Mall Road",
      "rating": 4.5,
      "rating_count": 12,
      "jobs_completed": 20,
      "experience_years": 3,
      "expected_wage": 700,
      "distance_km": 1.4,
      "status": "APPLIED",
      "applied_at": "2026-10-16T08:00:00.000Z",
      "skills": ["Electrician & Wiring"]
    }
  ]
}
```

`phone` is included only for matched statuses.

Errors: 403 `FORBIDDEN` (not the owner). 404 `NOT_FOUND`.

---

## Worker: jobs and applications

### POST /jobs/{id}/apply
Auth: worker.

Response:
```json
{ "success": true, "application": { "id": "app_1", "status": "APPLIED" }, "auto_accepted": false }
```

If the caller is the job's `invitedWorkerId`, the application is accepted immediately through `acceptApplication` and `auto_accepted` is `true`.

Errors:
- 404 `NOT_FOUND`
- 400 `NOT_OPEN`: job is not OPEN.
- 400 `OWN_JOB`
- 409 `ALREADY_APPLIED`: existing application is APPLIED, ACCEPTED, IN_PROGRESS or COMPLETED.
- 403 `REJECTED`: the application was rejected for this job.

A WITHDRAWN application may be re-applied to.

### POST /jobs/{id}/withdraw
Auth: worker.

Moves the caller's application from APPLIED to WITHDRAWN.

Response: `{ "success": true, "application": { "…" } }`

Errors: 404 `NOT_FOUND`. 409 unless the application is APPLIED.

### GET /worker/applications
Auth: worker.

Response:
```json
{
  "success": true,
  "applications": [
    {
      "id": "app_1",
      "status": "ACCEPTED",
      "applied_at": "2026-10-16T08:00:00.000Z",
      "started_at": null,
      "worker_confirmed": false,
      "business_confirmed": false,
      "completed_at": null,
      "job": {
        "id": "job_1",
        "title": "Kitchen helper",
        "description": "Evening shift",
        "skill_name": "Restaurant Helper",
        "wage": 800,
        "food_provided": true,
        "job_date": "2026-10-17",
        "start_time": "10:00",
        "end_time": "20:00",
        "locality": "Lawrence Road",
        "status": "FILLED",
        "business": {
          "id": "usr_1",
          "business_name": "Sharma Restaurant",
          "business_type": "Restaurant",
          "locality": "Lawrence Road",
          "phone": "9812345678",
          "owner_name": "Sharma Ji"
        }
      }
    }
  ]
}
```

`phone` and `owner_name` are included only for matched statuses.

---

## Business: applications and the arrival handshake

### POST /applications/{id}/accept
Auth: business, owns job.

Accepts an APPLIED application. Runs `acceptApplication` in one transaction:
1. Sets the application to ACCEPTED and generates its 4-digit arrival code.
2. Increments the job's `workers_accepted`.
3. If the job is now full, sets it to FILLED and rejects the remaining APPLIED applications.

Response:
```json
{
  "success": true,
  "application": { "id": "app_1", "status": "ACCEPTED" },
  "worker": { "id": "usr_3", "name": "Aman Singh", "phone": "9876543211" },
  "job_status": "OPEN"
}
```

Errors: 403 `FORBIDDEN`. 404 `NOT_FOUND`. 409 `NOT_PENDING` (not APPLIED). 409 `JOB_FULL`.

### GET /applications/{id}/arrival-code
Auth: business, owns job.

Returns the code the customer reads out when the worker arrives. Only the business can fetch it.

Response: `{ "success": true, "code": "4821" }`

Errors: 403 `FORBIDDEN`. 404 `NOT_FOUND`. 409 unless ACCEPTED.

### POST /applications/{id}/start
Auth: worker, owns the application.

Request (`startWorkSchema`):
```json
{ "otp": "4821" }
```

The worker enters the code from the customer. On a match the application moves ACCEPTED → IN_PROGRESS and `started_at` is set. The job moves to IN_PROGRESS when its first worker starts.

Response: `{ "success": true, "application": { "…" } }`

Errors:
- 400 `WRONG_CODE`: attempts are counted.
- 429 `TOO_MANY_ATTEMPTS` after 5 wrong attempts.
- 409 unless ACCEPTED.

### POST /applications/{id}/confirm-completion
Auth: party (the worker or the job's business).

Records that the caller considers the work finished. Idempotent. The application becomes COMPLETED only once both the worker and the business have confirmed.

Response:
```json
{ "success": true, "application": { "…" }, "completed": false, "waiting_for": "BUSINESS" }
```

`waiting_for` is `"WORKER"`, `"BUSINESS"`, or `null` once completed.

Errors: 403 `FORBIDDEN`. 404 `NOT_FOUND`. 409 unless IN_PROGRESS or COMPLETED.

Completion is per application. The former `POST /jobs/{id}/confirm-completion` route has been removed.

### POST /applications/{id}/confirm-payment
Auth: business party.

Sets `paymentConfirmedAt`. Idempotent.

Response: `{ "success": true, "application": { "…" } }`

Errors: 409 unless COMPLETED. 403 `FORBIDDEN`. 404 `NOT_FOUND`.

---

## Reviews

### POST /reviews
Auth: user.

Request (`reviewSchema`):
```json
{
  "application_id": "app_1",
  "rating": 5,
  "feedback_tag": "PUNCTUAL",
  "comment": "On time and careful"
}
```

- `rating`: integer 1 to 5.
- `feedback_tag`: optional, one of `PUNCTUAL`, `HARDWORKING`, `SKILLED`, `POLITE`, `PAID_ON_TIME`, `FAIR_WORKLOAD`, `GOOD_FOOD`, `RESPECTFUL`.
- `comment`: optional, up to 500 characters.

Rules:
- The caller must be a party to a COMPLETED application. The target is the other party.
- The job comes from the application.
- Reviews are upserted on (job, from, to), so resubmitting updates the review.
- The target's `rating` and `rating_count` are recomputed from Review rows inside the same transaction.

Response: `{ "success": true, "review": { "…" }, "new_rating": 4.7 }`

Errors: 403 `FORBIDDEN`. 404 `NOT_FOUND`. 409 unless COMPLETED.

---

## Worker profile

### GET /worker/profile
Auth: worker.

Response:
```json
{
  "success": true,
  "worker": {
    "id": "usr_3",
    "name": "Aman Singh",
    "phone": "9876543211",
    "city": "Amritsar",
    "locality": "Mall Road",
    "latitude": 31.634,
    "longitude": 74.872,
    "experience_years": 3,
    "expected_wage": 700,
    "availability": "AVAILABLE_TODAY",
    "rating": 4.5,
    "rating_count": 12,
    "jobs_completed": 20,
    "skills": [{ "id": "sk_1", "name": "Electrician & Wiring", "slug": "electrician", "category": "TECHNICAL" }]
  }
}
```

### PUT /worker/profile
Auth: worker.

Request (all fields optional):
```json
{
  "name": "Aman Singh",
  "city": "Amritsar",
  "locality": "Mall Road",
  "latitude": 31.634,
  "longitude": 74.872,
  "experience_years": 3,
  "expected_wage": 700,
  "availability": "AVAILABLE_TODAY",
  "skill_ids": ["sk_1", "sk_4"]
}
```

`expected_wage`: integer 100 to 10000. `skill_ids`: up to 10 ids.

Response: `{ "success": true, "worker": { "…same shape as GET" } }`

Errors: 400 `VALIDATION_ERROR`. 400 `INVALID_REFERENCE` (unknown skill id).

### PUT /worker/availability
Auth: worker.

Request: `{ "availability": "AVAILABLE_TOMORROW" }`

Values: `AVAILABLE_TODAY`, `AVAILABLE_TOMORROW`, `UNAVAILABLE`.

Response: `{ "success": true, "availability": "AVAILABLE_TOMORROW" }`

---

## Status reference

### Application

| Status | Meaning |
|---|---|
| `APPLIED` | Worker applied; business has not decided. |
| `ACCEPTED` | Business accepted. Arrival code exists. Phones are shared. |
| `IN_PROGRESS` | Correct arrival code entered. Work has started. |
| `COMPLETED` | Both parties confirmed completion. Reviews allowed. |
| `REJECTED` | Job filled before this worker was accepted. Terminal. |
| `WITHDRAWN` | Worker withdrew before acceptance. May re-apply. |

Transitions: `APPLIED → ACCEPTED → IN_PROGRESS → COMPLETED`; `APPLIED → REJECTED`; `APPLIED ↔ WITHDRAWN`.

### Job

| Status | Meaning |
|---|---|
| `OPEN` | Accepting applications. |
| `FILLED` | `workers_accepted` equals `workers_required`. |
| `IN_PROGRESS` | At least one worker has started. |
| `COMPLETED` | No ACCEPTED or IN_PROGRESS applications remain, and at least one is COMPLETED. |
| `CANCELLED` | Reserved. No route sets it yet. |

### Arrival-code handshake

1. The business accepts an applicant (`POST /applications/{id}/accept`). The application gets a 4-digit arrival code.
2. The business fetches it (`GET /applications/{id}/arrival-code`) and reads it to the worker on arrival. It also appears as `arrival_code` in `/me/active-work`.
3. The worker submits it (`POST /applications/{id}/start`). Five wrong attempts return 429.
4. Both parties call `POST /applications/{id}/confirm-completion`. Completion requires both confirmations.
5. The business optionally calls `POST /applications/{id}/confirm-payment`.
6. Either party may review (`POST /reviews`) once the application is COMPLETED.
