import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '../../services/redis.service';
import { AuthService } from '../../services/auth.service';

const redisService = new RedisService();
const authService = new AuthService(redisService);

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
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

    // Connect to Redis
    await redisService.connect();

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

    // Get all users
    const users = await redisService.getAllUsers();

    // Return users without password hashes
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }));

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
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
