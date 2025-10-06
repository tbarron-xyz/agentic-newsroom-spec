import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../utils/auth';
import { ReporterService } from '../../../../services/reporter.service';
import { AIService } from '../../../../services/ai.service';
import { RedisService } from '../../../../services/redis.service';
import { AuthService } from '../../../../services/auth.service';
import { AbilitiesService } from '../../../../services/abilities.service';

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

async function checkEditorPermission(request: NextRequest): Promise<{ user: any } | NextResponse> {
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

  if (!abilitiesService!.userIsEditor(user)) {
    return NextResponse.json(
      { error: 'Editor permission required' },
      { status: 403 }
    );
  }

  return { user };
}

// POST /api/reporters/[id]/toggle - Toggle reporter enabled status
export const POST = withAuth(async (
  request: NextRequest,
  user,
  redis,
  context
) => {
  const { id: reporterId } = await context.params;

  const aiService = new AIService();
  const reporterService = new ReporterService(redis, aiService);

  // Get current reporter
  const reporter = await redis.getReporter(reporterId);
  if (!reporter) {
    return NextResponse.json(
      { error: 'Reporter not found' },
      { status: 404 }
    );
  }

  // Toggle the enabled status
  const newEnabledStatus = !reporter.enabled;
  const updatedReporter = await reporterService.updateReporter(reporterId, { enabled: newEnabledStatus });

  if (!updatedReporter) {
    return NextResponse.json(
      { error: 'Failed to update reporter' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ...updatedReporter,
    message: `Reporter ${newEnabledStatus ? 'enabled' : 'disabled'} successfully`
  });
}, { requiredPermission: 'editor' });
