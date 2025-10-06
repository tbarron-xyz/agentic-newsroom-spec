import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '../../../utils/redis';

// GET /api/articles/public - Get latest 5 articles (public access, no auth required)
export const GET = withRedis(async (_request: NextRequest, redis) => {
  // Get latest 5 articles (sorted by generation time, most recent first)
  const articles = await redis.getAllArticles(5);

  return NextResponse.json(articles);
});
