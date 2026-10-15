import { describe, expect, it } from 'vitest';
import { calculateDistanceKm, boundingBox, approximateCoord } from '@/lib/geo';
import { localISODate, addDaysISO } from '@/lib/date';
import { createJobSchema, verifyOtpSchema, queryToObject } from '@/lib/validation';
import { signSessionToken, verifySessionToken } from '@/lib/auth';

describe('geo', () => {
  it('calculates Amritsar to Delhi as roughly 400-460 km', () => {
    const d = calculateDistanceKm(31.634, 74.8723, 28.6139, 77.209);
    expect(d).toBeGreaterThanOrEqual(400);
    expect(d).toBeLessThanOrEqual(460);
  });

  it('returns zero for identical points', () => {
    expect(calculateDistanceKm(31.63, 74.87, 31.63, 74.87)).toBe(0);
  });

  it('bounding box contains points at the requested radius in each direction', () => {
    const lat = 31.63;
    const lng = 74.87;
    const radius = 10;
    const box = boundingBox(lat, lng, radius);
    const dLat = radius / 111.32;
    const dLng = radius / (111.32 * Math.cos((lat * Math.PI) / 180));
    const eps = 1e-9;

    const points = [
      [lat + dLat, lng],
      [lat - dLat, lng],
      [lat, lng + dLng],
      [lat, lng - dLng],
    ];
    for (const [pLat, pLng] of points) {
      expect(pLat).toBeGreaterThanOrEqual(box.minLat - eps);
      expect(pLat).toBeLessThanOrEqual(box.maxLat + eps);
      expect(pLng).toBeGreaterThanOrEqual(box.minLng - eps);
      expect(pLng).toBeLessThanOrEqual(box.maxLng + eps);
    }
  });

  it('bounding box excludes points well outside the radius', () => {
    const box = boundingBox(31.63, 74.87, 10);
    expect(box.maxLat).toBeLessThan(31.63 + 0.2);
    expect(box.minLat).toBeGreaterThan(31.63 - 0.2);
    expect(74.87 + 0.5).toBeGreaterThan(box.maxLng);
  });

  it('approximateCoord rounds to 3 decimal places', () => {
    expect(approximateCoord(31.634567)).toBe(31.635);
  });
});

describe('dates', () => {
  it('localISODate uses the local calendar day', () => {
    expect(localISODate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    expect(localISODate(new Date(2026, 11, 31, 0, 5))).toBe('2026-12-31');
  });

  it('addDaysISO rolls over month and year boundaries', () => {
    expect(addDaysISO(1, new Date(2026, 0, 31))).toBe('2026-02-01');
    expect(addDaysISO(-1, new Date(2026, 2, 1))).toBe('2026-02-28');
    expect(addDaysISO(1, new Date(2026, 11, 31))).toBe('2027-01-01');
    expect(addDaysISO(0, new Date(2026, 5, 15))).toBe('2026-06-15');
  });
});

describe('validation', () => {
  const validJob = {
    skill_id: 'skill-1',
    title: 'Kitchen helper',
    wage: 700,
    job_date: '2026-12-01',
    start_time: '09:00',
    end_time: '17:00',
    locality: 'Lawrence Road, Amritsar',
    latitude: 31.63,
    longitude: 74.87,
  };

  it('accepts a valid job', () => {
    expect(() => createJobSchema.parse(validJob)).not.toThrow();
  });

  it('rejects a wage below the minimum', () => {
    expect(() => createJobSchema.parse({ ...validJob, wage: 100 })).toThrow();
  });

  it('rejects an end time before the start time', () => {
    expect(() => createJobSchema.parse({ ...validJob, start_time: '18:00', end_time: '09:00' })).toThrow();
  });

  it('parses food_provided "false" as boolean false', () => {
    const parsed = createJobSchema.parse({ ...validJob, food_provided: 'false' });
    expect(parsed.food_provided).toBe(false);
    expect(createJobSchema.parse({ ...validJob, food_provided: 'true' }).food_provided).toBe(true);
  });

  it('rejects the ADMIN role in verify-otp', () => {
    expect(() => verifyOtpSchema.parse({ phone: '9876543210', otp: '1234', role: 'ADMIN' })).toThrow();
  });

  it('accepts WORKER and BUSINESS roles in verify-otp', () => {
    expect(verifyOtpSchema.parse({ phone: '9876543210', otp: '1234', role: 'BUSINESS' }).role).toBe('BUSINESS');
    expect(verifyOtpSchema.parse({ phone: '9876543210', otp: '1234' }).role).toBe('WORKER');
  });

  it('queryToObject drops empty values', () => {
    const out = queryToObject(new URLSearchParams('lat=1&lng=&skill_id=x'));
    expect(out).toEqual({ lat: '1', skill_id: 'x' });
  });
});

describe('session tokens', () => {
  it('round-trips a user id', async () => {
    const token = await signSessionToken('user-123');
    expect(await verifySessionToken(token)).toBe('user-123');
  });

  it('rejects a tampered token', async () => {
    const token = await signSessionToken('user-123');
    const [h, p, s] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: 'admin-user', iat: 1, exp: 9999999999 })).toString('base64url');
    expect(await verifySessionToken(`${h}.${forgedPayload}.${s}`)).toBeNull();
    const flipped = s[0] === 'A' ? `B${s.slice(1)}` : `A${s.slice(1)}`;
    expect(await verifySessionToken(`${h}.${p}.${flipped}`)).toBeNull();
  });

  it('rejects an unsigned base64 JSON token', async () => {
    const unsigned = Buffer.from(JSON.stringify({ sub: 'user-123' })).toString('base64');
    expect(await verifySessionToken(unsigned)).toBeNull();
    const alg_none = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: 'user-123' })).toString('base64url')}.`;
    expect(await verifySessionToken(alg_none)).toBeNull();
  });
});
