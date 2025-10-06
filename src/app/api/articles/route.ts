import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '../../utils/redis';

export const GET = withRedis(async (request: NextRequest, redis) => {
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

  // Get articles for this reporter with limit
  const articles = await redis.getArticlesByReporter(reporterId, limit);

  return NextResponse.json(articles);
});
