# KaamSetu 🚀

> **"Connecting local work with local workers."**  
> Hyperlocal two-sided marketplace prototype for informal and daily wage labor.

---

## 📖 Overview

KaamSetu bridges the daily gap between informal/daily wage workers (helpers, cleaners, loading staff) and local businesses (restaurants, shops, godowns) within a 5 km locality.

- **For Workers ("Mujhe Kaam Chahiye"):** 1-tap availability toggle (Today / Tomorrow / Off), nearby job discovery (< 5km), 1-tap apply, and direct employer contact unlock upon confirmation.
- **For Businesses ("Mujhe Worker Chahiye"):** Fast job posting wizard, applicant review pipeline with distance and ratings, 1-click accept, and mutual reputation ratings.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database & ORM**: Prisma ORM with SQLite (PostgreSQL compatible)
- **Styling**: Vanilla CSS custom design system with rich dark aesthetics
- **Distance Engine**: Pure Haversine formula calculation without third-party paid map dependencies

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database & Seed Data
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Demo Accounts & Prototype Switcher

The app includes an interactive header bar with a **Prototype Switcher** to test the entire marketplace loop:
- 👷 **Rahul Kumar (Worker)** — Amritsar, 4.7 ⭐ (Phone: `9876543210`)
- 🏪 **Sharma Restaurant (Business)** — Lawrence Road, 4.6 ⭐ (Phone: `9812345678`)
- 👷 **Aman Singh (Worker)** — Mall Road, 4.5 ⭐ (Phone: `9876543211`)
- 🏪 **Punjab Logistics Hub (Business)** — GT Road, 4.4 ⭐ (Phone: `9812345680`)

*(Prototype Test OTP is **`1234`**)*

---

## 📄 Documentation

- [PRODUCT.md](PRODUCT.md) — Product requirements, user personas, MVP boundaries, pilot metrics.
- [DATABASE.md](DATABASE.md) — PostgreSQL DDL schema, Haversine geospatial logic, seed fixtures.
- [API.md](API.md) — Full REST API specifications and request/response payloads.
