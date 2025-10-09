import { ServiceContainer } from '../services/service-container';

async function testLoginFlow() {
  console.log('Testing Login Flow...\n');

  const container = ServiceContainer.getInstance();
  const redisService = await container.getDataStorageService();
  const authService = await container.getAuthService();

  try {
    // Clear data
    await redisService.clearAllData();
    console.log('✅ Connected to Redis and cleared data');

    // Create an admin user
    console.log('\n👤 Creating admin user...');
    const adminUser = await authService.registerUser(
      'admin@example.com',
      'admin123'
    );
    console.log('✅ Admin user created:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });

    // Test login API endpoint
    console.log('\n🔐 Testing login API endpoint...');
    const loginResponse = await fetch('http://localhost:3002/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful!');
      console.log('User:', loginData.user);
      console.log('Access token (first 50 chars):', loginData.tokens.accessToken.substring(0, 50) + '...');
      console.log('Refresh token (first 50 chars):', loginData.tokens.refreshToken.substring(0, 50) + '...');

      // Test accessing protected endpoint with JWT
      console.log('\n🔒 Testing protected endpoint with JWT...');
      const protectedResponse = await fetch('http://localhost:3002/api/editor', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (protectedResponse.ok) {
        const editorData = await protectedResponse.json();
        console.log('✅ Protected endpoint accessed successfully!');
        console.log('Editor data:', editorData);
      } else {
        console.log('❌ Failed to access protected endpoint:', protectedResponse.status);
      }

      // Test accessing protected endpoint without JWT
      console.log('\n🚫 Testing protected endpoint without JWT...');
      const noAuthResponse = await fetch('http://localhost:3002/api/editor', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (noAuthResponse.status === 401) {
        console.log('✅ Correctly rejected request without authentication');
      } else {
        console.log('❌ Should have rejected request without authentication');
      }

    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', errorData);
    }

    console.log('\n🎉 Login flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🔌 Test completed');
  }
}

// Run the test
testLoginFlow().catch(console.error);
