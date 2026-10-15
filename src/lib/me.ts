import type { Prisma } from '@prisma/client';

/** A user loaded with `{ workerProfile: true, business: true }`. */
export type UserWithProfiles = Prisma.UserGetPayload<{
  include: { workerProfile: true; business: true };
}>;

/** Public shape of the logged-in user returned by the auth and /me endpoints. */
export type MeUser = {
  id: string;
  name: string;
  phone: string;
  role: 'WORKER' | 'BUSINESS';
  has_worker_profile: boolean;
  has_business: boolean;
  locality: string | null;
  latitude: number | null;
  longitude: number | null;
};

/**
 * Converts a user (with profiles) into MeUser. Location comes from the profile
 * matching the user's role, falling back to the other profile, else nulls.
 */
export function toMeUser(user: UserWithProfiles): MeUser {
  const role: MeUser['role'] = user.role === 'BUSINESS' ? 'BUSINESS' : 'WORKER';
  const primary = role === 'BUSINESS' ? user.business : user.workerProfile;
  const other = role === 'BUSINESS' ? user.workerProfile : user.business;
  const location = primary ?? other ?? null;

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role,
    has_worker_profile: user.workerProfile !== null,
    has_business: user.business !== null,
    locality: location?.locality ?? null,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
  };
}

/** Default city used when a locality does not name one. */
export const DEFAULT_CITY = 'Amritsar';

/** Uses the last comma-separated part of a locality as the city, else the default city. */
export function cityFromLocality(locality: string | undefined | null): string {
  if (!locality || !locality.includes(',')) return DEFAULT_CITY;
  const last = locality.split(',').pop()?.trim();
  return last || DEFAULT_CITY;
}
