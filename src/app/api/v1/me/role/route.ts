import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ok, handleRouteError, readJson, HttpError } from '@/lib/http';
import { switchRoleSchema } from '@/lib/validation';
import { cityFromLocality, DEFAULT_CITY, toMeUser } from '@/lib/me';
import { USER_ROLE } from '@/lib/status';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const current = await requireUser();
    const input = switchRoleSchema.parse(await readJson(request));

    const user = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUniqueOrThrow({
        where: { id: current.id },
        include: { workerProfile: true, business: true },
      });

      const needsWorker = input.role === USER_ROLE.WORKER && !existing.workerProfile;
      const needsBusiness = input.role === USER_ROLE.BUSINESS && !existing.business;

      if (needsWorker || needsBusiness) {
        // Location: explicit input wins, else the other profile's location.
        const other = needsWorker ? existing.business : existing.workerProfile;
        let latitude: number;
        let longitude: number;
        let locality: string | null;
        let city: string;

        if (input.latitude !== undefined && input.longitude !== undefined) {
          latitude = input.latitude;
          longitude = input.longitude;
          locality = input.locality || null;
          city = cityFromLocality(locality);
        } else if (other) {
          latitude = other.latitude;
          longitude = other.longitude;
          locality = other.locality;
          city = cityFromLocality(locality) !== DEFAULT_CITY ? cityFromLocality(locality) : other.city;
        } else {
          throw new HttpError(400, 'LOCATION_REQUIRED', 'Share your location to set up this profile');
        }

        if (needsWorker) {
          await tx.workerProfile.create({
            data: {
              userId: existing.id,
              city,
              locality,
              latitude,
              longitude,
              experienceYears: 1,
              expectedWage: 600,
              availability: 'AVAILABLE_TODAY',
            },
          });
        } else {
          await tx.business.create({
            data: {
              userId: existing.id,
              businessName: existing.name,
              businessType: 'Household / Service Request',
              address: locality || 'Not set',
              city,
              locality,
              latitude,
              longitude,
            },
          });
        }
      }

      await tx.user.update({ where: { id: existing.id }, data: { role: input.role } });

      return tx.user.findUniqueOrThrow({
        where: { id: existing.id },
        include: { workerProfile: true, business: true },
      });
    });

    return ok({ user: toMeUser(user) });
  } catch (err) {
    return handleRouteError(err, 'me/role');
  }
}
