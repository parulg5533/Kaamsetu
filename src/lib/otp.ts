import { createHmac, randomInt, timingSafeEqual } from 'crypto';

export const OTP_TTL_MS = 5 * 60 * 1000; // codes expire after 5 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
export const OTP_MAX_PER_HOUR = 5;

/** Dev mode: fixed code 1234, returned in the API response. Never enable in production. */
export function isOtpDevMode(): boolean {
  return process.env.OTP_DEV_MODE === 'true' && process.env.NODE_ENV !== 'production';
}

export function generateOtp(digits = 6): string {
  if (isOtpDevMode()) return '1234';
  return String(randomInt(0, 10 ** digits)).padStart(digits, '0');
}

/** Generates a 4-digit arrival code for the start-of-work handshake. */
export function generateArrivalCode(): string {
  return String(randomInt(0, 10000)).padStart(4, '0');
}

function hmacKey(): string {
  return process.env.AUTH_SECRET || 'kaamsetu-dev-only-secret-do-not-use-in-prod';
}

export function hashOtp(phone: string, code: string): string {
  return createHmac('sha256', hmacKey()).update(`${phone}:${code}`).digest('hex');
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Sends the login code by SMS. Uses MSG91 when MSG91_AUTH_KEY and MSG91_TEMPLATE_ID are set;
 * in dev mode it only logs. Throws if no provider is configured outside dev mode.
 */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (isOtpDevMode()) {
    console.info(`[otp] dev mode: code for ${phone.slice(0, 2)}******${phone.slice(-2)} is ${code}`);
    return;
  }
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey || !templateId) {
    throw new Error('SMS provider not configured: set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID, or OTP_DEV_MODE=true locally');
  }
  const res = await fetch('https://control.msg91.com/api/v5/flow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: authKey },
    body: JSON.stringify({
      template_id: templateId,
      recipients: [{ mobiles: `91${phone}`, otp: code }],
    }),
  });
  if (!res.ok) {
    throw new Error(`SMS provider returned ${res.status}`);
  }
}
