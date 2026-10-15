import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { handleRouteError, ok } from '@/lib/http';
import { approximateCoord, boundingBox, calculateDistanceKm } from '@/lib/geo';
import { nearbyQuerySchema, queryToObject } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const MAX_RESULTS = 200;

export async function GET(request: Request) {
  try {
    const query = nearbyQuerySchema.parse(queryToObject(new URL(request.url).searchParams));
    const me = await getCurrentUser();
    const box = boundingBox(query.lat, query.lng, query.max_distance);

    const workers = await prisma.workerProfile.findMany({
      where: {
        user: { isActive: true, ...(me ? { id: { not: me.id } } : {}) },
        latitude: { gte: box.minLat, lte: box.maxLat },
        longitude: { gte: box.minLng, lte: box.maxLng },
        ...(query.skill_id ? { skills: { some: { skillId: query.skill_id } } } : {}),
      },
      include: {
        user: { select: { name: true } },
        skills: { include: { skill: true } },
      },
      take: MAX_RESULTS,
    });

    const nearbyWorkers = workers
      .map((w) => ({
        id: w.userId,
        name: w.user.name,
        city: w.city,
        locality: w.locality,
        experience_years: w.experienceYears,
        expected_wage: w.expectedWage,
        availability: w.availability,
        rating: w.rating,
        rating_count: w.ratingCount,
        jobs_completed: w.jobsCompleted,
        distance_km: calculateDistanceKm(query.lat, query.lng, w.latitude, w.longitude),
        latitude: approximateCoord(w.latitude),
        longitude: approximateCoord(w.longitude),
        skills: w.skills.map((s) => ({
          id: s.skill.id,
          name: s.skill.name,
          slug: s.skill.slug,
          category: s.skill.category,
        })),
      }))
      .filter((w) => w.distance_km <= query.max_distance)
      .sort((a, b) => {
        // Available workers first, then distance ascending, then rating descending.
        const aAvail = a.availability.startsWith('AVAILABLE');
        const bAvail = b.availability.startsWith('AVAILABLE');
        if (aAvail !== bAvail) return aAvail ? -1 : 1;
        return a.distance_km - b.distance_km || b.rating - a.rating;
      });

    return ok({ count: nearbyWorkers.length, workers: nearbyWorkers });
  } catch (err) {
    return handleRouteError(err, 'workers.nearby');
  }
}
