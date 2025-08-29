import { RedisService } from '../services/redis.service';

async function debugDailyEdition(): Promise<void> {
  console.log('🔍 Debugging daily edition retrieval...\n');

  try {
    const redisService = new RedisService();
    console.log('📡 Connecting to Redis...');
    await redisService.connect();
    console.log('✅ Connected to Redis');

    console.log('\n📊 Checking daily editions...');
    const dailyEditions = await redisService.getDailyEditions();
    console.log(`Found ${dailyEditions.length} daily editions`);

    if (dailyEditions.length > 0) {
      console.log('\n📝 First daily edition details:');
      const firstEdition = dailyEditions[0];
      console.log(`   • ID: ${firstEdition.id}`);
      console.log(`   • Newspaper: ${firstEdition.newspaperName}`);
      console.log(`   • Front page: ${firstEdition.frontPageHeadline}`);
      console.log(`   • Topics: ${firstEdition.topics.length}`);
      console.log(`   • Editions: ${firstEdition.editions.length}`);
      console.log(`   • Generation time: ${new Date(firstEdition.generationTime).toISOString()}`);
    }

    await redisService.disconnect();
    console.log('\n🎉 Debug complete');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

// Run the debug
if (require.main === module) {
  debugDailyEdition().catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  });
}
