import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '../../../utils/redis';

// GET /api/events/public - Get latest 12 events sorted by updated time (public access, no auth required)
export const GET = withRedis(async (_request: NextRequest, redis) => {
  // Get latest 12 events sorted by updated time (most recent first)
  const events = await redis.getLatestUpdatedEvents(12);

  return NextResponse.json(events);
});