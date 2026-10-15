import { prisma } from '@/lib/prisma';
import { requireBusiness } from '@/lib/auth';
import { HttpError, handleRouteError, ok } from '@/lib/http';
import { calculateDistanceKm } from '@/lib/geo';
import { APPLICATION_STATUS, MATCHED_STATUSES } from '@/lib/status';

export const dynamic = 'force-dynamic';

/** Lower rank sorts first: matched applicants, then new applicants, then everyone else. */
function statusRank(status: string): number {
  if (MATCHED_STATUSES.includes(status)) return 0;
  if (status === APPLICATION_STATUS.APPLIED) return 1;
  return 2;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { business } = await requireBusiness();

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        applications: {
          include: {
            worker: {
              include: {
                user: { select: { name: true, phone: true } },
                skills: { include: { skill: { select: { name: true } } } },
              },
            },
          },
        },
      },
    });

    if (!job) throw new HttpError(404, 'NOT_FOUND', 'Job not found');
    if (job.businessId !== business.userId) {
      throw new HttpError(403, 'NOT_YOUR_JOB', 'You can only view applicants for your own jobs');
    }

    const applicants = job.applications.map((app) => {
      const worker = app.worker;
      const matched = MATCHED_STATUSES.includes(app.status);
      return {
        application_id: app.id,
        worker_id: app.workerId,
        name: worker.user.name,
        // Worker phone is revealed only once the application is matched.
        phone: matched ? worker.user.phone : null,
        city: worker.city,
        locality: worker.locality,
        rating: worker.rating,
        rating_count: worker.ratingCount,
        jobs_completed: worker.jobsCompleted,
        experience_years: worker.experienceYears,
        expected_wage: worker.expectedWage,
        distance_km: calculateDistanceKm(job.latitude, job.longitude, worker.latitude, worker.longitude),
        status: app.status,
        applied_at: app.appliedAt,
        skills: worker.skills.map((s) => s.skill.name),
      };
    });

    applicants.sort(
      (a, b) =>
        statusRank(a.status) - statusRank(b.status) ||
        a.distance_km - b.distance_km ||
        b.rating - a.rating
    );

    return ok({
      job_id: job.id,
      title: job.title,
      status: job.status,
      workers_required: job.workersRequired,
      workers_accepted: job.workersAccepted,
      applicants,
    });
  } catch (err) {
    return handleRouteError(err, 'business.jobs.applicants');
  }
}
