import { RedisService } from '../services/redis.service';
import { AuthService } from '../services/auth.service';

async function testAuthSystem() {
  console.log('Testing JWT Authentication System...\n');

  const redisService = new RedisService();
  const authService = new AuthService(redisService);

  try {
    // Connect to Redis
    await redisService.connect();
    console.log('✅ Connected to Redis');

    // Test user registration
    console.log('\n📝 Testing user registration...');
    const testUser = await authService.registerUser(
      'test@example.com',
      'testpassword123',
      'reporter'
    );
    console.log('✅ User registered successfully:', {
      id: testUser.id,
      email: testUser.email,
      role: testUser.role
    });

    // Test authentication
    console.log('\n🔐 Testing user authentication...');
    const authenticatedUser = await authService.authenticateUser(
      'test@example.com',
      'testpassword123'
    );

    if (authenticatedUser) {
      console.log('✅ Authentication successful:', {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        role: authenticatedUser.role
      });

      // Test token generation
      console.log('\n🎫 Testing token generation...');
      const tokens = authService.generateTokens(authenticatedUser);
      console.log('✅ Tokens generated successfully');
      console.log('Access token (first 50 chars):', tokens.accessToken.substring(0, 50) + '...');
      console.log('Refresh token (first 50 chars):', tokens.refreshToken.substring(0, 50) + '...');

      // Test token verification
      console.log('\n🔍 Testing token verification...');
      const payload = authService.verifyAccessToken(tokens.accessToken);
      if (payload) {
        console.log('✅ Access token verified successfully:', {
          userId: payload.userId,
          email: payload.email,
          role: payload.role
        });
      } else {
        console.log('❌ Access token verification failed');
      }

      // Test refresh token
      console.log('\n🔄 Testing token refresh...');
      const newTokens = await authService.refreshAccessToken(tokens.refreshToken);
      if (newTokens) {
        console.log('✅ Token refresh successful');
        console.log('New access token (first 50 chars):', newTokens.accessToken.substring(0, 50) + '...');
      } else {
        console.log('❌ Token refresh failed');
      }

      // Test user retrieval from token
      console.log('\n👤 Testing user retrieval from token...');
      const userFromToken = await authService.getUserFromToken(tokens.accessToken);
      if (userFromToken) {
        console.log('✅ User retrieved from token successfully:', {
          id: userFromToken.id,
          email: userFromToken.email,
          role: userFromToken.role
        });
      } else {
        console.log('❌ User retrieval from token failed');
      }
    } else {
      console.log('❌ Authentication failed');
    }

    // Test invalid credentials
    console.log('\n🚫 Testing invalid credentials...');
    const invalidAuth = await authService.authenticateUser(
      'test@example.com',
      'wrongpassword'
    );
    if (!invalidAuth) {
      console.log('✅ Invalid credentials correctly rejected');
    } else {
      console.log('❌ Invalid credentials were accepted');
    }

    // Test duplicate registration
    console.log('\n🚫 Testing duplicate registration...');
    try {
      await authService.registerUser(
        'test@example.com',
        'anotherpassword',
        'admin'
      );
      console.log('❌ Duplicate registration was allowed');
    } catch (error) {
      console.log('✅ Duplicate registration correctly rejected:', error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('\n🎉 All authentication tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    try {
      await redisService.disconnect();
      console.log('\n🔌 Disconnected from Redis');
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }
}

// Run the test
testAuthSystem().catch(console.error);
