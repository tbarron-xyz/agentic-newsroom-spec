import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../services/redis.service';

let redisService: RedisService | null = null;

async function getRedisService(): Promise<RedisService> {
  if (!redisService) {
    redisService = new RedisService();
    await redisService.connect();
  }
  return redisService;
}

// GET /api/editor - Get current editor data
export async function GET() {
  try {
    const redisService = await getRedisService();
    const editor = await redisService.getEditor();

    return NextResponse.json({
      bio: editor?.bio || '',
      prompt: editor?.prompt || ''
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
    const body = await request.json();
    const { bio, prompt } = body;

    if (typeof bio !== 'string' || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Bio and prompt must be strings' },
        { status: 400 }
      );
    }

    const redisService = await getRedisService();
    await redisService.saveEditor({ bio, prompt });

    return NextResponse.json({
      bio,
      prompt,
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
