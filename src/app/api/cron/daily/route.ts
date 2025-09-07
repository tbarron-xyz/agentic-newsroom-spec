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
export async function GET(request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: DAILY EDITION GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered daily edition generation...`);

    await initializeServices();

    const dailyEdition = await editorService!.generateDailyEdition();

    console.log(`[${new Date().toISOString()}] Successfully generated daily edition ${dailyEdition.id}`);
    console.log('Cron job completed successfully\n');

    return NextResponse.json({
      success: true,
      message: `Daily edition generation job completed successfully. Generated edition ${dailyEdition.id}.`,
      dailyEditionId: dailyEdition.id
    });
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
