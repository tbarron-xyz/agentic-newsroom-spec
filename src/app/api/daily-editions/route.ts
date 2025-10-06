import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '../../utils/redis';
import { AuthService } from '../../services/auth.service';
import { AbilitiesService } from '../../services/abilities.service';

// GET /api/daily-editions - Get daily editions (limited for non-Reader users)
export const GET = withRedis(async (request: NextRequest, redis) => {
  // Check authentication and Reader ability
  let hasReaderAccess = false;
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const authService = new AuthService(redis);
    const user = await authService.getUserFromToken(token);

    if (user) {
      const abilitiesService = new AbilitiesService();
      hasReaderAccess = abilitiesService.userIsReader(user);
    }
  }

  // If user is not authenticated or doesn't have Reader ability, limit to 3 results
  const limit = hasReaderAccess ? undefined : 3;
  const dailyEditions = await redis.getDailyEditions(limit);

  return NextResponse.json(dailyEditions);
});

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
