import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { HttpError, handleRouteError, ok, readJson } from '@/lib/http';
import { reviewSchema } from '@/lib/validation';
import { APPLICATION_STATUS } from '@/lib/status';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = reviewSchema.parse(await readJson(request));

    const application = await prisma.application.findUnique({
      where: { id: body.application_id },
      include: { job: true },
    });
    if (!application) throw new HttpError(404, 'NOT_FOUND', 'Application not found');

    const isWorker = application.workerId === user.id;
    const isBusiness = application.job.businessId === user.id;
    if (!isWorker && !isBusiness) {
      throw new HttpError(403, 'NOT_A_PARTY', 'Only the parties to this job can leave a review');
    }
    if (application.status !== APPLICATION_STATUS.COMPLETED) {
      throw new HttpError(409, 'NOT_COMPLETED', 'Reviews can be left only after the work is completed');
    }

    // The counterpart is the other party. A worker reviews the business; a business reviews the worker.
    const toUserId = isWorker ? application.job.businessId : application.workerId;
    const feedbackTag = body.feedback_tag ?? null;
    const comment = body.comment ?? null;

    const { review, newRating } = await prisma.$transaction(async (tx) => {
      const review = await tx.review.upsert({
        where: {
          jobId_fromUserId_toUserId: {
            jobId: application.jobId,
            fromUserId: user.id,
            toUserId,
          },
        },
        update: { rating: body.rating, feedbackTag, comment },
        create: {
          jobId: application.jobId,
          fromUserId: user.id,
          toUserId,
          rating: body.rating,
          feedbackTag,
          comment,
        },
      });

      // Recompute the target's rating from all reviews received (across jobs).
      const agg = await tx.review.aggregate({
        where: { toUserId },
        _avg: { rating: true },
        _count: true,
      });
      const newRating = Math.round((agg._avg.rating ?? 0) * 10) / 10;
      const ratingCount = agg._count;

      if (isWorker) {
        await tx.business.update({
          where: { userId: toUserId },
          data: { rating: newRating, ratingCount },
        });
      } else {
        await tx.workerProfile.update({
          where: { userId: toUserId },
          data: { rating: newRating, ratingCount },
        });
      }

      return { review, newRating };
    });

    return ok({
      review: {
        id: review.id,
        job_id: review.jobId,
        from_user_id: review.fromUserId,
        to_user_id: review.toUserId,
        rating: review.rating,
        feedback_tag: review.feedbackTag,
        comment: review.comment,
        created_at: review.createdAt,
      },
      new_rating: newRating,
    });
  } catch (err) {
    return handleRouteError(err, 'reviews POST');
  }
}
