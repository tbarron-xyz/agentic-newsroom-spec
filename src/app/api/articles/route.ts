import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../services/redis.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reporterId = searchParams.get('reporterId');

    if (!reporterId) {
      return NextResponse.json(
        { error: 'reporterId query parameter is required' },
        { status: 400 }
      );
    }

    const redis = new RedisService();
    await redis.connect();

    try {
      // Get all articles for this reporter
      const articles = await redis.getArticlesByReporter(reporterId);

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
