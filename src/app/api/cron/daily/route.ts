import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '../../../services/service-container';

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

// GET /api/cron/daily - Trigger daily edition generation job
export async function GET(_request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: DAILY EDITION GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered daily edition generation...`);

    const container = await getContainer();
    const redis = await container.getDataStorageService();
    const editorService = await container.getEditorService();

    const currentTime = Date.now();

    // Set job as running and update last run time
    await redis.setJobRunning('daily', true);
    await redis.setJobLastRun('daily', currentTime);
    console.log(`[${new Date().toISOString()}] Set daily job running=true and last_run=${currentTime}`);

    try {
      const dailyEdition = await editorService.generateDailyEdition();

      // Mark job as completed successfully
      await redis.setJobRunning('daily', false);
      await redis.setJobLastSuccess('daily', currentTime);
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
      await redis.setJobRunning('daily', false);
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
