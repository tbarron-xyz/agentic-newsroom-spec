import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '../../../services/service-container';

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

// GET /api/cron/articles-from-events - Trigger reporter article generation from events job
export async function GET(_request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: REPORTER ARTICLES FROM EVENTS GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered article generation from events...`);

    const container = await getContainer();
    const redis = await container.getDataStorageService();
    const reporterService = await container.getReporterService();

    // Check if we should skip generation based on time constraints
    const editor = await redis.getEditor();
    const currentTime = Date.now();

    if (editor?.lastArticleGenerationTime && editor?.articleGenerationPeriodMinutes) {
      const timeSinceLastGeneration = (currentTime - editor.lastArticleGenerationTime) / (1000 * 60); // Convert to minutes
      const requiredInterval = editor.articleGenerationPeriodMinutes;

      if (timeSinceLastGeneration < requiredInterval) {
        const remainingMinutes = Math.ceil(requiredInterval - timeSinceLastGeneration);
        console.log(`[${new Date().toISOString()}] Skipping article generation from events - only ${timeSinceLastGeneration.toFixed(1)} minutes have passed since last run. Need ${requiredInterval} minutes. ${remainingMinutes} minutes remaining.`);
        console.log('Article generation from events cron job skipped due to time constraints\n');

        return NextResponse.json({
          success: true,
          message: `Article generation from events skipped - ${remainingMinutes} minutes remaining until next allowed generation.`,
          skipped: true,
          nextGenerationInMinutes: remainingMinutes
        });
      }
    }

    // Proceed with generation
    const results = await reporterService.generateArticlesFromEvents();
    const totalArticles = Object.values(results).reduce((sum, articles) => sum + articles.length, 0);

    // Update the last generation time
    if (editor) {
      const updatedEditor = {
        ...editor,
        lastArticleGenerationTime: currentTime
      };
      await redis.saveEditor(updatedEditor);
      console.log(`[${new Date().toISOString()}] Updated last article generation time to ${new Date(currentTime).toISOString()}`);
    }

    console.log(`[${new Date().toISOString()}] Successfully generated ${totalArticles} articles from events`);
    console.log('Article generation from events cron job completed successfully\n');

    return NextResponse.json({
      success: true,
      message: `Reporter article generation from events job completed successfully. Generated ${totalArticles} articles.`,
      totalArticles,
      lastGenerationTime: currentTime
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Article generation from events cron job failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute reporter article generation from events job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
