import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '../../utils/redis';

// GET /api/editions - Get all newspaper editions with full article data
export const GET = withRedis(async (_request: NextRequest, redis) => {
  const editions = await redis.getNewspaperEditions();

  // Fetch full article data for each edition
  const editionsWithArticles = await Promise.all(
    editions.map(async (edition) => {
      const articles = await Promise.all(
        edition.stories.map(async (storyId) => {
          const article = await redis.getArticle(storyId);
          return article;
        })
      );

      // Filter out null articles (in case some are missing)
      const validArticles = articles.filter(article => article !== null);

      return {
        ...edition,
        stories: validArticles
      };
    })
  );

  return NextResponse.json(editionsWithArticles);
});

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
