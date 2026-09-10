import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const session = await getAuthSession(request);
    const body = await request.json();
    const userId = session?.userId || body.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: missing user session' },
        { status: 401 }
      );
    }

    const { availability } = body;
    const validStatuses = ['AVAILABLE_TODAY', 'AVAILABLE_TOMORROW', 'UNAVAILABLE'];

    if (!validStatuses.includes(availability)) {
      return NextResponse.json(
        { success: false, error: 'Invalid availability status' },
        { status: 400 }
      );
    }

    const updated = await prisma.workerProfile.update({
      where: { userId },
      data: { availability },
    });

    return NextResponse.json({
      success: true,
      availability: updated.availability,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update availability' },
      { status: 500 }
    );
  }
}
