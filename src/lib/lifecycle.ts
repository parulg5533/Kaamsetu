import { prisma } from './prisma';
import { HttpError } from './http';
import { generateArrivalCode } from './otp';
import { APPLICATION_STATUS, JOB_STATUS } from './status';

/**
 * Strips the arrival code so it is never returned to a client in an application payload.
 * Only the business can read it, via GET /applications/[id]/arrival-code.
 */
export function toPublicApplication<T extends { arrivalOtp: string | null }>(app: T): Omit<T, 'arrivalOtp'> {
  const { arrivalOtp, ...rest } = app;
  void arrivalOtp;
  return rest;
}

/**
 * Accepts an application (APPLIED -> ACCEPTED) and updates the job's accepted count.
 * `actingBusinessId = null` means the system is accepting on behalf of an invited worker.
 * Any HttpError thrown inside the transaction rolls back every write.
 */
export async function acceptApplication(applicationId: string, actingBusinessId: string | null) {
  return prisma.$transaction(async (tx) => {
    const found = await tx.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        worker: { include: { user: { select: { name: true, phone: true } } } },
      },
    });
    if (!found) throw new HttpError(404, 'NOT_FOUND', 'Application not found');

    const job = found.job;
    if (actingBusinessId !== null && job.businessId !== actingBusinessId) {
      throw new HttpError(403, 'FORBIDDEN', 'You can only accept applications for your own jobs');
    }

    const accepted = await tx.application.updateMany({
      where: { id: found.id, status: APPLICATION_STATUS.APPLIED },
      data: {
        status: APPLICATION_STATUS.ACCEPTED,
        arrivalOtp: generateArrivalCode(),
        arrivalOtpAttempts: 0,
      },
    });
    if (accepted.count === 0) {
      throw new HttpError(409, 'NOT_PENDING', 'This application is no longer pending');
    }

    const slot = await tx.job.updateMany({
      where: {
        id: job.id,
        status: JOB_STATUS.OPEN,
        workersAccepted: { lt: job.workersRequired },
      },
      data: { workersAccepted: { increment: 1 } },
    });
    if (slot.count === 0) {
      throw new HttpError(409, 'JOB_FULL', 'This job already has all the workers it needs');
    }

    const current = await tx.job.findUniqueOrThrow({ where: { id: job.id } });
    if (current.workersAccepted >= current.workersRequired) {
      await tx.job.update({ where: { id: job.id }, data: { status: JOB_STATUS.FILLED } });
      await tx.application.updateMany({
        where: { jobId: job.id, status: APPLICATION_STATUS.APPLIED },
        data: { status: APPLICATION_STATUS.REJECTED },
      });
    }

    const application = await tx.application.findUniqueOrThrow({ where: { id: found.id } });
    const jobAfter = await tx.job.findUniqueOrThrow({ where: { id: job.id } });

    return {
      application: toPublicApplication(application),
      worker: {
        id: found.workerId,
        name: found.worker.user.name,
        phone: found.worker.user.phone,
      },
      job_status: jobAfter.status,
    };
  });
}
