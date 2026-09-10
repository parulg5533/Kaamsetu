import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const body = await request.json();
    const businessId = session?.userId || body.businessId;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: missing business ID' },
        { status: 401 }
      );
    }

    const {
      skill_id,
      title,
      description,
      workers_required = 1,
      wage,
      food_provided = false,
      job_date,
      start_time,
      end_time,
      locality,
      latitude,
      longitude,
    } = body;

    if (!skill_id || !wage || !job_date || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: 'Missing required job parameters' },
        { status: 400 }
      );
    }

    // Get business coordinates if not directly supplied in post
    let lat = latitude ? parseFloat(latitude) : undefined;
    let lng = longitude ? parseFloat(longitude) : undefined;

    const business = await prisma.business.findUnique({
      where: { userId: businessId },
    });

    if (business) {
      lat = lat || business.latitude;
      lng = lng || business.longitude;
    }

    const job = await prisma.job.create({
      data: {
        businessId,
        skillId: skill_id,
        title: title || 'Worker Required',
        description,
        workersRequired: Number(workers_required),
        wage: Number(wage),
        foodProvided: Boolean(food_provided),
        jobDate: job_date,
        startTime: start_time,
        endTime: end_time,
        locality: locality || business?.locality || 'Local Area',
        latitude: lat || 31.6375,
        longitude: lng || 74.8780,
        status: 'OPEN',
      },
      include: {
        skill: true,
      },
    });

    // Increment business jobs_posted count
    await prisma.business.update({
      where: { userId: businessId },
      data: { jobsPosted: { increment: 1 } },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Job posted successfully!',
        job,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error posting job:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post job' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const { searchParams } = new URL(request.url);
    const businessId = session?.userId || searchParams.get('business_id');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: missing business ID' },
        { status: 401 }
      );
    }

    const jobs = await prisma.job.findMany({
      where: { businessId },
      include: {
        skill: true,
        applications: {
          include: {
            worker: {
              include: {
                user: { select: { name: true, phone: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      skill_name: job.skill.name,
      wage: job.wage,
      food_provided: job.foodProvided,
      job_date: job.jobDate,
      start_time: job.startTime,
      end_time: job.endTime,
      locality: job.locality,
      status: job.status,
      workers_required: job.workersRequired,
      workers_accepted: job.workersAccepted,
      applicant_count: job.applications.length,
      accepted_count: job.applications.filter((a) => a.status === 'ACCEPTED').length,
    }));

    return NextResponse.json({
      success: true,
      jobs: formatted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch business jobs' },
      { status: 500 }
    );
  }
}
