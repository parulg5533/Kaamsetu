import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const { searchParams } = new URL(request.url);
    const workerId = session?.userId || searchParams.get('worker_id');

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: missing worker identification' },
        { status: 401 }
      );
    }

    const applications = await prisma.application.findMany({
      where: { workerId },
      include: {
        job: {
          include: {
            skill: true,
            business: {
              include: {
                user: { select: { phone: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    const formatted = applications.map((app) => {
      const isAccepted = app.status === 'ACCEPTED' || app.status === 'COMPLETED';
      return {
        id: app.id,
        status: app.status,
        applied_at: app.appliedAt,
        worker_confirmed_completed: app.workerConfirmedCompleted,
        business_confirmed_completed: app.businessConfirmedCompleted,
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
            id: app.job.business.userId,
            business_name: app.job.business.businessName,
            business_type: app.job.business.businessType,
            locality: app.job.business.locality,
            // CRITICAL PRIVACY BOUNDARY: Phone is revealed ONLY when accepted!
            phone: isAccepted ? app.job.business.user.phone : null,
            owner_name: isAccepted ? app.job.business.user.name : null,
          },
        },
      };
    });

    return NextResponse.json({
      success: true,
      applications: formatted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
