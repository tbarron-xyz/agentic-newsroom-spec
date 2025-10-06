import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../utils/auth';
import { AIService } from '../../../services/ai.service';
import { ReporterService } from '../../../services/reporter.service';
import { EditorService } from '../../../services/editor.service';



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

  let result;
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
      return NextResponse.json(
        { error: 'Invalid job type. Must be one of: reporter, newspaper, daily' },
        { status: 400 }
      );
  }

  return NextResponse.json(result);
}, { requiredRole: 'admin' });

// GET /api/editor/jobs/status - Get job status and next run times
export async function GET() {
  try {
    // For now, return mock status since we don't have access to the actual scheduler
    const mockStatus = {
      status: {
        reporterJob: false,
        newspaperJob: false,
        dailyJob: false
      },
      nextRuns: {
        reporterJob: null,
        newspaperJob: null,
        dailyJob: null
      },
      note: 'Status information requires scheduler to be running. Use manual triggers to run jobs on demand.'
    };

    return NextResponse.json(mockStatus);
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}
