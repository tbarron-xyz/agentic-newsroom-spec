 import { NextRequest, NextResponse } from 'next/server';
 import { RedisService } from '../../../services/redis.service';
 import { AuthService } from '../../../services/auth.service';
 import { TinyJetstream } from 'mbjc/tinyjetstream';

const redisService = new RedisService();
const authService = new AuthService(redisService);

// GET /api/admin/bluesky-messages - Get Bluesky messages (admin only)
export async function GET(request: NextRequest) {
  await redisService.connect();
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token and get user
    const user = await authService.getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch messages using TinyJetstream
    const messages: any[] = [];
    const jetstream = new TinyJetstream();

    await new Promise<void>((resolve) => {
      jetstream.onTweet = (e) => {
        messages.push({
          did: e.did,
          text: e.commit.record.text,
          time: Date.now()
        });
        if (messages.length >= 50) {
          jetstream.stop();
          resolve();
        }
      };
      jetstream.start();
    });

    return NextResponse.json({
      messages,
      count: messages.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching Bluesky messages:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    try {
      await redisService.disconnect();
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }
}