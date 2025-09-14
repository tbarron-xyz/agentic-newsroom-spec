import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../../services/redis.service';
import { ReporterService } from '../../../services/reporter.service';
import { AIService } from '../../../services/ai.service';
import { AuthService } from '../../../services/auth.service';

let redisService: RedisService | null = null;
let reporterService: ReporterService | null = null;
let aiService: AIService | null = null;
let authService: AuthService | null = null;

async function initializeServices(): Promise<void> {
  if (!redisService) {
    redisService = new RedisService();
    await redisService.connect();
  }
  if (!aiService) {
    aiService = new AIService();
  }
  if (!authService) {
    authService = new AuthService(redisService);
  }
  if (!reporterService) {
    reporterService = new ReporterService(redisService, aiService);
  }
}

// POST /api/events/generate - Generate events for all reporters (admin only)
export async function POST(request: NextRequest) {
  try {
    await initializeServices();

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token and get user
    const user = await authService!.getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Generate events for all reporters
    console.log('Starting event generation for all reporters...');
    const results = await reporterService!.generateAllReporterEvents();

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
  } catch (error) {
    console.error('Error generating events:', error);
    return NextResponse.json(
      { error: 'Failed to generate events' },
      { status: 500 }
    );
  } finally {
    try {
      if (redisService) {
        await redisService.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }
}
