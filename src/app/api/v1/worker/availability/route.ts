import { prisma } from '@/lib/prisma';
import { requireWorker } from '@/lib/auth';
import { handleRouteError, ok, readJson } from '@/lib/http';
import { availabilitySchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const { worker } = await requireWorker();
    const { availability } = availabilitySchema.parse(await readJson(request));

    const updated = await prisma.workerProfile.update({
      where: { userId: worker.userId },
      data: { availability },
      select: { availability: true },
    });

    return ok({ availability: updated.availability });
  } catch (err) {
    return handleRouteError(err, 'worker.availability.update');
  }
}
