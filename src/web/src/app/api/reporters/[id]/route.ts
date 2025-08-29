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

// GET /api/reporters/[id] - Get specific reporter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reporterId } = await params;
    const client = await getRedisClient();

    // Check if reporter exists in the set
    const isMember = await client.sIsMember(REDIS_KEYS.REPORTERS, reporterId);
    if (!isMember) {
      return NextResponse.json(
        { error: 'Reporter not found' },
        { status: 404 }
      );
    }

    // Get reporter data
    const [beats, prompt] = await Promise.all([
      client.sMembers(REDIS_KEYS.REPORTER_BEATS(reporterId)),
      client.get(REDIS_KEYS.REPORTER_PROMPT(reporterId))
    ]);

    return NextResponse.json({
      id: reporterId,
      beats: beats || [],
      prompt: prompt || ''
    });
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

    const client = await getRedisClient();

    // Check if reporter exists
    const isMember = await client.sIsMember(REDIS_KEYS.REPORTERS, reporterId);
    if (!isMember) {
      return NextResponse.json(
        { error: 'Reporter not found' },
        { status: 404 }
      );
    }

    // Update reporter data using Redis sets
    const multi = client.multi();
    multi.del(REDIS_KEYS.REPORTER_BEATS(reporterId)); // Clear existing beats
    beats.forEach(beat => {
      multi.sAdd(REDIS_KEYS.REPORTER_BEATS(reporterId), beat);
    });
    multi.set(REDIS_KEYS.REPORTER_PROMPT(reporterId), prompt);
    await multi.exec();

    return NextResponse.json({
      id: reporterId,
      beats,
      prompt,
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
    const client = await getRedisClient();

    // Check if reporter exists
    const isMember = await client.sIsMember(REDIS_KEYS.REPORTERS, reporterId);
    if (!isMember) {
      return NextResponse.json(
        { error: 'Reporter not found' },
        { status: 404 }
      );
    }

    // Delete reporter data using Redis sets
    const multi = client.multi();
    multi.sRem(REDIS_KEYS.REPORTERS, reporterId);
    multi.del(REDIS_KEYS.REPORTER_BEATS(reporterId));
    multi.del(REDIS_KEYS.REPORTER_PROMPT(reporterId));
    await multi.exec();

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
