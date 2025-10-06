import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../utils/auth';

// GET /api/events - Get all events (admin only)
export const GET = withAuth(async (request: NextRequest, user, redis) => {
  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');

  // Parse and validate limit parameter
  let limit = 100; // default
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (isNaN(parsed) || parsed <= 0) {
      return NextResponse.json(
        { error: 'Limit parameter must be a positive integer' },
        { status: 400 }
      );
    }
    limit = parsed;
  }

  // Get all events
  const events = await redis.getAllEvents(limit);

  return NextResponse.json({ events });
}, { requiredRole: 'admin' });
