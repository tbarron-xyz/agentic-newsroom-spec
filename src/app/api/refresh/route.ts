import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../services/redis.service';
import { AuthService } from '../../services/auth.service';

const redisService = new RedisService();
const authService = new AuthService(redisService);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Connect to Redis
    await redisService.connect();

    // Refresh the access token
    const newTokens = await authService.refreshAccessToken(refreshToken);
    if (!newTokens) {
      return NextResponse.json(
        { message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Return new tokens
    return NextResponse.json(
      {
        message: 'Token refreshed successfully',
        tokens: newTokens
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token refresh error:', error);
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
