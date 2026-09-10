import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistanceKm } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const skillId = searchParams.get('skill_id');
    const maxDistParam = searchParams.get('max_distance') || '15.0';

    // Default to Amritsar Center if lat/long not supplied
    const customerLat = latParam ? parseFloat(latParam) : 31.634;
    const customerLng = lngParam ? parseFloat(lngParam) : 74.8723;
    const maxDistance = parseFloat(maxDistParam);

    // Fetch active workers
    const workers = await prisma.workerProfile.findMany({
      include: {
        user: {
          select: { name: true, phone: true },
        },
        skills: {
          include: { skill: true },
        },
      },
    });

    const nearbyWorkers = workers
      .map((w) => {
        const distanceKm = calculateDistanceKm(
          customerLat,
          customerLng,
          w.latitude,
          w.longitude
        );

        return {
          id: w.userId,
          name: w.user.name,
          city: w.city,
          locality: w.locality || 'Amritsar',
          experience_years: w.experienceYears,
          expected_wage: w.expectedWage,
          availability: w.availability,
          rating: w.rating,
          rating_count: w.ratingCount,
          jobs_completed: w.jobsCompleted,
          attendance_rate: w.attendanceRate,
          distance_km: distanceKm,
          skills: w.skills.map((s) => ({
            id: s.skill.id,
            name: s.skill.name,
            category: s.skill.category,
          })),
        };
      })
      .filter((w) => {
        const withinDistance = w.distance_km <= maxDistance;
        const matchesSkill = skillId
          ? w.skills.some((s) => s.id === skillId)
          : true;
        return withinDistance && matchesSkill;
      })
      .sort((a, b) => {
        // Available workers first, then distance ascending, then rating descending
        if (a.availability.startsWith('AVAILABLE') && !b.availability.startsWith('AVAILABLE')) return -1;
        if (!a.availability.startsWith('AVAILABLE') && b.availability.startsWith('AVAILABLE')) return 1;
        return a.distance_km - b.distance_km || b.rating - a.rating;
      });

    return NextResponse.json({
      success: true,
      count: nearbyWorkers.length,
      workers: nearbyWorkers,
    });
  } catch (error: any) {
    console.error('Error in nearby workers API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch nearby workers' },
      { status: 500 }
    );
  }
}
