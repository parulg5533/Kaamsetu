import { prisma } from '@/lib/prisma';
import { HttpError, handleRouteError, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { toPublicApplication } from '@/lib/lifecycle';
import { APPLICATION_STATUS, JOB_STATUS } from '@/lib/status';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: { job: true },
    });
    if (!application) throw new HttpError(404, 'NOT_FOUND', 'Application not found');

    const isWorker = application.workerId === user.id;
    const isBusiness = application.job.businessId === user.id;
    if (!isWorker && !isBusiness) {
      throw new HttpError(403, 'FORBIDDEN', 'You are not a party to this job');
    }

    // Idempotent: a completed application returns the same result without touching counters.
    if (application.status === APPLICATION_STATUS.COMPLETED) {
      return ok({
        application: toPublicApplication(application),
        completed: true,
        waiting_for: null,
      });
    }
    if (application.status !== APPLICATION_STATUS.IN_PROGRESS) {
      throw new HttpError(409, 'NOT_STARTED', 'Completion can only be confirmed for work in progress');
    }

    const now = new Date();
    const { result, completed } = await prisma.$transaction(async (tx) => {
      // Record this party's confirmation once.
      if (isWorker) {
        await tx.application.updateMany({
          where: { id: application.id, workerConfirmedAt: null },
          data: { workerConfirmedAt: now },
        });
      } else {
        await tx.application.updateMany({
          where: { id: application.id, businessConfirmedAt: null },
          data: { businessConfirmedAt: now },
        });
      }

      const confirmed = await tx.application.findUniqueOrThrow({ where: { id: application.id } });

      let didComplete = false;
      if (confirmed.workerConfirmedAt && confirmed.businessConfirmedAt) {
        // Only the request that actually flips the status updates the counters.
        const flipped = await tx.application.updateMany({
          where: { id: application.id, status: APPLICATION_STATUS.IN_PROGRESS },
          data: { status: APPLICATION_STATUS.COMPLETED, completedAt: now },
        });
        if (flipped.count === 1) {
          didComplete = true;
          await tx.workerProfile.update({
            where: { userId: application.workerId },
            data: { jobsCompleted: { increment: 1 } },
          });
          await tx.business.update({
            where: { userId: application.job.businessId },
            data: { jobsCompleted: { increment: 1 } },
          });

          const remaining = await tx.application.count({
            where: {
              jobId: application.jobId,
              status: { in: [APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.IN_PROGRESS] },
            },
          });
          if (remaining === 0) {
            await tx.job.updateMany({
              where: { id: application.jobId, status: { not: JOB_STATUS.CANCELLED } },
              data: { status: JOB_STATUS.COMPLETED },
            });
          }
        }
      }

      const final = await tx.application.findUniqueOrThrow({ where: { id: application.id } });
      return { result: final, completed: final.status === APPLICATION_STATUS.COMPLETED || didComplete };
    });

    const waitingFor = completed ? null : result.workerConfirmedAt ? 'BUSINESS' : 'WORKER';
    return ok({
      application: toPublicApplication(result),
      completed,
      waiting_for: waitingFor,
    });
  } catch (err) {
    return handleRouteError(err, 'POST /api/v1/applications/[id]/confirm-completion');
  }
}
