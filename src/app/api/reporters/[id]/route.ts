import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../../services/redis.service';
import { ReporterService } from '../../../services/reporter.service';
import { AIService } from '../../../services/ai.service';

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

// GET /api/reporters/[id] - Get specific reporter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reporterId } = await params;
    await initializeServices();

    const reporter = await redisService!.getReporter(reporterId);
    if (!reporter) {
      return NextResponse.json(
        { error: 'Reporter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reporter);
  } catch (error) {
    console.error('Error fetching reporter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reporter' },
      { status: 500 }
    );
  }
}

// PUT /api/reporters/[id] - Update specific reporter
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reporterId } = await params;
    const body = await request.json();
    const { beats, prompt } = body;

    if (!Array.isArray(beats) || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Beats must be an array and prompt must be a string' },
        { status: 400 }
      );
    }

    await initializeServices();
    const updatedReporter = await reporterService!.updateReporter(reporterId, { beats, prompt });

    if (!updatedReporter) {
      return NextResponse.json(
        { error: 'Reporter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...updatedReporter,
      message: 'Reporter updated successfully'
    });
  } catch (error) {
    console.error('Error updating reporter:', error);
    return NextResponse.json(
      { error: 'Failed to update reporter' },
      { status: 500 }
    );
  }
}

// DELETE /api/reporters/[id] - Delete specific reporter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reporterId } = await params;
    await initializeServices();

    const success = await reporterService!.deleteReporter(reporterId);
    if (!success) {
      return NextResponse.json(
        { error: 'Reporter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Reporter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reporter:', error);
    return NextResponse.json(
      { error: 'Failed to delete reporter' },
      { status: 500 }
    );
  }
}
