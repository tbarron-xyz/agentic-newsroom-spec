import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../services/redis.service';
import { ReporterService } from '../../services/reporter.service';
import { AIService } from '../../services/ai.service';
import { AuthService } from '../../services/auth.service';
import { AbilitiesService } from '../../services/abilities.service';

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

// GET /api/reporters - Get all reporters (read-only access for all authenticated users)
export async function GET(request: NextRequest) {
  try {
    await initializeServices();

    // Basic authentication check (allow viewing for all authenticated users)
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
