import { NextRequest, NextResponse } from 'next/server';
import { User } from '../models/types';
import { RedisService } from '../services/redis.service';
import { AuthService } from '../services/auth.service';
import { AbilitiesService } from '../services/abilities.service';

type PermissionType = 'reader' | 'reporter' | 'editor';

interface WithAuthOptions {
  requiredRole?: 'admin';
  requiredPermission?: PermissionType;
}

export function withAuth(
  handler: (request: NextRequest, user: User, redis: RedisService, context?: any) => Promise<NextResponse>,
  options: WithAuthOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const redis = new RedisService();
    const authService = new AuthService(redis);
    const abilitiesService = new AbilitiesService();

    try {
      await redis.connect();

      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authorization token required' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);

      const user = await authService.getUserFromToken(token);
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Check role
      if (options.requiredRole) {
        if (user.role !== options.requiredRole) {
          return NextResponse.json(
            { error: `${options.requiredRole} access required` },
            { status: 403 }
          );
        }
      }

      // Check permission
      if (options.requiredPermission) {
        let hasPermission = false;
        switch (options.requiredPermission) {
          case 'reader':
            hasPermission = abilitiesService.userIsReader(user);
            break;
          case 'reporter':
            hasPermission = abilitiesService.userIsReporter(user);
            break;
          case 'editor':
            hasPermission = abilitiesService.userIsEditor(user);
            break;
        }
        if (!hasPermission) {
          return NextResponse.json(
            { error: `${options.requiredPermission} permission required` },
            { status: 403 }
          );
        }
      }

      return await handler(request, user, redis, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
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