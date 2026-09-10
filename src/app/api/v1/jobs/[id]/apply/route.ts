import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(request);
    const body = await request.json().catch(() => ({}));
    const workerId = session?.userId || body.workerId;
    const jobId = params.id;

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: missing worker identification' },
        { status: 401 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, error: 'This job is no longer accepting applications' },
        { status: 400 }
      );
    }

    // Upsert or create application
    const application = await prisma.application.upsert({
      where: {
        jobId_workerId: {
          jobId,
          workerId,
        },
      },
      update: {
        status: 'APPLIED',
      },
      create: {
        jobId,
        workerId,
        status: 'APPLIED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      application,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}
