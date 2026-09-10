import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistanceKm } from '@/lib/geo';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          include: {
            worker: {
              include: {
                user: { select: { name: true, phone: true } },
                skills: { include: { skill: true } },
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    const applicants = job.applications.map((app: any) => {
      const distanceKm = calculateDistanceKm(
        job.latitude,
        job.longitude,
        app.worker.latitude,
        app.worker.longitude
      );

      const isAccepted = app.status === 'ACCEPTED' || app.status === 'COMPLETED';

      return {
        application_id: app.id,
        worker_id: app.worker.userId,
        name: app.worker.user.name,
        // Worker phone is unlocked only after acceptance
        phone: isAccepted ? app.worker.user.phone : null,
        city: app.worker.city,
        locality: app.worker.locality,
        rating: app.worker.rating,
        rating_count: app.worker.ratingCount,
        jobs_completed: app.worker.jobsCompleted,
        attendance_rate: app.worker.attendanceRate,
        experience_years: app.worker.experienceYears,
        expected_wage: app.worker.expectedWage,
        distance_km: distanceKm,
        status: app.status,
        applied_at: app.appliedAt,
        skills: app.worker.skills.map((s: any) => s.skill.name),
      };
    });

    // Sort applicants: ACCEPTED first, then by distance ascending, then rating descending
    applicants.sort((a: any, b: any) => {
      if (a.status === 'ACCEPTED' && b.status !== 'ACCEPTED') return -1;
      if (b.status === 'ACCEPTED' && a.status !== 'ACCEPTED') return 1;
      return a.distance_km - b.distance_km || b.rating - a.rating;
    });

    return NextResponse.json({
      success: true,
      job_id: job.id,
      title: job.title,
      workers_required: job.workersRequired,
      workers_accepted: job.workersAccepted,
      applicants,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch applicants' },
      { status: 500 }
    );
  }
}
