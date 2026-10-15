import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireBusiness } from '@/lib/auth';
import { HttpError, handleRouteError, ok, readJson } from '@/lib/http';
import { JOB_STATUS, MATCHED_STATUSES, APPLICATION_STATUS } from '@/lib/status';
import { createJobSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const jobInclude = {
  skill: true,
  applications: { select: { status: true } },
} satisfies Prisma.JobInclude;

type JobRow = Prisma.JobGetPayload<{ include: typeof jobInclude }>;

function formatBusinessJob(job: JobRow) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
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
    status: job.status,
    workers_required: job.workersRequired,
    workers_accepted: job.workersAccepted,
    applicant_count: job.applications.filter((a) => a.status === APPLICATION_STATUS.APPLIED).length,
    accepted_count: job.applications.filter((a) => MATCHED_STATUSES.includes(a.status)).length,
    invited_worker_id: job.invitedWorkerId,
  };
}

export async function GET() {
  try {
    const { business } = await requireBusiness();

    const jobs = await prisma.job.findMany({
      where: { businessId: business.userId },
      include: jobInclude,
      orderBy: { createdAt: 'desc' },
    });

    return ok({ jobs: jobs.map(formatBusinessJob) });
  } catch (err) {
    return handleRouteError(err, 'business.jobs.list');
  }
}

export async function POST(request: Request) {
  try {
    const { business } = await requireBusiness();
    const data = createJobSchema.parse(await readJson(request));

    const job = await prisma.$transaction(async (tx) => {
      const skill = await tx.skill.findUnique({ where: { id: data.skill_id }, select: { id: true } });
      if (!skill) throw new HttpError(400, 'UNKNOWN_SKILL', 'Choose a valid type of work');

      const invitedWorkerId = data.invited_worker_id ?? null;
      if (invitedWorkerId) {
        const invited = await tx.workerProfile.findUnique({
          where: { userId: invitedWorkerId },
          select: { userId: true },
        });
        if (!invited) throw new HttpError(400, 'UNKNOWN_WORKER', 'The invited worker was not found');
      }

      const created = await tx.job.create({
        data: {
          businessId: business.userId,
          skillId: skill.id,
          title: data.title,
          description: data.description ?? null,
          workersRequired: data.workers_required,
          wage: data.wage,
          foodProvided: data.food_provided,
          jobDate: data.job_date,
          startTime: data.start_time,
          endTime: data.end_time,
          locality: data.locality,
          latitude: data.latitude,
          longitude: data.longitude,
          status: JOB_STATUS.OPEN,
          invitedWorkerId,
        },
        include: jobInclude,
      });

      await tx.business.update({
        where: { userId: business.userId },
        data: { jobsPosted: { increment: 1 } },
      });

      return created;
    });

    return ok({ job: formatBusinessJob(job) }, 201);
  } catch (err) {
    return handleRouteError(err, 'business.jobs.create');
  }
}
