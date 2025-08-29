import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../services/redis.service';

let redisService: RedisService | null = null;

async function getRedisService(): Promise<RedisService> {
  if (!redisService) {
    redisService = new RedisService();
    await redisService.connect();
  }
  return redisService;
}

// GET /api/editions - Get all newspaper editions
export async function GET() {
  try {
    const redisService = await getRedisService();
    const editions = await redisService.getNewspaperEditions();
    return NextResponse.json(editions);
  } catch (error) {
    console.error('Error fetching newspaper editions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newspaper editions' },
      { status: 500 }
    );
  }
}

// POST /api/editions - Generate a new newspaper edition (placeholder for now)
export async function POST() {
  try {
    // For now, return a message that this feature is not yet implemented
    // In a full implementation, this would call the EditorService to generate a new edition
    return NextResponse.json(
      { error: 'Newspaper edition generation not yet implemented in API' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error generating newspaper edition:', error);
    return NextResponse.json(
      { error: 'Failed to generate newspaper edition' },
      { status: 500 }
    );
  }
}
