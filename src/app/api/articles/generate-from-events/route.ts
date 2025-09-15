import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../../services/redis.service';
import { ReporterService } from '../../../services/reporter.service';
import { AIService } from '../../../services/ai.service';
import { AuthService } from '../../../services/auth.service';

const redisService = new RedisService();
const authService = new AuthService(redisService);

// POST /api/articles/generate-from-events - Manually trigger article generation from events
export async function POST(request: NextRequest) {
  await redisService.connect();
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

    // Verify token and get user
    const user = await authService.getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log(`[${new Date().toISOString()}] Manual article generation from events triggered by user ${user.id}`);

    // Initialize services
    const aiService = new AIService();
    const reporterService = new ReporterService(redisService, aiService);

    // Generate articles from events
    const results = await reporterService.generateArticlesFromEvents();
    const totalArticles = Object.values(results).reduce((sum, articles) => sum + articles.length, 0);

    console.log(`[${new Date().toISOString()}] Manual article generation from events completed - generated ${totalArticles} articles`);

    return NextResponse.json({
      success: true,
      message: `Article generation from events completed successfully. Generated ${totalArticles} articles.`,
      totalArticles,
      results
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Manual article generation from events failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate articles from events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
