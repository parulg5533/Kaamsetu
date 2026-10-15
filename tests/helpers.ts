import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, signSessionToken } from '@/lib/auth';
import { cookieStore } from './cookie-store';

// Default location: Amritsar, near the route fixtures.
export const BASE_LAT = 31.63;
export const BASE_LNG = 74.87;

let phoneCounter = 0;
/** Unique, valid 10-digit Indian mobile number. */
export function nextPhone(): string {
  phoneCounter += 1;
  return `9${String(100000000 + phoneCounter).padStart(9, '0')}`;
}

/** Route params helper for Next 14 handlers: `{ params: { id } }`. */
export function ctx(id: string) {
  return { params: { id } };
}

export async function setSessionFor(userId: string): Promise<void> {
  cookieStore.set(SESSION_COOKIE, await signSessionToken(userId));
}

export function clearSession(): void {
  cookieStore.clear();
}

export function jsonRequest(method: string, url: string, body?: unknown): Request {
  const full = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  if (body === undefined) return new Request(full, { method });
  return new Request(full, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Response bodies are loosely typed on purpose; tests assert on the contract fields.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readBody(res: Response): Promise<any> {
  return res.json();
}

export async function clearDb(): Promise<void> {
  await prisma.review.deleteMany();
  await prisma.otpRequest.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.workerSkill.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.business.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.user.deleteMany();
}

export async function makeSkill(slug: string) {
  return prisma.skill.upsert({
    where: { slug },
    update: {},
    create: { slug, name: slug, category: 'GENERAL', iconName: 'briefcase' },
  });
}

export interface WorkerOverrides {
  name?: string;
  phone?: string;
  city?: string;
  locality?: string | null;
  latitude?: number;
  longitude?: number;
  expectedWage?: number;
  experienceYears?: number;
  availability?: string;
  isActive?: boolean;
  skillIds?: string[];
}

/** Creates a WORKER user with a worker profile near Amritsar. */
export async function makeWorker(overrides: WorkerOverrides = {}) {
  const skillIds = overrides.skillIds ?? [];
  return prisma.user.create({
    data: {
      phone: overrides.phone ?? nextPhone(),
      name: overrides.name ?? 'Test Worker',
      role: 'WORKER',
      isActive: overrides.isActive ?? true,
      workerProfile: {
        create: {
          city: overrides.city ?? 'Amritsar',
          locality: overrides.locality === undefined ? 'Lawrence Road, Amritsar' : overrides.locality,
          latitude: overrides.latitude ?? BASE_LAT,
          longitude: overrides.longitude ?? BASE_LNG,
          expectedWage: overrides.expectedWage ?? 600,
          experienceYears: overrides.experienceYears ?? 2,
          availability: overrides.availability ?? 'AVAILABLE_TODAY',
          skills: { create: skillIds.map((skillId) => ({ skillId })) },
        },
      },
    },
  });
}

export interface BusinessOverrides {
  name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

/** Creates a BUSINESS (customer) user with a business profile near Amritsar. */
export async function makeBusiness(overrides: BusinessOverrides = {}) {
  const name = overrides.name ?? 'Test Business';
  return prisma.user.create({
    data: {
      phone: overrides.phone ?? nextPhone(),
      name,
      role: 'BUSINESS',
      business: {
        create: {
          businessName: name,
          businessType: 'Restaurant',
          address: 'Test address',
          city: 'Amritsar',
          locality: 'Lawrence Road, Amritsar',
          latitude: overrides.latitude ?? BASE_LAT,
          longitude: overrides.longitude ?? BASE_LNG,
        },
      },
    },
  });
}

export interface JobOverrides {
  title?: string;
  workersRequired?: number;
  wage?: number;
  status?: string;
  invitedWorkerId?: string | null;
  latitude?: number;
  longitude?: number;
  jobDate?: string;
  startTime?: string;
  endTime?: string;
  foodProvided?: boolean;
}

/** Creates an OPEN job for the business, near Amritsar, dated 2026-12-01 09:00-17:00 by default. */
export async function makeJob(businessId: string, skillId: string, overrides: JobOverrides = {}) {
  return prisma.job.create({
    data: {
      businessId,
      skillId,
      title: overrides.title ?? 'Test job',
      description: 'Test description',
      workersRequired: overrides.workersRequired ?? 1,
      wage: overrides.wage ?? 700,
      foodProvided: overrides.foodProvided ?? false,
      jobDate: overrides.jobDate ?? '2026-12-01',
      startTime: overrides.startTime ?? '09:00',
      endTime: overrides.endTime ?? '17:00',
      locality: 'Lawrence Road, Amritsar',
      latitude: overrides.latitude ?? BASE_LAT,
      longitude: overrides.longitude ?? BASE_LNG,
      status: overrides.status ?? 'OPEN',
      invitedWorkerId: overrides.invitedWorkerId ?? null,
    },
  });
}

/** Creates an application directly in the DB (for setting up states the API cannot reach quickly). */
export async function makeApplication(jobId: string, workerId: string, status = 'APPLIED', extra: Record<string, unknown> = {}) {
  return prisma.application.create({ data: { jobId, workerId, status, ...extra } });
}
