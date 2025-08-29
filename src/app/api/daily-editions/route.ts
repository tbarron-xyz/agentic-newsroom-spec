import { NextResponse } from 'next/server';
import { RedisService } from '../../services/redis.service';

let redisService: RedisService | null = null;

async function getRedisService(): Promise<RedisService> {
  if (!redisService) {
    redisService = new RedisService();
    await redisService.connect();
  }
  return redisService;
}

// GET /api/daily-editions - Get all daily editions
export async function GET() {
  try {
    const redisService = await getRedisService();
    const dailyEditions = await redisService.getDailyEditions();
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
