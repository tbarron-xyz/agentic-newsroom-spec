import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../utils/auth';
import { ReporterService } from '../../../services/reporter.service';
import { AIService } from '../../../services/ai.service';

// POST /api/events/generate - Generate events for all reporters (admin only)
export const POST = withAuth(async (request: NextRequest, user, redis) => {
  // Generate events for all reporters
  const aiService = new AIService();
  const reporterService = new ReporterService(redis, aiService);

  console.log('Starting event generation for all reporters...');
  const results = await reporterService.generateAllReporterEvents();

  // Flatten results to get all generated events
  const allGeneratedEvents: any[] = [];
  let totalGenerated = 0;

  for (const [reporterId, events] of Object.entries(results)) {
    console.log(`Reporter ${reporterId}: Generated ${events.length} events`);
    allGeneratedEvents.push(...events);
    totalGenerated += events.length;
  }

  console.log(`Total events generated: ${totalGenerated}`);

  return NextResponse.json({
    events: allGeneratedEvents,
    message: `Successfully generated ${totalGenerated} events across ${Object.keys(results).length} reporters`,
    totalGenerated
  });
}, { requiredRole: 'admin' });
