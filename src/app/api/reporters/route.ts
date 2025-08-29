import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../services/redis.service';
import { ReporterService } from '../../services/reporter.service';
import { AIService } from '../../services/ai.service';

let redisService: RedisService | null = null;
let reporterService: ReporterService | null = null;
let aiService: AIService | null = null;

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

// GET /api/reporters - Get all reporters
export async function GET() {
  try {
    await initializeServices();
    const reporters = await redisService!.getAllReporters();
    return NextResponse.json(reporters);
  } catch (error) {
    console.error('Error fetching reporters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reporters' },
      { status: 500 }
    );
  }
}

// POST /api/reporters - Create new reporter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { beats, prompt } = body;

    if (!Array.isArray(beats) || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Beats must be an array and prompt must be a string' },
        { status: 400 }
      );
    }

    await initializeServices();
    const reporter = await reporterService!.createReporter({ beats, prompt });

    return NextResponse.json({
      ...reporter,
      message: 'Reporter created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating reporter:', error);
    return NextResponse.json(
      { error: 'Failed to create reporter' },
      { status: 500 }
    );
  }
}
