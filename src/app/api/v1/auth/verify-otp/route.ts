import { prisma } from '@/lib/prisma';
import { ok, handleRouteError, readJson, HttpError } from '@/lib/http';
import { verifyOtpSchema } from '@/lib/validation';
import { createSession } from '@/lib/auth';
import { hashOtp, OTP_MAX_ATTEMPTS, safeEqual } from '@/lib/otp';
import { cityFromLocality, toMeUser } from '@/lib/me';
import { USER_ROLE } from '@/lib/status';

export const dynamic = 'force-dynamic';

const DEFAULT_LATITUDE = 31.634;
const DEFAULT_LONGITUDE = 74.8723;
const DEFAULT_NAMES = ['New Worker', 'Customer'];

export async function POST(request: Request) {
  try {
    const input = verifyOtpSchema.parse(await readJson(request));
    const { phone, otp } = input;

    const otpRequest = await prisma.otpRequest.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otpRequest) {
      throw new HttpError(400, 'INVALID_OTP', 'Invalid or already used code. Request a new one');
    }
    if (otpRequest.expiresAt.getTime() <= Date.now()) {
      throw new HttpError(400, 'OTP_EXPIRED', 'This code has expired. Request a new one');
    }
    // Reserve an attempt atomically before comparing, so parallel guesses can't exceed the limit.
    const reserved = await prisma.otpRequest.updateMany({
      where: { id: otpRequest.id, attempts: { lt: OTP_MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (reserved.count !== 1) {
      throw new HttpError(429, 'TOO_MANY_ATTEMPTS', 'Too many wrong attempts. Request a new code');
    }
    if (!safeEqual(hashOtp(phone, otp), otpRequest.codeHash)) {
      throw new HttpError(400, 'INVALID_OTP', 'Incorrect code');
    }

    const { userId, isNewUser } = await prisma.$transaction(async (tx) => {
      // Consume the code atomically; a concurrent verify loses here and rolls back.
      const consumed = await tx.otpRequest.updateMany({
        where: { id: otpRequest.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new HttpError(400, 'INVALID_OTP', 'Invalid or already used code. Request a new one');
      }

      const existing = await tx.user.findUnique({ where: { phone } });
      if (existing) {
        // Existing users keep their stored role; only fill in a placeholder name.
        if (input.name && DEFAULT_NAMES.includes(existing.name)) {
          await tx.user.update({ where: { id: existing.id }, data: { name: input.name } });
        }
        await tx.otpRequest.update({ where: { id: otpRequest.id }, data: { userId: existing.id } });
        return { userId: existing.id, isNewUser: false };
      }

      const role = input.role;
      const name = input.name ?? (role === USER_ROLE.WORKER ? 'New Worker' : 'Customer');
      const city = cityFromLocality(input.locality);
      const latitude = input.latitude ?? DEFAULT_LATITUDE;
      const longitude = input.longitude ?? DEFAULT_LONGITUDE;

      const created = await tx.user.create({ data: { phone, name, role } });

      if (role === USER_ROLE.WORKER) {
        await tx.workerProfile.create({
          data: {
            userId: created.id,
            city,
            locality: input.locality || null,
            latitude,
            longitude,
            experienceYears: 1,
            expectedWage: 600,
            availability: 'AVAILABLE_TODAY',
          },
        });
      } else {
        await tx.business.create({
          data: {
            userId: created.id,
            businessName: name,
            businessType: 'Household / Service Request',
            address: input.locality || 'Not set',
            city,
            locality: input.locality || null,
            latitude,
            longitude,
          },
        });
      }

      await tx.otpRequest.update({ where: { id: otpRequest.id }, data: { userId: created.id } });
      return { userId: created.id, isNewUser: true };
    });

    await createSession(userId);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { workerProfile: true, business: true },
    });

    return ok({ user: toMeUser(user), is_new_user: isNewUser });
  } catch (err) {
    return handleRouteError(err, 'auth/verify-otp');
  }
}
