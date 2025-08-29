import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { message: 'Password is required' },
        { status: 400 }
      );
    }

    const adminPassword = process.env.NEWSROOM_ADMIN_PASS;

    if (!adminPassword) {
      console.error('NEWSROOM_ADMIN_PASS environment variable is not set');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (password === adminPassword) {
      // Successful login
      return NextResponse.json(
        { message: 'Login successful' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
