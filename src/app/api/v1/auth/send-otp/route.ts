import { prisma } from '@/lib/prisma';
import { ok, handleRouteError, readJson, HttpError } from '@/lib/http';
import { sendOtpSchema } from '@/lib/validation';
import {
  generateOtp,
  hashOtp,
  isOtpDevMode,
  OTP_MAX_PER_HOUR,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  sendOtpSms,
} from '@/lib/otp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { phone } = sendOtpSchema.parse(await readJson(request));
    const now = Date.now();

    const latest = await prisma.otpRequest.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (latest && now - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      throw new HttpError(429, 'RATE_LIMITED', 'Please wait a moment before requesting another code');
    }

    const hourCount = await prisma.otpRequest.count({
      where: { phone, createdAt: { gte: new Date(now - 60 * 60 * 1000) } },
    });
    if (hourCount >= OTP_MAX_PER_HOUR) {
      throw new HttpError(429, 'RATE_LIMITED', 'Too many codes requested. Try again later');
    }

    const code = generateOtp();
    await prisma.otpRequest.create({
      data: {
        phone,
        codeHash: hashOtp(phone, code),
        expiresAt: new Date(now + OTP_TTL_MS),
      },
    });
    await sendOtpSms(phone, code);

    return ok({
      message: 'OTP sent',
      ...(isOtpDevMode() ? { dev_otp: code } : {}),
    });
  } catch (err) {
    return handleRouteError(err, 'auth/send-otp');
  }
}
