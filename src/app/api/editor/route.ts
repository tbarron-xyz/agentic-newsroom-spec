import { NextRequest, NextResponse } from 'next/server';
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
      messageSliceCount: editor?.messageSliceCount || 200
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
export async function PUT(request: NextRequest) {
  try {
    // Check authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const authService = await getAuthService();
    const user = await authService.getUserFromToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bio, prompt, modelName, messageSliceCount } = body;

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

    const redisService = await getRedisService();
    await redisService.saveEditor({ bio, prompt, modelName, messageSliceCount });

    return NextResponse.json({
      bio,
      prompt,
      modelName,
      messageSliceCount,
      message: 'Editor data updated successfully'
    });
  } catch (error) {
    console.error('Error updating editor data:', error);
    return NextResponse.json(
      { error: 'Failed to update editor data' },
      { status: 500 }
    );
  }
}
