import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const body = await request.json();
    const fromUserId = session?.userId || body.from_user_id;
    const { job_id, to_user_id, rating, feedback_tag, comment } = body;

    if (!fromUserId || !to_user_id || !job_id || !rating) {
      return NextResponse.json(
        { success: false, error: 'Missing required review fields' },
        { status: 400 }
      );
    }

    const numRating = Math.max(1, Math.min(5, Number(rating)));

    // Upsert review
    const review = await prisma.review.upsert({
      where: {
        jobId_fromUserId_toUserId: {
          jobId: job_id,
          fromUserId,
          toUserId: to_user_id,
        },
      },
      update: {
        rating: numRating,
        feedbackTag: feedback_tag,
        comment,
      },
      create: {
        jobId: job_id,
        fromUserId,
        toUserId: to_user_id,
        rating: numRating,
        feedbackTag: feedback_tag,
        comment,
      },
    });

    // Recalculate target user's average rating
    const allReviews = await prisma.review.findMany({
      where: { toUserId: to_user_id },
    });

    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    const roundedRating = Math.round(avgRating * 10) / 10;

    // Check if target user is Worker or Business
    const worker = await prisma.workerProfile.findUnique({
      where: { userId: to_user_id },
    });

    if (worker) {
      await prisma.workerProfile.update({
        where: { userId: to_user_id },
        data: {
          rating: roundedRating,
          ratingCount: allReviews.length,
        },
      });
    } else {
      await prisma.business.update({
        where: { userId: to_user_id },
        data: {
          rating: roundedRating,
          ratingCount: allReviews.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully!',
      review,
      new_rating: roundedRating,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
