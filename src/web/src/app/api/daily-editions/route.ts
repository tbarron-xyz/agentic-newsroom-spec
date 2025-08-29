import { NextRequest, NextResponse } from 'next/server';
import { createClient, RedisClientType } from 'redis';

const REDIS_KEYS = {
  DAILY_EDITIONS: 'daily_editions',
  DAILY_EDITION_EDITIONS: (dailyEditionId: string) => `daily_edition:${dailyEditionId}:editions`,
  DAILY_EDITION_TIME: (dailyEditionId: string) => `daily_edition:${dailyEditionId}:time`,
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

// GET /api/daily-editions - Get all daily editions
export async function GET() {
  try {
    const client = await getRedisClient();

    // Get all daily edition IDs with their timestamps
    const dailyEditionIds = await client.zRange(REDIS_KEYS.DAILY_EDITIONS, 0, -1, { REV: true });

    const dailyEditions = [];

    for (const dailyEditionId of dailyEditionIds) {
      const [
        time,
        frontPageHeadline,
        frontPageArticle,
        newspaperName,
        modelFeedbackPositive,
        modelFeedbackNegative,
        topics
      ] = await Promise.all([
        client.get(REDIS_KEYS.DAILY_EDITION_TIME(dailyEditionId)),
        client.get(`daily_edition:${dailyEditionId}:front_page_headline`),
        client.get(`daily_edition:${dailyEditionId}:front_page_article`),
        client.get(`daily_edition:${dailyEditionId}:newspaper_name`),
        client.get(`daily_edition:${dailyEditionId}:model_feedback_positive`),
        client.get(`daily_edition:${dailyEditionId}:model_feedback_negative`),
        client.get(`daily_edition:${dailyEditionId}:topics`)
      ]);

      // Get editions for this daily edition
      const editions = await client.sMembers(REDIS_KEYS.DAILY_EDITION_EDITIONS(dailyEditionId));

      dailyEditions.push({
        id: dailyEditionId,
        editions: editions || [],
        generationTime: parseInt(time || '0'),
        frontPageHeadline: frontPageHeadline || '',
        frontPageArticle: frontPageArticle || '',
        newspaperName: newspaperName || '',
        topics: topics ? JSON.parse(topics) : [],
        modelFeedbackAboutThePrompt: {
          positive: modelFeedbackPositive || '',
          negative: modelFeedbackNegative || ''
        }
      });
    }

    return NextResponse.json(dailyEditions);
  } catch (error) {
    console.error('Error fetching daily editions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily editions' },
      { status: 500 }
    );
  }
}

// POST /api/daily-editions - Generate a new daily edition (placeholder for now)
export async function POST() {
  try {
    // For now, return a message that this feature is not yet implemented
    // In a full implementation, this would call the AI service to generate a new daily edition
    return NextResponse.json(
      { error: 'Daily edition generation not yet implemented in API' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error generating daily edition:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily edition' },
      { status: 500 }
    );
  }
}
