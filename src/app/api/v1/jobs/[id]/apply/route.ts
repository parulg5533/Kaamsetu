import { prisma } from '@/lib/prisma';
import { HttpError, handleRouteError, ok } from '@/lib/http';
import { requireWorker } from '@/lib/auth';
import { acceptApplication, toPublicApplication } from '@/lib/lifecycle';
import { APPLICATION_STATUS, JOB_STATUS } from '@/lib/status';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireWorker();

    const job = await prisma.job.findUnique({ where: { id: params.id } });
    if (!job) throw new HttpError(404, 'NOT_FOUND', 'Job not found');
    if (job.businessId === user.id) {
      throw new HttpError(400, 'OWN_JOB', 'You cannot apply to your own job');
    }
    if (job.invitedWorkerId && job.invitedWorkerId !== user.id) {
      throw new HttpError(403, 'NOT_INVITED', 'This job was offered to a specific worker');
    }

    const existing = await prisma.application.findUnique({
      where: { jobId_workerId: { jobId: job.id, workerId: user.id } },
    });
    if (existing?.status === APPLICATION_STATUS.REJECTED) {
      throw new HttpError(403, 'REJECTED', 'Your application for this job was not accepted');
    }
    if (existing && existing.status !== APPLICATION_STATUS.WITHDRAWN) {
      throw new HttpError(409, 'ALREADY_APPLIED', 'You have already applied to this job');
    }
    if (job.status !== JOB_STATUS.OPEN) {
      throw new HttpError(400, 'NOT_OPEN', 'This job is no longer accepting applications');
    }

    let applicationId: string;
    if (existing) {
      // Re-apply after withdrawing. Conditional update so two concurrent re-applies cannot both win.
      const reopened = await prisma.application.updateMany({
        where: { id: existing.id, status: APPLICATION_STATUS.WITHDRAWN },
        data: { status: APPLICATION_STATUS.APPLIED, appliedAt: new Date() },
      });
      if (reopened.count === 0) {
        throw new HttpError(409, 'ALREADY_APPLIED', 'You have already applied to this job');
      }
      applicationId = existing.id;
    } else {
      const created = await prisma.application.create({
        data: { jobId: job.id, workerId: user.id, status: APPLICATION_STATUS.APPLIED },
      });
      applicationId = created.id;
    }

    // Invited workers are accepted straight away.
    if (job.invitedWorkerId === user.id) {
      const result = await acceptApplication(applicationId, null);
      return ok({ application: result.application, auto_accepted: true });
    }

    const application = await prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
    return ok({ application: toPublicApplication(application), auto_accepted: false });
  } catch (err) {
    return handleRouteError(err, 'POST /api/v1/jobs/[id]/apply');
  }
}
