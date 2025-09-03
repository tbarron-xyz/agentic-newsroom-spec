import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../../services/redis.service';
import { AIService } from '../../../services/ai.service';
import { ReporterService } from '../../../services/reporter.service';

let redisService: RedisService | null = null;
let aiService: AIService | null = null;
let reporterService: ReporterService | null = null;

async function initializeServices(): Promise<void> {
  if (!redisService) {
    redisService = new RedisService();
    await redisService.connect();
  }
  if (!aiService) {
    aiService = new AIService();
  }
  if (!reporterService) {
    reporterService = new ReporterService(redisService, aiService);
  }
}

// GET /api/cron/15mins - Trigger reporter article generation job
export async function GET(request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: REPORTER ARTICLE GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered article generation...`);

    await initializeServices();

    const results = await reporterService!.generateAllReporterArticles();
    const totalArticles = Object.values(results).reduce((sum, articles) => sum + articles.length, 0);

    console.log(`[${new Date().toISOString()}] Successfully generated ${totalArticles} articles`);
    console.log('Cron job completed successfully\n');

    return NextResponse.json({
      success: true,
      message: `Reporter article generation job completed successfully. Generated ${totalArticles} articles.`,
      totalArticles
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cron job failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute reporter article generation job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
