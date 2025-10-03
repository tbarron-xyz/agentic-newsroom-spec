import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../../services/redis.service';

const redisService = new RedisService();

// GET /api/events/public - Get latest 12 events sorted by updated time (public access, no auth required)
export async function GET(request: NextRequest) {
  try {
    // Connect to Redis
    await redisService.connect();

    // Get latest 12 events sorted by updated time (most recent first)
    const events = await redisService.getLatestUpdatedEvents(12);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching public events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
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