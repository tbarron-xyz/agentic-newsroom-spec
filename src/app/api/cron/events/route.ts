import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../../services/redis.service';
import { ReporterService } from '../../../services/reporter.service';
import { AIService } from '../../../services/ai.service';

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

// GET /api/cron/events - Trigger reporter event generation job
export async function GET(_request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: REPORTER EVENT GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered event generation...`);

    await initializeServices();

    // Check if we should skip generation based on time constraints
    const editor = await redisService!.getEditor();
    const currentTime = Date.now();

    if (editor?.lastEventGenerationTime && editor?.eventGenerationPeriodMinutes) {
      const timeSinceLastGeneration = (currentTime - editor.lastEventGenerationTime) / (1000 * 60); // Convert to minutes
      const requiredInterval = editor.eventGenerationPeriodMinutes;

      if (timeSinceLastGeneration < requiredInterval) {
        const remainingMinutes = Math.ceil(requiredInterval - timeSinceLastGeneration);
        console.log(`[${new Date().toISOString()}] Skipping event generation - only ${timeSinceLastGeneration.toFixed(1)} minutes have passed since last run. Need ${requiredInterval} minutes. ${remainingMinutes} minutes remaining.`);
        console.log('Event generation cron job skipped due to time constraints\n');

        return NextResponse.json({
          success: true,
          message: `Event generation skipped - ${remainingMinutes} minutes remaining until next allowed generation.`,
          skipped: true,
          nextGenerationInMinutes: remainingMinutes
        });
      }
    }

    // Proceed with generation
    const results = await reporterService!.generateAllReporterEvents();
    const totalEvents = Object.values(results).reduce((sum, events) => sum + events.length, 0);

    // Update the last generation time
    if (editor) {
      const updatedEditor = {
        ...editor,
        lastEventGenerationTime: currentTime
      };
      await redisService!.saveEditor(updatedEditor);
      console.log(`[${new Date().toISOString()}] Updated last event generation time to ${new Date(currentTime).toISOString()}`);
    }

    console.log(`[${new Date().toISOString()}] Successfully generated ${totalEvents} events`);
    console.log('Event generation cron job completed successfully\n');

    return NextResponse.json({
      success: true,
      message: `Reporter event generation job completed successfully. Generated ${totalEvents} events.`,
      totalEvents,
      lastGenerationTime: currentTime
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Event generation cron job failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute reporter event generation job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
