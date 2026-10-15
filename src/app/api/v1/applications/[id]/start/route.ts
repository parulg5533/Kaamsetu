import { prisma } from '@/lib/prisma';
import { HttpError, handleRouteError, ok, readJson } from '@/lib/http';
import { requireWorker } from '@/lib/auth';
import { safeEqual, OTP_MAX_ATTEMPTS } from '@/lib/otp';
import { toPublicApplication } from '@/lib/lifecycle';
import { startWorkSchema } from '@/lib/validation';
import { APPLICATION_STATUS, JOB_STATUS } from '@/lib/status';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireWorker();
    const { otp } = startWorkSchema.parse(await readJson(request));

    const application = await prisma.application.findUnique({ where: { id: params.id } });
    if (!application) throw new HttpError(404, 'NOT_FOUND', 'Application not found');
    if (application.workerId !== user.id) {
      throw new HttpError(403, 'FORBIDDEN', 'This is not your application');
    }
    if (application.status !== APPLICATION_STATUS.ACCEPTED) {
      throw new HttpError(409, 'NOT_ACCEPTED', 'Work can only be started for accepted applications');
    }
    if (application.arrivalOtpAttempts >= OTP_MAX_ATTEMPTS) {
      throw new HttpError(429, 'TOO_MANY_ATTEMPTS', 'Too many wrong codes. Ask the customer to check the code.');
    }

    if (!application.arrivalOtp || !safeEqual(otp, application.arrivalOtp)) {
      // Count the failed attempt atomically; the conditional keeps the limit enforced under concurrency.
      await prisma.application.updateMany({
        where: {
          id: application.id,
          status: APPLICATION_STATUS.ACCEPTED,
          arrivalOtpAttempts: { lt: OTP_MAX_ATTEMPTS },
        },
        data: { arrivalOtpAttempts: { increment: 1 } },
      });
      throw new HttpError(400, 'WRONG_CODE', 'That code does not match. Ask the customer for the code again.');
    }

    await prisma.$transaction(async (tx) => {
      const started = await tx.application.updateMany({
        where: { id: application.id, status: APPLICATION_STATUS.ACCEPTED },
        data: {
          status: APPLICATION_STATUS.IN_PROGRESS,
          startedAt: new Date(),
          arrivalOtp: null,
        },
      });
      if (started.count === 0) {
        throw new HttpError(409, 'NOT_ACCEPTED', 'Work can only be started for accepted applications');
      }

      await tx.job.updateMany({
        where: { id: application.jobId, status: { in: [JOB_STATUS.OPEN, JOB_STATUS.FILLED] } },
        data: { status: JOB_STATUS.IN_PROGRESS },
      });
    });

    const updated = await prisma.application.findUniqueOrThrow({ where: { id: application.id } });
    return ok({ application: toPublicApplication(updated) });
  } catch (err) {
    return handleRouteError(err, 'POST /api/v1/applications/[id]/start');
  }
}
