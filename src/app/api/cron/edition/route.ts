import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '../../../services/service-container';

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

// GET /api/cron/edition - Trigger hourly edition generation job
export async function GET(_request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: HOURLY EDITION GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered hourly edition generation...`);

    const container = await getContainer();
    const redis = await container.getDataStorageService();
    const editorService = await container.getEditorService();

    const currentTime = Date.now();

    // Set job as running and update last run time
    await redis.setJobRunning('newspaper', true);
    await redis.setJobLastRun('newspaper', currentTime);
    console.log(`[${new Date().toISOString()}] Set newspaper job running=true and last_run=${currentTime}`);

    try {
      const hourlyEdition = await editorService.generateHourlyEdition();

      // Mark job as completed successfully
      await redis.setJobRunning('newspaper', false);
      await redis.setJobLastSuccess('newspaper', currentTime);
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
      await redis.setJobRunning('newspaper', false);
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
