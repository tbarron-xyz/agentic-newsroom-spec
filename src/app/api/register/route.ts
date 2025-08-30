import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../services/redis.service';
import { AuthService } from '../../services/auth.service';
import { registerRequestSchema } from '../../models/schemas';

const redisService = new RedisService();
const authService = new AuthService(redisService);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = registerRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Connect to Redis
    await redisService.connect();

    // Register user
    const user = await authService.registerUser(email, password);

    // Generate tokens for immediate login
    const tokens = authService.generateTokens(user);

    // Return success response
    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        tokens
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof Error && error.message === 'User with this email already exists') {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    try {
      await redisService.disconnect();
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }
}
