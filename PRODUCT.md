# KaamSetu — Product Requirement Document (PRD)

> **"Connecting local work with local workers."**  
> *Hyperlocal two-sided marketplace for informal and short-term daily wage labor.*

---

## 1. Executive Summary & Vision

**KaamSetu** addresses the friction, unreliability, and daily wage search costs for informal workers and small local businesses in India. Instead of building a complex, heavy platform with payments, AI matching, or complex verification upfront, **V1 is a hyper-focused, two-sided hyperlocal prototype**.

### The Core Value Proposition
- **For Workers ("Mujhe kaam chahiye"):** Discover nearby jobs (within 2–5 km), express daily availability with a single toggle, apply with 1 tap, connect directly via phone/WhatsApp upon confirmation, and build a verified work reputation.
- **For Businesses ("Mujhe worker chahiye"):** Post a job in under 60 seconds with clear timings and daily wage, review nearby available applicants, confirm them, directly contact them, and record job completion.

---

## 2. Target Market & First Cohort (V1 Scope)

### Geographic Scope
- **1 Pilot City / Locality** (e.g., Amritsar / Patna / tier-2 neighborhood clusters).
- Proximity threshold: Default **within 5 km radius** of worker/business locations.

### Target Worker Categories
1. **Restaurant & Dhabas:** Kitchen helpers, cleaners, dishwashers.
2. **Retail & Small Shops:** Counter helpers, shelf stockers, packaging helpers.
3. **Warehouses & Transport:** Loading/unloading workers, inventory moving.
4. **Local Deliveries & General Labor:** Errands, basic non-technical assistance.

### Target Business Categories
- Small restaurants, sweets shops, caterers.
- Kirana / grocery / wholesale stores.
- Local logistics hubs & godowns.
- Independent contractors & small workshops.

---

## 3. Persona Profiles

### Persona A: Rahul (Worker)
- **Age:** 24
- **Primary Need:** Predictable daily income without waiting idle at labor chowks.
- **Digital Literacy:** Basic smartphone user, prefers simple UI, Hindi/Hinglish terms, clear wage numbers, and minimal text entry.
- **Core Action:** Toggle availability (🟢 Available Today / Tomorrow) -> View nearby jobs -> Tap "Apply" -> Call shopkeeper once accepted.

### Persona B: Sharma ji (Business Owner - Sharma Restaurant)
- **Age:** 42
- **Primary Need:** 2 reliable helpers for tomorrow's lunch and dinner rush.
- **Pain Point:** Worker didn't show up; traditional word-of-mouth takes hours.
- **Core Action:** Tap "Post Job" -> Select "Restaurant Helper", specify wage (₹650/day) & timings -> Accept 2 applicants -> Confirm on call.

---

## 4. The Core Transaction Loop

```text
BUSINESS                              KAAMSETU PLATFORM                            WORKER
   │                                         │                                       │
   ├────── 1. Posts Job (Wage/Time/Loc) ────>│                                       │
   │                                         ├────── 2. Matches Available & Nearby ──>│
   │                                         │       (Distance < 5km + Skill Match)  │
   │                                         │                                       │
   │                                         │<───── 3. Taps Apply ──────────────────┤
   │                                         │                                       │
   │<───── 4. Receives Applicant List ───────┤                                       │
   │                                         │                                       │
   ├────── 5. Accepts Worker ───────────────>│                                       │
   │                                         ├────── 6. Match Confirmed Notification ─>│
   │                                         │       (Reveal Phone Numbers)          │
   │                                         │                                       │
   ├<═════ 7. Direct Phone / WhatsApp Call ══╪══════════════════════════════════════>┤
   │                                         │                                       │
   │   (Job is executed on the ground)       │                                       │
   │                                         │                                       │
   ├────── 8. Confirms Completion (YES/NO) ──>│<───── 9. Confirms Completion (YES/NO) ┤
   │                                         │                                       │
   ├────── 10. Rates Worker (1–5 ⭐) ────────>│<───── 11. Rates Business (1–5 ⭐) ────┤
   │                                         │                                       │
```

---

## 5. Feature Requirements for V1

### 5.1 Authentication & Onboarding
- Phone number input + Mock/Fast OTP verification for prototype speed.
- Single role selection: **Worker** or **Business**.
- Minimal profile setup:
  - **Worker:** Name, Primary Phone, City/Area, Skills (multi-select), Experience (years), Expected Daily Wage, Availability Status (`TODAY`, `TOMORROW`, `UNAVAILABLE`).
  - **Business:** Business Name, Owner Name, Phone, Category/Type, Area/Address, Geo-coordinates (lat/long).

### 5.2 Worker Interface
- **Availability Toggle:** 1-click switcher between 🟢 Available Today, 🟢 Available Tomorrow, and 🔴 Unavailable.
- **Hyperlocal Feed:** Filtered job feed displaying only active, open jobs matching skills and within distance threshold (sorted by distance ascending, then date/wage).
- **Job Card:** Skill tag, wage (e.g. ₹650/day), distance (e.g. 1.4 km away), date, hours (e.g. 10:00 AM – 8:00 PM), food provided badge.
- **1-Tap Application:** Instant feedback with application status badge (`Applied`, `Accepted`, `Rejected`, `Completed`).
- **Confirmed Matches Tab:** Direct "Call Employer" and "WhatsApp" buttons enabled only after acceptance.

### 5.3 Business Interface
- **Job Posting Wizard:**
  - Skill needed (dropdown/chips).
  - Number of workers needed (default 1).
  - Date (Today / Tomorrow / Custom Date).
  - Shifts (Start time & End time).
  - Daily wage offer (₹).
  - Location / Landmark.
  - Perquisites (e.g., Food provided checkbox).
- **Active Jobs & Applicant Pipeline:**
  - View applicant cards: Name, distance, rating, jobs completed, experience.
  - Quick action: **Accept** or **Decline**.
  - Worker phone unlocked upon clicking Accept.
- **Job Status Transition:** `OPEN` -> `FILLED` -> `IN_PROGRESS` -> `COMPLETED`.

### 5.4 Trust & Reputation (Post-Job)
- Dual completion handshake: Both parties confirm "Did Rahul work today?" / "Did you work for Sharma Restaurant?".
- Mutual 5-star rating + optional 1-line feedback tag (e.g., "Punctual", "Fast worker", "Paid on time").
- Public profile counters:
  - Worker: Rating average, Total completed jobs, Attendance %.
  - Business: Rating average, Total workers hired, Total jobs posted.

---

## 6. Strict Non-Goals for V1 (What NOT to Build)

| Feature | Reason to Defer |
|---|---|
| ❌ Digital Wallet & In-app Escrow Payments | Adds heavy compliance, KYC, and friction. Offline cash/UPI payout works best initially. |
| ❌ Machine Learning / AI Matching | Deterministic distance + skill + availability filter is 100% sufficient and explainable. |
| ❌ In-app Chat / Video Calling | India informal sector operates on direct phone calls and WhatsApp. |
| ❌ Paid Subscriptions / Paywalls | Monetization before product-market fit kills discovery. |
| ❌ Multi-language / Complex Localization | Simple Hinglish/English prototype tests the market hypothesis fastest. |
| ❌ Full Background Checks / Aadhaar OCR | Manual phone verification and platform review counters are sufficient for V1. |

---

## 7. Pilot Metrics & Key Performance Indicators (KPIs)

1. **Fill Rate (North Star Metric):**  
   $$\text{Fill Rate} = \frac{\text{Jobs with Accepted Workers who showed up}}{\text{Total Jobs Posted}} \times 100$$  
   *Target for initial pilot:* **> 60%**
2. **Time to First Applicant:** Target $< 30\text{ minutes}$.
3. **Time to Successful Acceptance:** Target $< 2\text{ hours}$.
4. **Attendance Rate:** % of accepted workers confirmed completed by business.
5. **Repeat Usage:**
   - % of businesses posting $> 2\text{ jobs/week}$.
   - % of workers accepting $> 3\text{ jobs/week}$.

---

## 8. Milestone Targets for IIT/Incubator Pitch
- **30 Local Businesses** onboarded in 1 neighborhood.
- **100 Active Workers** with updated availability.
- **50 Jobs Posted** in the first 30 days.
- **25+ Successfully Verified Matches** with mutual ratings.
