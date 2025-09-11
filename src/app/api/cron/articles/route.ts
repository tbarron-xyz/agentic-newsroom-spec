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

// GET /api/cron/articles - Trigger reporter article generation job
export async function GET(_request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: REPORTER ARTICLE GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered article generation...`);

    await initializeServices();

    // Check if we should skip generation based on time constraints
    const editor = await redisService!.getEditor();
    const currentTime = Date.now();

    if (editor?.lastArticleGenerationTime && editor?.articleGenerationPeriodMinutes) {
      const timeSinceLastGeneration = (currentTime - editor.lastArticleGenerationTime) / (1000 * 60); // Convert to minutes
      const requiredInterval = editor.articleGenerationPeriodMinutes;

      if (timeSinceLastGeneration < requiredInterval) {
        const remainingMinutes = Math.ceil(requiredInterval - timeSinceLastGeneration);
        console.log(`[${new Date().toISOString()}] Skipping generation - only ${timeSinceLastGeneration.toFixed(1)} minutes have passed since last run. Need ${requiredInterval} minutes. ${remainingMinutes} minutes remaining.`);
        console.log('Cron job skipped due to time constraints\n');

        return NextResponse.json({
          success: true,
          message: `Article generation skipped - ${remainingMinutes} minutes remaining until next allowed generation.`,
          skipped: true,
          nextGenerationInMinutes: remainingMinutes
        });
      }
    }

    // Proceed with generation
    const results = await reporterService!.generateAllReporterArticles();
    const totalArticles = Object.values(results).reduce((sum, articles) => sum + articles.length, 0);

    // Update the last generation time
    if (editor) {
      const updatedEditor = {
        ...editor,
        lastArticleGenerationTime: currentTime
      };
      await redisService!.saveEditor(updatedEditor);
      console.log(`[${new Date().toISOString()}] Updated last generation time to ${new Date(currentTime).toISOString()}`);
    }

    console.log(`[${new Date().toISOString()}] Successfully generated ${totalArticles} articles`);
    console.log('Cron job completed successfully\n');

    return NextResponse.json({
      success: true,
      message: `Reporter article generation job completed successfully. Generated ${totalArticles} articles.`,
      totalArticles,
      lastGenerationTime: currentTime
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
