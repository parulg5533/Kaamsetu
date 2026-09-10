import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const { searchParams } = new URL(request.url);
    const userId = session?.userId || searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: missing user session' },
        { status: 401 }
      );
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, phone: true, role: true } },
        skills: {
          include: { skill: true },
        },
      },
    });

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      worker: {
        id: worker.userId,
        name: worker.user.name,
        phone: worker.user.phone,
        city: worker.city,
        locality: worker.locality,
        latitude: worker.latitude,
        longitude: worker.longitude,
        experience_years: worker.experienceYears,
        expected_wage: worker.expectedWage,
        availability: worker.availability,
        rating: worker.rating,
        rating_count: worker.ratingCount,
        jobs_completed: worker.jobsCompleted,
        attendance_rate: worker.attendanceRate,
        skills: worker.skills.map((s: any) => ({
          id: s.skill.id,
          name: s.skill.name,
          category: s.skill.category,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch worker profile' },
      { status: 500 }
    );
  }
}

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

    const {
      name,
      city,
      locality,
      experience_years,
      expected_wage,
      availability,
      skill_ids,
    } = body;

    if (name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    const updatedProfile = await prisma.workerProfile.update({
      where: { userId },
      data: {
        city: city || undefined,
        locality: locality || undefined,
        experienceYears:
          experience_years !== undefined ? Number(experience_years) : undefined,
        expectedWage:
          expected_wage !== undefined ? Number(expected_wage) : undefined,
        availability: availability || undefined,
      },
      include: {
        user: true,
        skills: { include: { skill: true } },
      },
    });

    if (Array.isArray(skill_ids)) {
      await prisma.workerSkill.deleteMany({ where: { workerId: userId } });
      for (const skillId of skill_ids) {
        await prisma.workerSkill.create({
          data: { workerId: userId, skillId },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Worker profile updated successfully',
      worker: updatedProfile,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
