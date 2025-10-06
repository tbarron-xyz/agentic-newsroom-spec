import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '../../utils/redis';
import { AuthService } from '../../services/auth.service';
import { registerRequestSchema } from '../../models/schemas';

export const POST = withRedis(async (request: NextRequest, redis) => {
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

  const authService = new AuthService(redis);

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
});
