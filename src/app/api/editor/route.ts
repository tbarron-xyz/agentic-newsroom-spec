import { NextRequest, NextResponse } from 'next/server';
import { createClient, RedisClientType } from 'redis';

const REDIS_KEYS = {
  EDITOR_BIO: 'editor:bio',
  EDITOR_PROMPT: 'editor:prompt',
} as const;

let redisClient: RedisClientType | null = null;

async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({
      url: 'redis://localhost:6379',
    });

    redisClient.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
  }
  return redisClient;
}

// GET /api/editor - Get current editor data
export async function GET() {
  try {
    const client = await getRedisClient();
    const [bio, prompt] = await Promise.all([
      client.get(REDIS_KEYS.EDITOR_BIO),
      client.get(REDIS_KEYS.EDITOR_PROMPT)
    ]);

    return NextResponse.json({
      bio: bio || '',
      prompt: prompt || ''
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

    const client = await getRedisClient();
    const multi = client.multi();
    multi.set(REDIS_KEYS.EDITOR_BIO, bio);
    multi.set(REDIS_KEYS.EDITOR_PROMPT, prompt);
    await multi.exec();

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
