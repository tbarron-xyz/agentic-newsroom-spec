import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/types';
import { RedisService } from './redis.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: User['role'];
}

export class AuthService {
  private redisService: RedisService;
  private jwtSecret: string;
  private jwtRefreshSecret: string;

  constructor(redisService: RedisService) {
    this.redisService = redisService;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateTokens(user: User): AuthTokens {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '12h' // 12 hours
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.jwtRefreshSecret,
      {
        expiresIn: '7d' // 7 days
      }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtRefreshSecret) as { userId: string };
      return decoded;
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      return null;
    }
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.redisService.getUserByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    // Update last login time
    await this.redisService.updateUserLastLogin(user.id);

    return user;
  }

  async registerUser(email: string, password: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.redisService.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await this.redisService.createUser({
      email,
      passwordHash,
      role: 'user'
    });

    return user;
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
    const decoded = this.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return null;
    }

    const user = await this.redisService.getUserById(decoded.userId);
    if (!user) {
      return null;
    }

    return this.generateTokens(user);
  }

  async getUserFromToken(token: string): Promise<User | null> {
    const payload = this.verifyAccessToken(token);
    if (!payload) {
      return null;
    }

    return await this.redisService.getUserById(payload.userId);
  }
}
