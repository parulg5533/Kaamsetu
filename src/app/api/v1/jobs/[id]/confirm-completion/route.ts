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
    const userId = session?.userId || body.userId;
    const jobId = params.id;
    const { worker_id, confirmed = true } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: missing user identifier' },
        { status: 401 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        business: true,
        applications: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Determine if requester is Business or Worker
    const isBusiness = job.businessId === userId;
    const targetWorkerId = isBusiness ? worker_id : userId;

    if (!targetWorkerId) {
      return NextResponse.json(
        { success: false, error: 'Worker ID is required to confirm completion' },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId: targetWorkerId,
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found for this worker and job' },
        { status: 404 }
      );
    }

    const updateData: {
      businessConfirmedCompleted?: boolean;
      workerConfirmedCompleted?: boolean;
      status?: string;
    } = {};

    if (isBusiness) {
      updateData.businessConfirmedCompleted = Boolean(confirmed);
    } else {
      updateData.workerConfirmedCompleted = Boolean(confirmed);
    }

    // If both confirmed (or if either confirmed in V1 rapid testing), mark completed
    const willBeCompleted =
      (isBusiness && application.workerConfirmedCompleted) ||
      (!isBusiness && application.businessConfirmedCompleted) ||
      confirmed; // For smooth V1 demo, 1 confirmation enables review

    if (willBeCompleted) {
      updateData.status = 'COMPLETED';
    }

    const updatedApp = await prisma.application.update({
      where: { id: application.id },
      data: updateData,
    });

    // If completed, increment completed counts
    if (updateData.status === 'COMPLETED') {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' },
      });

      await prisma.workerProfile.update({
        where: { userId: targetWorkerId },
        data: { jobsCompleted: { increment: 1 } },
      });

      await prisma.business.update({
        where: { userId: job.businessId },
        data: { jobsCompleted: { increment: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Job completion status updated',
      application: updatedApp,
      job_completed: updatedApp.status === 'COMPLETED',
      prompt_review: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update job completion' },
      { status: 500 }
    );
  }
}
