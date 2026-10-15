import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { handleRouteError, ok } from '@/lib/http';
import { ACTIVE_WORK_STATUSES, APPLICATION_STATUS } from '@/lib/status';
import type { ActiveWorkItem, ActiveWorkStage } from '@/lib/types/active-work';

export const dynamic = 'force-dynamic';

const COMPLETED_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const STAGE_RANK: Record<ActiveWorkStage, number> = {
  IN_PROGRESS: 0,
  ACCEPTED: 1,
  COMPLETED: 2,
};

export async function GET() {
  try {
    const me = await requireUser();
    const since = new Date(Date.now() - COMPLETED_WINDOW_MS);

    const applications = await prisma.application.findMany({
      where: {
        AND: [
          { OR: [{ workerId: me.id }, { job: { businessId: me.id } }] },
          {
            OR: [
              { status: { in: [...ACTIVE_WORK_STATUSES] } },
              { status: APPLICATION_STATUS.COMPLETED, completedAt: { gte: since } },
            ],
          },
        ],
      },
      include: {
        job: {
          include: {
            business: { include: { user: { select: { phone: true } } } },
          },
        },
        worker: { include: { user: { select: { name: true, phone: true } } } },
      },
    });

    // Reviews this user has already left, scoped to the jobs in play.
    const jobIds = applications.map((a) => a.jobId);
    const myReviews =
      jobIds.length === 0
        ? []
        : await prisma.review.findMany({
            where: { fromUserId: me.id, jobId: { in: jobIds } },
            select: { jobId: true, toUserId: true },
          });
    const reviewed = new Set(myReviews.map((r) => `${r.jobId}:${r.toUserId}`));

    const items: ActiveWorkItem[] = [];

    for (const app of applications) {
      if (
        app.status !== APPLICATION_STATUS.ACCEPTED &&
        app.status !== APPLICATION_STATUS.IN_PROGRESS &&
        app.status !== APPLICATION_STATUS.COMPLETED
      ) {
        continue;
      }
      const stage = app.status as ActiveWorkStage;
      const job = app.job;
      const isWorker = app.workerId === me.id;
      const myRole = isWorker ? 'WORKER' : 'BUSINESS';

      const counterpart = isWorker
        ? {
            id: job.businessId,
            name: job.business.businessName,
            phone: job.business.user.phone,
          }
        : {
            id: app.workerId,
            name: app.worker.user.name,
            phone: app.worker.user.phone,
          };

      const iReviewed = reviewed.has(`${job.id}:${counterpart.id}`);
      const paymentConfirmed = !!app.paymentConfirmedAt;

      // Completed work drops off once it no longer needs action from this user.
      if (stage === 'COMPLETED' && iReviewed && (isWorker || paymentConfirmed)) {
        continue;
      }

      items.push({
        application_id: app.id,
        job_id: job.id,
        title: job.title,
        locality: job.locality ?? null,
        wage: job.wage,
        job_date: job.jobDate,
        start_time: job.startTime,
        end_time: job.endTime,
        stage,
        my_role: myRole,
        counterpart,
        arrival_code: !isWorker && stage === 'ACCEPTED' ? app.arrivalOtp ?? null : null,
        i_confirmed: !!(isWorker ? app.workerConfirmedAt : app.businessConfirmedAt),
        other_confirmed: !!(isWorker ? app.businessConfirmedAt : app.workerConfirmedAt),
        payment_confirmed: paymentConfirmed,
        i_reviewed: iReviewed,
      });
    }

    items.sort((a, b) => STAGE_RANK[a.stage] - STAGE_RANK[b.stage]);

    return ok({ items });
  } catch (err) {
    return handleRouteError(err, 'me/active-work GET');
  }
}
