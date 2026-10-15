import { prisma } from '@/lib/prisma';
import { HttpError, handleRouteError, ok } from '@/lib/http';
import { requireWorker } from '@/lib/auth';
import { toPublicApplication } from '@/lib/lifecycle';
import { APPLICATION_STATUS } from '@/lib/status';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireWorker();

    const existing = await prisma.application.findUnique({
      where: { jobId_workerId: { jobId: params.id, workerId: user.id } },
    });
    if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Application not found');

    const withdrawn = await prisma.application.updateMany({
      where: { id: existing.id, status: APPLICATION_STATUS.APPLIED },
      data: { status: APPLICATION_STATUS.WITHDRAWN },
    });
    if (withdrawn.count === 0) {
      throw new HttpError(409, 'NOT_PENDING', 'Only a pending application can be withdrawn');
    }

    const application = await prisma.application.findUniqueOrThrow({ where: { id: existing.id } });
    return ok({ application: toPublicApplication(application) });
  } catch (err) {
    return handleRouteError(err, 'POST /api/v1/jobs/[id]/withdraw');
  }
}
