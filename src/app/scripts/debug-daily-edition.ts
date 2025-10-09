import { ServiceContainer } from '../services/service-container';

async function debugDailyEdition(): Promise<void> {
  console.log('🔍 Debugging daily edition retrieval...\n');

  try {
    const container = ServiceContainer.getInstance();
    const redisService = await container.getDataStorageService();
    console.log('📡 Connected to Redis via container');

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
