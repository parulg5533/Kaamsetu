import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistanceKm } from '@/lib/geo';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getAuthSession(request);

    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const maxDistParam = searchParams.get('max_distance') || '10.0';
    const workerId = searchParams.get('worker_id') || session?.userId;

    // Default to Amritsar Center if lat/long not supplied
    const workerLat = latParam ? parseFloat(latParam) : 31.634;
    const workerLng = lngParam ? parseFloat(lngParam) : 74.8723;
    const maxDistance = parseFloat(maxDistParam);

    // Fetch all active OPEN jobs
    const jobs = await prisma.job.findMany({
      where: {
        status: 'OPEN',
      },
      include: {
        skill: true,
        business: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
        applications: workerId
          ? {
              where: { workerId },
            }
          : false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Compute distance for each job, filter by distance, and format response
    const nearbyJobs = jobs
      .map((job: any) => {
        const distanceKm = calculateDistanceKm(
          workerLat,
          workerLng,
          job.latitude,
          job.longitude
        );

        const application =
          Array.isArray(job.applications) && job.applications.length > 0
            ? job.applications[0]
            : null;

        return {
          id: job.id,
          title: job.title,
          description: job.description,
          skill_name: job.skill.name,
          skill_id: job.skill.id,
          wage: job.wage,
          food_provided: job.foodProvided,
          job_date: job.jobDate,
          start_time: job.startTime,
          end_time: job.endTime,
          locality: job.locality,
          workers_required: job.workersRequired,
          workers_accepted: job.workersAccepted,
          distance_km: distanceKm,
          business: {
            id: job.business.userId,
            business_name: job.business.businessName,
            business_type: job.business.businessType,
            locality: job.business.locality,
            rating: job.business.rating,
            jobs_completed: job.business.jobsCompleted,
          },
          my_application_status: application ? application.status : null,
          application_id: application ? application.id : null,
        };
      })
      .filter((job: any) => job.distance_km <= maxDistance)
      .sort((a: any, b: any) => a.distance_km - b.distance_km || b.wage - a.wage);

    return NextResponse.json({
      success: true,
      count: nearbyJobs.length,
      jobs: nearbyJobs,
    });
  } catch (error: any) {
    console.error('Error in nearby jobs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch nearby jobs' },
      { status: 500 }
    );
  }
}
