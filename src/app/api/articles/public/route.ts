import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../../services/redis.service';

const redisService = new RedisService();

// GET /api/articles/public - Get latest 5 articles (public access, no auth required)
export async function GET(request: NextRequest) {
  try {
    // Connect to Redis
    await redisService.connect();

    // Get latest 5 articles (sorted by generation time, most recent first)
    const articles = await redisService.getAllArticles(5);

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching public articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
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
