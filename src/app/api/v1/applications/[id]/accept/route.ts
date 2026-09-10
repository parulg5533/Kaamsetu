import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        worker: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status === 'ACCEPTED') {
      return NextResponse.json({
        success: true,
        message: 'Worker is already accepted',
        worker: {
          name: application.worker.user.name,
          phone: application.worker.user.phone,
        },
      });
    }

    // Update application status to ACCEPTED
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' },
    });

    // Increment workers_accepted on the job
    const updatedJob = await prisma.job.update({
      where: { id: application.jobId },
      data: {
        workersAccepted: { increment: 1 },
      },
    });

    // If target workers met, mark job as FILLED
    if (updatedJob.workersAccepted >= updatedJob.workersRequired) {
      await prisma.job.update({
        where: { id: application.jobId },
        data: { status: 'FILLED' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Worker accepted successfully! Phone number is now revealed.',
      application: updatedApplication,
      worker: {
        name: application.worker.user.name,
        phone: application.worker.user.phone,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to accept application' },
      { status: 500 }
    );
  }
}
