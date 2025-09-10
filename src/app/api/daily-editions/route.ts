import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../services/redis.service';
import { AuthService } from '../../services/auth.service';
import { AbilitiesService } from '../../services/abilities.service';

let redisService: RedisService | null = null;
let authService: AuthService | null = null;
let abilitiesService: AbilitiesService | null = null;

async function getRedisService(): Promise<RedisService> {
  if (!redisService) {
    redisService = new RedisService();
    await redisService.connect();
  }
  return redisService;
}

async function getAuthService(): Promise<AuthService> {
  if (!authService) {
    const redis = await getRedisService();
    authService = new AuthService(redis);
  }
  return authService;
}

async function getAbilitiesService(): Promise<AbilitiesService> {
  if (!abilitiesService) {
    abilitiesService = new AbilitiesService();
  }
  return abilitiesService;
}

// GET /api/daily-editions - Get daily editions (limited for non-Reader users)
export async function GET(request: NextRequest) {
  try {
    const redisService = await getRedisService();

    // Check authentication and Reader ability
    let hasReaderAccess = false;
    const authHeader = request.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const authService = await getAuthService();
      const user = await authService.getUserFromToken(token);

      if (user) {
        const abilitiesService = await getAbilitiesService();
        hasReaderAccess = abilitiesService.userIsReader(user);
      }
    }

    // If user is not authenticated or doesn't have Reader ability, limit to 3 results
    const limit = hasReaderAccess ? undefined : 3;
    const dailyEditions = await redisService.getDailyEditions(limit);

    return NextResponse.json(dailyEditions);
  } catch (error) {
    console.error('Error fetching daily editions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily editions' },
      { status: 500 }
    );
  }
}

// POST /api/daily-editions - Generate a new daily edition (placeholder for now)
export async function POST() {
  try {
    // For now, return a message that this feature is not yet implemented
    // In a full implementation, this would call the AI service to generate a new daily edition
    return NextResponse.json(
      { error: 'Daily edition generation not yet implemented in API' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error generating daily edition:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily edition' },
      { status: 500 }
    );
  }
}
