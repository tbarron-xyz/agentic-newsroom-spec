import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../../services/redis.service';
import { AIService } from '../../../services/ai.service';
import { EditorService } from '../../../services/editor.service';

let redisService: RedisService | null = null;
let aiService: AIService | null = null;
let editorService: EditorService | null = null;

async function initializeServices(): Promise<void> {
  if (!redisService) {
    redisService = new RedisService();
    await redisService.connect();
  }
  if (!aiService) {
    aiService = new AIService();
  }
  if (!editorService) {
    editorService = new EditorService(redisService, aiService);
  }
}

// GET /api/cron/edition - Trigger hourly edition generation job
export async function GET(_request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: HOURLY EDITION GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered hourly edition generation...`);

    await initializeServices();

    const currentTime = Date.now();

    // Set job as running and update last run time
    await redisService!.setJobRunning('newspaper', true);
    await redisService!.setJobLastRun('newspaper', currentTime);
    console.log(`[${new Date().toISOString()}] Set newspaper job running=true and last_run=${currentTime}`);

    try {
      const hourlyEdition = await editorService!.generateHourlyEdition();

      // Mark job as completed successfully
      await redisService!.setJobRunning('newspaper', false);
      await redisService!.setJobLastSuccess('newspaper', currentTime);
      console.log(`[${new Date().toISOString()}] Set newspaper job running=false and last_success=${currentTime}`);

      console.log(`[${new Date().toISOString()}] Successfully generated hourly edition ${hourlyEdition.id}`);
      console.log('Cron job completed successfully\n');

      return NextResponse.json({
        success: true,
        message: `hourly edition generation job completed successfully. Generated edition ${hourlyEdition.id}.`,
        hourlyEditionId: hourlyEdition.id
      });
    } catch (error) {
      // Mark job as not running on error (don't update last_success)
      await redisService!.setJobRunning('newspaper', false);
      console.log(`[${new Date().toISOString()}] Set newspaper job running=false due to error`);
      throw error; // Re-throw to be handled by outer catch
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cron job failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute hourly edition generation job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
