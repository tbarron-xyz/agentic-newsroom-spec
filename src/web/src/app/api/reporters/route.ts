import { NextRequest, NextResponse } from 'next/server';
import { createClient, RedisClientType } from 'redis';

const REDIS_KEYS = {
  REPORTERS: 'reporters',
  REPORTER_BEATS: (id: string) => `reporter:${id}:beats`,
  REPORTER_PROMPT: (id: string) => `reporter:${id}:prompt`,
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

// GET /api/reporters - Get all reporters
export async function GET() {
  try {
    const client = await getRedisClient();
    const reporterIds = await client.sMembers(REDIS_KEYS.REPORTERS);

    const reporters = [];

    for (const reporterId of reporterIds) {
      const [beats, prompt] = await Promise.all([
        client.sMembers(REDIS_KEYS.REPORTER_BEATS(reporterId)),
        client.get(REDIS_KEYS.REPORTER_PROMPT(reporterId))
      ]);

      reporters.push({
        id: reporterId,
        beats: beats || [],
        prompt: prompt || ''
      });
    }

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

    const client = await getRedisClient();

    // Generate new reporter ID
    const reporterId = `reporter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save everything using Redis sets (matching backend structure)
    const multi = client.multi();
    multi.sAdd(REDIS_KEYS.REPORTERS, reporterId);
    beats.forEach(beat => {
      multi.sAdd(REDIS_KEYS.REPORTER_BEATS(reporterId), beat);
    });
    multi.set(REDIS_KEYS.REPORTER_PROMPT(reporterId), prompt);
    await multi.exec();

    return NextResponse.json({
      id: reporterId,
      beats,
      prompt,
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
