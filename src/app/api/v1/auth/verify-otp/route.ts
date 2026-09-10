import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otp, role = 'WORKER', name } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone and OTP are required' },
        { status: 400 }
      );
    }

    if (otp !== '1234') {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP. Use test OTP: 1234' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone },
      include: {
        workerProfile: {
          include: {
            skills: {
              include: { skill: true },
            },
          },
        },
        business: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: name || (role === 'WORKER' ? 'New Worker' : 'New Business'),
          role,
        },
        include: {
          workerProfile: {
            include: {
              skills: {
                include: { skill: true },
              },
            },
          },
          business: true,
        },
      });

      // Default baseline profile creation if not present
      if (role === 'WORKER') {
        await prisma.workerProfile.create({
          data: {
            userId: user.id,
            city: 'Amritsar',
            locality: 'City Center',
            latitude: 31.6340,
            longitude: 74.8723,
            experienceYears: 1.0,
            expectedWage: 600,
            availability: 'AVAILABLE_TODAY',
          },
        });
      } else if (role === 'BUSINESS') {
        await prisma.business.create({
          data: {
            userId: user.id,
            businessName: name || 'My Local Business',
            businessType: 'General Store',
            address: 'Main Market',
            city: 'Amritsar',
            locality: 'City Center',
            latitude: 31.6340,
            longitude: 74.8723,
          },
        });
      }

      // Re-fetch with created profiles
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          workerProfile: {
            include: {
              skills: {
                include: { skill: true },
              },
            },
          },
          business: true,
        },
      });
    }

    // Simple dev session token (user ID encoded)
    const token = Buffer.from(JSON.stringify({ userId: user!.id, role: user!.role })).toString('base64');

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user!.id,
        phone: user!.phone,
        name: user!.name,
        role: user!.role,
        workerProfile: user!.workerProfile,
        business: user!.business,
      },
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to authenticate' },
      { status: 500 }
    );
  }
}
