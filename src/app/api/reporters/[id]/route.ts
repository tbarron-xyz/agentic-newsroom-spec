import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../../services/redis.service';
import { ReporterService } from '../../../services/reporter.service';
import { AIService } from '../../../services/ai.service';
import { AuthService } from '../../../services/auth.service';
import { AbilitiesService } from '../../../services/abilities.service';

let redisService: RedisService | null = null;
let reporterService: ReporterService | null = null;
let aiService: AIService | null = null;
let authService: AuthService | null = null;
let abilitiesService: AbilitiesService | null = null;

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
  if (!abilitiesService) {
    abilitiesService = new AbilitiesService();
  }
  if (!reporterService) {
    reporterService = new ReporterService(redisService, aiService);
  }
}

async function checkReporterPermission(request: NextRequest): Promise<{ user: any } | NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authorization token required' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  const user = await authService!.getUserFromToken(token);
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  if (!abilitiesService!.userIsReporter(user)) {
    return NextResponse.json(
      { error: 'Reporter permission required' },
      { status: 403 }
    );
  }

  return { user };
}

// GET /api/reporters/[id] - Get specific reporter (public read-only access)
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
    await initializeServices();

    // Check if user has reporter permission
    const permissionCheck = await checkReporterPermission(request);
    if (permissionCheck instanceof NextResponse) {
      return permissionCheck;
    }

    const body = await request.json();
    const { beats, prompt } = body;

    if (!Array.isArray(beats) || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Beats must be an array and prompt must be a string' },
        { status: 400 }
      );
    }

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

    // Check if user has reporter permission
    const permissionCheck = await checkReporterPermission(request);
    if (permissionCheck instanceof NextResponse) {
      return permissionCheck;
    }

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
