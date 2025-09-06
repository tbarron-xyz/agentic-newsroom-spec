import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../../services/redis.service';
import { AuthService } from '../../../services/auth.service';
import { AbilitiesService } from '../../../services/abilities.service';

const redisService = new RedisService();
const authService = new AuthService(redisService);
const abilitiesService = new AbilitiesService();

// GET /api/abilities/editor - Check if logged in user has Editor permission
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Connect to Redis
    await redisService.connect();

    // Verify token and get user
    const user = await authService.getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user has Editor permission
    const hasEditor = abilitiesService.userIsEditor(user);

    // Return result
    return NextResponse.json({ hasEditor });
  } catch (error) {
    console.error('Abilities check error:', error);
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
