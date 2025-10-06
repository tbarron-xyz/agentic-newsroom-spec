import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '../../../utils/redis';

export const GET = withRedis(async (
  request: NextRequest,
  redis,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: articleId } = await context.params;

  if (!articleId) {
    return NextResponse.json(
      { error: 'Article ID is required' },
      { status: 400 }
    );
  }

  const article = await redis.getArticle(articleId);

  if (!article) {
    return NextResponse.json(
      { error: 'Article not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(article);
});
