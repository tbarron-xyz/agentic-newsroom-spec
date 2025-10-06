import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../utils/auth';
import { RedisService } from '../../services/redis.service';
import { AuthService } from '../../services/auth.service';

let redisService: RedisService | null = null;
let authService: AuthService | null = null;

async function getRedisService(): Promise<RedisService> {
  if (!redisService) {
    redisService = new RedisService();
    await redisService.connect();
  }
  return redisService;
}

async function getAuthService(): Promise<AuthService> {
  if (!authService) {
    const redis = await getRedisService();
    authService = new AuthService(redis);
  }
  return authService;
}

// GET /api/editor - Get current editor data
export async function GET() {
  try {
    const redisService = await getRedisService();
    const editor = await redisService.getEditor();

    return NextResponse.json({
      bio: editor?.bio || '',
      prompt: editor?.prompt || '',
      modelName: editor?.modelName || 'gpt-5-nano',
      messageSliceCount: editor?.messageSliceCount || 200,
      articleGenerationPeriodMinutes: editor?.articleGenerationPeriodMinutes || 15,
      lastArticleGenerationTime: editor?.lastArticleGenerationTime || null,
      eventGenerationPeriodMinutes: editor?.eventGenerationPeriodMinutes || 30,
      lastEventGenerationTime: editor?.lastEventGenerationTime || null
    });
  } catch (error) {
    console.error('Error fetching editor data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch editor data' },
      { status: 500 }
    );
  }
}

// PUT /api/editor - Update editor data
export const PUT = withAuth(async (request: NextRequest, user, redis) => {
  const body = await request.json();
  const { bio, prompt, modelName, messageSliceCount, articleGenerationPeriodMinutes, eventGenerationPeriodMinutes } = body;

  if (typeof bio !== 'string' || typeof prompt !== 'string' || typeof modelName !== 'string') {
    return NextResponse.json(
      { error: 'Bio, prompt, and modelName must be strings' },
      { status: 400 }
    );
  }

  if (typeof messageSliceCount !== 'number' || messageSliceCount < 1 || messageSliceCount > 1000) {
    return NextResponse.json(
      { error: 'messageSliceCount must be a number between 1 and 1000' },
      { status: 400 }
    );
  }

  if (typeof articleGenerationPeriodMinutes !== 'number' || articleGenerationPeriodMinutes < 1 || articleGenerationPeriodMinutes > 1440) {
    return NextResponse.json(
      { error: 'articleGenerationPeriodMinutes must be a number between 1 and 1440' },
      { status: 400 }
    );
  }

  if (typeof eventGenerationPeriodMinutes !== 'number' || eventGenerationPeriodMinutes < 1 || eventGenerationPeriodMinutes > 1440) {
    return NextResponse.json(
      { error: 'eventGenerationPeriodMinutes must be a number between 1 and 1440' },
      { status: 400 }
    );
  }

  await redis.saveEditor({
    bio,
    prompt,
    modelName,
    messageSliceCount,
    articleGenerationPeriodMinutes,
    eventGenerationPeriodMinutes
  });

  return NextResponse.json({
    bio,
    prompt,
    modelName,
    messageSliceCount,
    articleGenerationPeriodMinutes,
    eventGenerationPeriodMinutes,
    message: 'Editor data updated successfully'
  });
}, { requiredRole: 'admin' });
