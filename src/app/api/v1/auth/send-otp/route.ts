import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid 10-digit phone number' },
        { status: 400 }
      );
    }

    // In V1 pilot / prototype mode, OTP is fixed to 1234 for instant zero-friction testing
    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to ${phone}`,
      dev_otp: '1234',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
