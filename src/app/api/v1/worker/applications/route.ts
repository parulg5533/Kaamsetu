import { prisma } from '@/lib/prisma';
import { requireWorker } from '@/lib/auth';
import { handleRouteError, ok } from '@/lib/http';
import { MATCHED_STATUSES } from '@/lib/status';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { worker } = await requireWorker();

    const applications = await prisma.application.findMany({
      where: { workerId: worker.userId },
      include: {
        job: {
          include: {
            skill: true,
            business: {
              include: {
                user: { select: { name: true, phone: true } },
              },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    const formatted = applications.map((app) => {
      // Contact details are revealed only once the two parties are matched.
      const matched = MATCHED_STATUSES.includes(app.status);
      const business = app.job.business;
      return {
        id: app.id,
        status: app.status,
        applied_at: app.appliedAt,
        started_at: app.startedAt,
        worker_confirmed: !!app.workerConfirmedAt,
        business_confirmed: !!app.businessConfirmedAt,
        completed_at: app.completedAt,
        job: {
          id: app.job.id,
          title: app.job.title,
          description: app.job.description,
          skill_name: app.job.skill.name,
          wage: app.job.wage,
          food_provided: app.job.foodProvided,
          job_date: app.job.jobDate,
          start_time: app.job.startTime,
          end_time: app.job.endTime,
          locality: app.job.locality,
          status: app.job.status,
          business: {
            id: business.userId,
            business_name: business.businessName,
            business_type: business.businessType,
            locality: business.locality,
            phone: matched ? business.user.phone : null,
            owner_name: matched ? business.user.name : null,
          },
        },
      };
    });

    return ok({ applications: formatted });
  } catch (err) {
    return handleRouteError(err, 'worker.applications.list');
  }
}
