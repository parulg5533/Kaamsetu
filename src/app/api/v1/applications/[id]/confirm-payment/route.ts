import { prisma } from '@/lib/prisma';
import { HttpError, handleRouteError, ok } from '@/lib/http';
import { requireBusiness } from '@/lib/auth';
import { toPublicApplication } from '@/lib/lifecycle';
import { APPLICATION_STATUS } from '@/lib/status';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireBusiness();

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: { job: true },
    });
    if (!application) throw new HttpError(404, 'NOT_FOUND', 'Application not found');
    if (application.job.businessId !== user.id) {
      throw new HttpError(403, 'FORBIDDEN', 'You can only confirm payment for your own jobs');
    }
    if (application.status !== APPLICATION_STATUS.COMPLETED) {
      throw new HttpError(409, 'NOT_COMPLETED', 'Payment can only be confirmed for completed work');
    }

    await prisma.application.updateMany({
      where: { id: application.id, paymentConfirmedAt: null },
      data: { paymentConfirmedAt: new Date() },
    });

    const updated = await prisma.application.findUniqueOrThrow({ where: { id: application.id } });
    return ok({ application: toPublicApplication(updated) });
  } catch (err) {
    return handleRouteError(err, 'POST /api/v1/applications/[id]/confirm-payment');
  }
}
