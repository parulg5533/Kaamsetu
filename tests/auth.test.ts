import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE } from '@/lib/auth';
import { POST as sendOtp } from '@/app/api/v1/auth/send-otp/route';
import { POST as verifyOtp } from '@/app/api/v1/auth/verify-otp/route';
import { GET as me } from '@/app/api/v1/auth/me/route';
import { POST as switchRole } from '@/app/api/v1/me/role/route';
import { cookieStore } from './cookie-store';
import { BASE_LAT, BASE_LNG, clearSession, jsonRequest, makeBusiness, nextPhone, readBody, setSessionFor } from './helpers';

const DEV_CODE = '1234';

async function requestCode(phone: string) {
  const res = await sendOtp(jsonRequest('POST', '/api/v1/auth/send-otp', { phone }));
  expect(res.status).toBe(200);
  return readBody(res);
}

describe('send-otp', () => {
  it('returns the dev OTP in dev mode', async () => {
    const body = await requestCode(nextPhone());
    expect(body.success).toBe(true);
    expect(body.dev_otp).toBe(DEV_CODE);
  });

  it('rejects a second request within the 30 second cooldown with 429', async () => {
    const phone = nextPhone();
    await requestCode(phone);
    const res = await sendOtp(jsonRequest('POST', '/api/v1/auth/send-otp', { phone }));
    expect(res.status).toBe(429);
    expect((await readBody(res)).code).toBe('RATE_LIMITED');
  });

  it('rejects an invalid phone number with 400', async () => {
    const res = await sendOtp(jsonRequest('POST', '/api/v1/auth/send-otp', { phone: '12345' }));
    expect(res.status).toBe(400);
  });
});

describe('verify-otp', () => {
  it('locks out after 5 wrong attempts, even with the right code afterwards', async () => {
    const phone = nextPhone();
    await requestCode(phone);

    for (let i = 0; i < 5; i++) {
      const res = await verifyOtp(jsonRequest('POST', '/api/v1/auth/verify-otp', { phone, otp: '0000' }));
      expect(res.status).toBe(400);
      expect((await readBody(res)).code).toBe('INVALID_OTP');
    }

    const res = await verifyOtp(jsonRequest('POST', '/api/v1/auth/verify-otp', { phone, otp: DEV_CODE }));
    expect(res.status).toBe(429);
    expect((await readBody(res)).code).toBe('TOO_MANY_ATTEMPTS');
    expect(await prisma.user.findUnique({ where: { phone } })).toBeNull();
  });

  it('creates the user and worker profile and sets the session cookie on the right code', async () => {
    const phone = nextPhone();
    await requestCode(phone);

    const res = await verifyOtp(
      jsonRequest('POST', '/api/v1/auth/verify-otp', {
        phone,
        otp: DEV_CODE,
        role: 'WORKER',
        name: 'Ravi Kumar',
        locality: 'Lawrence Road, Amritsar',
        latitude: BASE_LAT,
        longitude: BASE_LNG,
      })
    );
    expect(res.status).toBe(200);
    const body = await readBody(res);
    expect(body.is_new_user).toBe(true);
    expect(body.user).toMatchObject({
      name: 'Ravi Kumar',
      phone,
      role: 'WORKER',
      has_worker_profile: true,
      has_business: false,
      latitude: BASE_LAT,
      longitude: BASE_LNG,
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { phone }, include: { workerProfile: true } });
    expect(user.workerProfile).not.toBeNull();
    expect(user.workerProfile?.latitude).toBe(BASE_LAT);

    expect(cookieStore.get(SESSION_COOKIE)?.value).toBeTruthy();
  });

  it('does not allow a used code to be reused', async () => {
    const phone = nextPhone();
    await requestCode(phone);

    const first = await verifyOtp(jsonRequest('POST', '/api/v1/auth/verify-otp', { phone, otp: DEV_CODE }));
    expect(first.status).toBe(200);

    const second = await verifyOtp(jsonRequest('POST', '/api/v1/auth/verify-otp', { phone, otp: DEV_CODE }));
    expect(second.status).toBe(400);
    expect((await readBody(second)).code).toBe('INVALID_OTP');
  });

  it('reports an existing user as not new on a second login', async () => {
    const phone = nextPhone();
    await requestCode(phone);
    await verifyOtp(jsonRequest('POST', '/api/v1/auth/verify-otp', { phone, otp: DEV_CODE, role: 'WORKER' }));

    // Move the earlier request out of the 30 second cooldown window before asking again.
    await prisma.otpRequest.updateMany({ where: { phone }, data: { createdAt: new Date(Date.now() - 60_000) } });
    await requestCode(phone);
    const res = await verifyOtp(jsonRequest('POST', '/api/v1/auth/verify-otp', { phone, otp: DEV_CODE }));
    expect(res.status).toBe(200);
    const body = await readBody(res);
    expect(body.is_new_user).toBe(false);
    expect(await prisma.user.count({ where: { phone } })).toBe(1);
  });
});

describe('session and /me', () => {
  it('GET /auth/me returns user null without a session', async () => {
    clearSession();
    const res = await me();
    expect(res.status).toBe(200);
    expect((await readBody(res)).user).toBeNull();
  });

  it('GET /auth/me returns the logged-in user after verify-otp', async () => {
    const phone = nextPhone();
    await requestCode(phone);
    await verifyOtp(jsonRequest('POST', '/api/v1/auth/verify-otp', { phone, otp: DEV_CODE, role: 'WORKER' }));

    const body = await readBody(await me());
    expect(body.user).toMatchObject({ phone, role: 'WORKER', has_worker_profile: true });
  });

  it('POST /me/role creates the missing worker profile using the given location', async () => {
    const business = await makeBusiness({ latitude: 31.7, longitude: 74.9 });
    await setSessionFor(business.id);
    expect(await prisma.workerProfile.findUnique({ where: { userId: business.id } })).toBeNull();

    const res = await switchRole(
      jsonRequest('POST', '/api/v1/me/role', { role: 'WORKER', locality: 'Majitha Road, Amritsar', latitude: 31.6, longitude: 74.8 })
    );
    expect(res.status).toBe(200);
    const body = await readBody(res);
    expect(body.user).toMatchObject({ role: 'WORKER', has_worker_profile: true, has_business: true });

    const profile = await prisma.workerProfile.findUniqueOrThrow({ where: { userId: business.id } });
    expect(profile.latitude).toBe(31.6);
    expect(profile.locality).toBe('Majitha Road, Amritsar');
  });

  it('POST /me/role falls back to the other profile location when none is given', async () => {
    const business = await makeBusiness({ latitude: 31.7, longitude: 74.9 });
    await setSessionFor(business.id);

    const res = await switchRole(jsonRequest('POST', '/api/v1/me/role', { role: 'WORKER' }));
    expect(res.status).toBe(200);
    const profile = await prisma.workerProfile.findUniqueOrThrow({ where: { userId: business.id } });
    expect(profile.latitude).toBe(31.7);
    expect(profile.longitude).toBe(74.9);
  });

  it('POST /me/role requires authentication', async () => {
    clearSession();
    const res = await switchRole(jsonRequest('POST', '/api/v1/me/role', { role: 'WORKER' }));
    expect(res.status).toBe(401);
  });
});
