import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { handleRouteError, ok } from '@/lib/http';
import { boundingBox, calculateDistanceKm } from '@/lib/geo';
import { JOB_STATUS } from '@/lib/status';
import { nearbyQuerySchema, queryToObject } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const query = nearbyQuerySchema.parse(queryToObject(new URL(request.url).searchParams));
    const me = await getCurrentUser();
    const box = boundingBox(query.lat, query.lng, query.max_distance);

    const jobs = await prisma.job.findMany({
      where: {
        latitude: { gte: box.minLat, lte: box.maxLat },
        longitude: { gte: box.minLng, lte: box.maxLng },
        ...(query.skill_id ? { skillId: query.skill_id } : {}),
        // Never show a customer their own jobs.
        ...(me ? { businessId: { not: me.id } } : {}),
        // Direct-hire jobs are only offered to the invited worker.
        AND: [{ OR: [{ invitedWorkerId: null }, ...(me ? [{ invitedWorkerId: me.id }] : [])] }],
        OR: [
          { status: JOB_STATUS.OPEN },
          // Keep jobs the caller already applied to, so they can still track them.
          ...(me ? [{ applications: { some: { workerId: me.id } } }] : []),
        ],
      },
      include: { skill: true, business: true },
      orderBy: { createdAt: 'desc' },
    });

    const myApplications = new Map<string, { id: string; status: string }>();
    if (me && jobs.length > 0) {
      const apps = await prisma.application.findMany({
        where: { workerId: me.id, jobId: { in: jobs.map((j) => j.id) } },
        select: { id: true, jobId: true, status: true },
      });
      for (const app of apps) myApplications.set(app.jobId, { id: app.id, status: app.status });
    }

    const nearbyJobs = jobs
      .map((job) => {
        const application = myApplications.get(job.id) ?? null;
        return {
          id: job.id,
          title: job.title,
          description: job.description,
          skill_id: job.skillId,
          skill_name: job.skill.name,
          skill_slug: job.skill.slug,
          wage: job.wage,
          food_provided: job.foodProvided,
          job_date: job.jobDate,
          start_time: job.startTime,
          end_time: job.endTime,
          locality: job.locality,
          latitude: job.latitude,
          longitude: job.longitude,
          workers_required: job.workersRequired,
          workers_accepted: job.workersAccepted,
          distance_km: calculateDistanceKm(query.lat, query.lng, job.latitude, job.longitude),
          is_invited: !!me && job.invitedWorkerId === me.id,
          business: {
            id: job.business.userId,
            business_name: job.business.businessName,
            business_type: job.business.businessType,
            locality: job.business.locality,
            rating: job.business.rating,
            rating_count: job.business.ratingCount,
            jobs_completed: job.business.jobsCompleted,
          },
          my_application_status: application ? application.status : null,
          application_id: application ? application.id : null,
        };
      })
      .filter((job) => job.distance_km <= query.max_distance)
      .sort((a, b) => a.distance_km - b.distance_km || b.wage - a.wage);

    return ok({ count: nearbyJobs.length, jobs: nearbyJobs });
  } catch (err) {
    return handleRouteError(err, 'jobs.nearby');
  }
}
