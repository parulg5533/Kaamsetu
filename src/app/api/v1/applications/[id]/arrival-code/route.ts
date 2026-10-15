import { prisma } from '@/lib/prisma';
import { HttpError, handleRouteError, ok } from '@/lib/http';
import { requireBusiness } from '@/lib/auth';
import { APPLICATION_STATUS } from '@/lib/status';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireBusiness();

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: { job: true },
    });
    if (!application) throw new HttpError(404, 'NOT_FOUND', 'Application not found');
    if (application.job.businessId !== user.id) {
      throw new HttpError(403, 'FORBIDDEN', 'You can only view codes for your own jobs');
    }
    if (application.status !== APPLICATION_STATUS.ACCEPTED) {
      throw new HttpError(409, 'NOT_ACCEPTED', 'The arrival code is only available for accepted applications');
    }

    return ok({ code: application.arrivalOtp });
  } catch (err) {
    return handleRouteError(err, 'GET /api/v1/applications/[id]/arrival-code');
  }
}
