import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireWorker } from '@/lib/auth';
import { HttpError, handleRouteError, ok, readJson } from '@/lib/http';
import { updateWorkerProfileSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** Loads the caller's worker profile in the snake_case shape used by GET and PUT. */
async function loadWorkerView(db: Prisma.TransactionClient, userId: string) {
  const w = await db.workerProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, phone: true } },
      skills: { include: { skill: true } },
    },
  });
  if (!w) throw new HttpError(404, 'NOT_FOUND', 'Worker profile not found');

  return {
    id: w.userId,
    name: w.user.name,
    phone: w.user.phone,
    city: w.city,
    locality: w.locality,
    latitude: w.latitude,
    longitude: w.longitude,
    experience_years: w.experienceYears,
    expected_wage: w.expectedWage,
    availability: w.availability,
    rating: w.rating,
    rating_count: w.ratingCount,
    jobs_completed: w.jobsCompleted,
    skills: w.skills.map((s) => ({
      id: s.skill.id,
      name: s.skill.name,
      slug: s.skill.slug,
      category: s.skill.category,
    })),
  };
}

export async function GET() {
  try {
    const { user } = await requireWorker();
    const worker = await loadWorkerView(prisma, user.id);
    return ok({ worker });
  } catch (err) {
    return handleRouteError(err, 'worker.profile.get');
  }
}

export async function PUT(request: Request) {
  try {
    const { user } = await requireWorker();
    const data = updateWorkerProfileSchema.parse(await readJson(request));

    const worker = await prisma.$transaction(async (tx) => {
      if (data.name !== undefined) {
        await tx.user.update({ where: { id: user.id }, data: { name: data.name } });
      }

      if (data.skill_ids !== undefined) {
        const skillIds = Array.from(new Set(data.skill_ids));
        const found = await tx.skill.count({ where: { id: { in: skillIds } } });
        if (found !== skillIds.length) {
          throw new HttpError(400, 'UNKNOWN_SKILL', 'One or more selected skills are not recognised');
        }
        await tx.workerSkill.deleteMany({ where: { workerId: user.id } });
        await tx.workerSkill.createMany({
          data: skillIds.map((skillId) => ({ workerId: user.id, skillId })),
        });
      }

      await tx.workerProfile.update({
        where: { userId: user.id },
        data: {
          city: data.city,
          locality: data.locality === undefined ? undefined : data.locality || null,
          latitude: data.latitude,
          longitude: data.longitude,
          experienceYears: data.experience_years,
          expectedWage: data.expected_wage,
          availability: data.availability,
        },
      });

      return loadWorkerView(tx, user.id);
    });

    return ok({ worker });
  } catch (err) {
    return handleRouteError(err, 'worker.profile.update');
  }
}
