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

// GET /api/cron/daily - Trigger daily edition generation job
export async function GET(_request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: DAILY EDITION GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered daily edition generation...`);

    await initializeServices();

    const currentTime = Date.now();

    // Set job as running and update last run time
    await redisService!.setJobRunning('daily', true);
    await redisService!.setJobLastRun('daily', currentTime);
    console.log(`[${new Date().toISOString()}] Set daily job running=true and last_run=${currentTime}`);

    try {
      const dailyEdition = await editorService!.generateDailyEdition();

      // Mark job as completed successfully
      await redisService!.setJobRunning('daily', false);
      await redisService!.setJobLastSuccess('daily', currentTime);
      console.log(`[${new Date().toISOString()}] Set daily job running=false and last_success=${currentTime}`);

      console.log(`[${new Date().toISOString()}] Successfully generated daily edition ${dailyEdition.id}`);
      console.log('Cron job completed successfully\n');

      return NextResponse.json({
        success: true,
        message: `Daily edition generation job completed successfully. Generated edition ${dailyEdition.id}.`,
        dailyEditionId: dailyEdition.id
      });
    } catch (error) {
      // Mark job as not running on error (don't update last_success)
      await redisService!.setJobRunning('daily', false);
      console.log(`[${new Date().toISOString()}] Set daily job running=false due to error`);
      throw error; // Re-throw to be handled by outer catch
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cron job failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute daily edition generation job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
