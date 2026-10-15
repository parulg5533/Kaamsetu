# KaamSetu

> Connecting local work with local workers.

KaamSetu is a hyperlocal two-sided marketplace prototype for informal and daily-wage labour. It connects workers (helpers, cleaners, loading staff, cooks) with nearby businesses (restaurants, shops, godowns) within a few kilometres.

- **Workers** set their availability, find nearby jobs, apply with one tap, and see the employer's contact once the job is accepted.
- **Businesses** post a job, review applicants by distance and rating, accept them, and rate them after the work.

## Tech stack

- Next.js 14 (App Router, TypeScript strict)
- Prisma 5 with SQLite for development (see [DATABASE.md](DATABASE.md) for the PostgreSQL migration path)
- Zod for request validation, `jose` for signed session cookies
- Haversine distance with a bounding-box prefilter. No paid map APIs are required by the backend.

## Setup

Requirements: Node.js 18.18 or later, npm.

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env          # Windows PowerShell: copy .env.example .env
```

Edit `.env` and set:

- `AUTH_SECRET`: a random secret of 32 or more characters. Generate one with:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- `OTP_DEV_MODE=true` for local development (already the default in `.env.example`).

```bash
# 3. Create the database and apply migrations
npx prisma migrate dev

# 4. Load demo data (skills and sample workers/businesses)
npm run prisma:seed

# 5. Start the dev server
npm run dev
```

Open <http://localhost:3000>.

### Logging in locally

Login is phone-based OTP. With `OTP_DEV_MODE=true`, the login code is always **`1234`**, and `POST /api/v1/auth/send-otp` returns it as `dev_otp`.

Dev mode is only active when `OTP_DEV_MODE=true` and `NODE_ENV` is not `production`. It is never active in production, and the code `1234` is never accepted there. Production sends a random code by SMS through MSG91, so `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` must be set.

Seeded demo accounts (phone numbers, log in with code `1234`):

| Role | Name | Phone |
|---|---|---|
| Business | Sharma Ji (Sharma Restaurant) | 9812345678 |
| Business | Rajesh Verma | 9812345679 |
| Business | Harpreet Singh | 9812345680 |
| Worker | Rahul Kumar | 9876543210 |
| Worker | Aman Singh | 9876543211 |
| Worker | Gurpreet Kaur | 9876543212 |
| Worker | Ramesh Mistri | 9876543213 |
| Worker | Jagjit Singh | 9876543214 |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server on port 3000. |
| `npm run build` | Generate the Prisma client and build for production. |
| `npm start` | Serve the production build. |
| `npm run typecheck` | Type-check the project with `tsc --noEmit`. |
| `npm run lint` | Run ESLint (`next/core-web-vitals`). |
| `npm test` | Run the Vitest test suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run prisma:migrate` | Create and apply a migration (`prisma migrate dev`). |
| `npm run prisma:push` | Sync the schema to the database without a migration. |
| `npm run prisma:seed` | Load the demo data. |

Tests use their own environment (`vitest.config.ts` sets `DATABASE_URL=file:./test.db` and `OTP_DEV_MODE=true`), so they do not touch `dev.db`.

## Documentation

- [API.md](API.md): REST API reference. Endpoints, authentication, request and response shapes, error codes, and the job/application lifecycle.
- [DATABASE.md](DATABASE.md): Prisma/SQLite schema, models, status values, the nearby search, and notes on moving to PostgreSQL.
- [docs/REMEDIATION_CONTRACT.md](docs/REMEDIATION_CONTRACT.md): Binding internal contract for the API and data model.
- [PRODUCT.md](PRODUCT.md): Product requirements, personas, MVP boundaries, and pilot metrics.
