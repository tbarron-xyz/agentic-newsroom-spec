import { RedisService } from '../services/redis.service';

async function testAdFetching() {
  console.log('Testing ad fetching functionality...');

  try {
    const redis = new RedisService();
    await redis.connect();

    // Create test ads with different timestamps
    const ad1 = {
      id: await redis.generateId('ad'),
      userId: '1',
      name: 'First Advertisement',
      bidPrice: 5.00,
      promptContent: 'First ad content'
    };

    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const ad2 = {
      id: await redis.generateId('ad'),
      userId: '1',
      name: 'Second Advertisement',
      bidPrice: 10.00,
      promptContent: 'Second ad content - this should be the most recent'
    };

    await redis.saveAd(ad1);
    await redis.saveAd(ad2);

    console.log('Created ads:', ad1.id, ad2.id);

    // Test getting most recent ad
    const mostRecentAd = await redis.getMostRecentAd();

    if (mostRecentAd) {
      console.log('Most recent ad ID:', mostRecentAd.id);
      console.log('Most recent ad name:', mostRecentAd.name);
      console.log('Most recent ad content:', mostRecentAd.promptContent);

      // Verify it's the correct one (ad2 should be more recent)
      if (mostRecentAd.id === ad2.id) {
        console.log('✅ Most recent ad correctly identified!');
      } else {
        console.log('❌ Most recent ad identification failed');
      }
    } else {
      console.log('❌ No most recent ad found');
    }

    await redis.disconnect();
    console.log('Test completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testAdFetching();
