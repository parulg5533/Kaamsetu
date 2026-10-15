import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';
import { HttpError } from './http';

export const SESSION_COOKIE = 'ks_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET must be set (32+ chars) in production');
    }
    // Development-only fallback so the app runs without configuration.
    return new TextEncoder().encode('kaamsetu-dev-only-secret-do-not-use-in-prod');
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Sets the httpOnly session cookie. Call from a route handler. */
export async function createSession(userId: string): Promise<void> {
  const token = await signSessionToken(userId);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function destroySession(): void {
  cookies().delete(SESSION_COOKIE);
}

/** Returns the authenticated user id from the session cookie, or null. */
export async function getSessionUserId(): Promise<string | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

const userWithProfiles = {
  workerProfile: true,
  business: true,
} as const;

export type SessionUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

async function loadUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, include: userWithProfiles });
}

/** Returns the current active user (with profiles) or null. Never trusts client-supplied ids. */
export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await loadUser(userId);
  if (!user || !user.isActive) return null;
  return user;
}

/** Throws HttpError(401) if not logged in. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'Please log in to continue');
  return user;
}

/** Throws unless the current user has a worker profile. */
export async function requireWorker() {
  const user = await requireUser();
  if (!user.workerProfile) {
    throw new HttpError(403, 'NOT_A_WORKER', 'A worker profile is required for this action');
  }
  return { user, worker: user.workerProfile };
}

/** Throws unless the current user has a business (customer) profile. */
export async function requireBusiness() {
  const user = await requireUser();
  if (!user.business) {
    throw new HttpError(403, 'NOT_A_BUSINESS', 'A customer profile is required for this action');
  }
  return { user, business: user.business };
}
