import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../services/redis.service';

export function withRedis(
  handler: (request: NextRequest, redis: RedisService, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const redis = new RedisService();

    try {
      await redis.connect();
      return await handler(request, redis, context);
    } catch (error) {
      console.error('Redis wrapper error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    } finally {
      try {
        await redis.disconnect();
      } catch (error) {
        console.error('Error disconnecting from Redis:', error);
      }
    }
  };
}