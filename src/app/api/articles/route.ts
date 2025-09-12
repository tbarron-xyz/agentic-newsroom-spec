import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../services/redis.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reporterId = searchParams.get('reporterId');
    const resultsParam = searchParams.get('results');

    if (!reporterId) {
      return NextResponse.json(
        { error: 'reporterId query parameter is required' },
        { status: 400 }
      );
    }

    // Parse and validate results parameter
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

    const redis = new RedisService();
    await redis.connect();

    try {
      // Get articles for this reporter with limit
      const articles = await redis.getArticlesByReporter(reporterId, limit);

      return NextResponse.json(articles);
    } finally {
      await redis.disconnect();
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
