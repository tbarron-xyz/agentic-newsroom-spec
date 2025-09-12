import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../../services/redis.service';
import { AuthService } from '../../../services/auth.service';
import { AbilitiesService } from '../../../services/abilities.service';

const redisService = new RedisService();
const authService = new AuthService(redisService);
const abilitiesService = new AbilitiesService();

// GET /api/articles/all - Get all articles (requires Reader permission)
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
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
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user has Reader permission
    const hasReader = abilitiesService.userIsReader(user);
    if (!hasReader) {
      return NextResponse.json(
        { error: 'Reader permission required' },
        { status: 403 }
      );
    }

    // Parse and validate results parameter
    const { searchParams } = new URL(request.url);
    const resultsParam = searchParams.get('results');
    let limit = 100; // default
    if (resultsParam) {
      const parsed = parseInt(resultsParam, 10);
      if (isNaN(parsed) || parsed <= 0) {
        return NextResponse.json(
          { error: 'results parameter must be a positive integer' },
          { status: 400 }
        );
      }
      limit = parsed;
    }

    // Get all articles with limit
    const articles = await redisService.getAllArticles(limit);

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching all articles:', error);
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
