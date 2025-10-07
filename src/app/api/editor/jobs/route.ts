import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../utils/auth';
import { AIService } from '../../../services/ai.service';
import { ReporterService } from '../../../services/reporter.service';
import { EditorService } from '../../../services/editor.service';
import { RedisService } from '../../../services/redis.service';



// POST /api/editor/jobs/trigger - Trigger a specific job
export const POST = withAuth(async (request: NextRequest, user, redis) => {
  const aiService = new AIService();
  const reporterService = new ReporterService(redis, aiService);
  const editorService = new EditorService(redis, aiService);

  const body = await request.json();
  const { jobType } = body;

  if (!jobType || typeof jobType !== 'string') {
    return NextResponse.json(
      { error: 'Job type is required and must be a string' },
      { status: 400 }
    );
  }

  const currentTime = Date.now();

  // Set job as running and update last run time
  await redis.setJobRunning(jobType, true);
  await redis.setJobLastRun(jobType, currentTime);

  let result;
  try {
    switch (jobType) {
      case 'reporter':
        const reporterResults = await reporterService.generateAllReporterArticles();
        const totalArticles = Object.values(reporterResults).reduce((sum, articles) => sum + articles.length, 0);
        result = { message: `Reporter article generation job triggered successfully. Generated ${totalArticles} articles.` };
        break;
      case 'newspaper':
        const edition = await editorService.generateHourlyEdition();
        result = { message: `Newspaper edition generation job triggered successfully. Created edition: ${edition.id} with ${edition.stories.length} stories.` };
        break;
      case 'daily':
        const dailyEdition = await editorService.generateDailyEdition();
        result = { message: `Daily edition generation job triggered successfully. Created daily edition: ${dailyEdition.id} with ${dailyEdition.editions.length} newspaper editions.` };
        break;
      default:
        // Mark job as not running for invalid job type
        await redis.setJobRunning(jobType, false);
        return NextResponse.json(
          { error: 'Invalid job type. Must be one of: reporter, newspaper, daily' },
          { status: 400 }
        );
    }

    // Mark job as completed successfully
    await redis.setJobRunning(jobType, false);
    await redis.setJobLastSuccess(jobType, currentTime);
  } catch (error) {
    // Mark job as not running on error (don't update last_success)
    await redis.setJobRunning(jobType, false);
    throw error; // Re-throw to be handled by outer catch
  }

  return NextResponse.json(result);
}, { requiredRole: 'admin' });

// GET /api/editor/jobs/status - Get job status and next run times
export async function GET() {
  try {
    const redis = new RedisService();
    await redis.connect();

    // Get editor config for period calculations
    const editor = await redis.getEditor();

    // Get job statuses from Redis
    const [reporterRunning, newspaperRunning, dailyRunning] = await Promise.all([
      redis.getJobRunning('reporter'),
      redis.getJobRunning('newspaper'),
      redis.getJobRunning('daily')
    ]);

    // Get last run times from Redis
    const [reporterLastRun, newspaperLastRun, dailyLastRun] = await Promise.all([
      redis.getJobLastRun('reporter'),
      redis.getJobLastRun('newspaper'),
      redis.getJobLastRun('daily')
    ]);

    // Calculate next run times based on last run + period
    const calculateNextRun = (lastRun: number | null, periodMinutes: number): Date | null => {
      if (!lastRun || !periodMinutes) return null;
      return new Date(lastRun + (periodMinutes * 60 * 1000));
    };

    const status = {
      status: {
        reporterJob: reporterRunning,
        newspaperJob: newspaperRunning,
        dailyJob: dailyRunning
      },
      lastRuns: {
        reporterJob: reporterLastRun ? new Date(reporterLastRun) : null,
        newspaperJob: newspaperLastRun ? new Date(newspaperLastRun) : null,
        dailyJob: dailyLastRun ? new Date(dailyLastRun) : null
      },
      nextRuns: {
        reporterJob: calculateNextRun(reporterLastRun, editor?.articleGenerationPeriodMinutes || 15),
        newspaperJob: calculateNextRun(newspaperLastRun, 60), // 1 hour for newspaper editions
        dailyJob: calculateNextRun(dailyLastRun, 1440) // 24 hours for daily editions
      }
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}
