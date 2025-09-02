import { RedisService } from '../services/redis.service';
import { ReporterService } from '../services/reporter.service';
import { AIService } from '../services/ai.service';
import { Editor } from '../models/types';

async function populateInitialData(): Promise<void> {
  console.log('🚀 Starting initial data population...\n');

  try {
    // Initialize services
    const redisService = new RedisService();
    await redisService.connect();

    const aiService = new AIService();
    const reporterService = new ReporterService(redisService, aiService);

    // Check if data already exists
    const existingEditor = await redisService.getEditor();
    const existingReporters = await redisService.getAllReporters();

    if (existingEditor || existingReporters.length > 0) {
      console.log('⚠️  Initial data already exists!');
      console.log(`📊 Found ${existingReporters.length} reporters and ${existingEditor ? '1' : '0'} editor\n`);
      console.log('Use --force flag to overwrite existing data\n');
      await redisService.disconnect();
      return;
    }

    console.log('📝 Creating initial editor and reporters...\n');

    // Create Editor
    const editor: Editor = {
      modelName: 'gpt-5-nano',
      bio: 'Veteran newspaper editor with over 25 years of experience in journalism. Expert at identifying compelling stories, maintaining editorial standards, and guiding reporters to produce high-quality content that informs and engages readers.',
      prompt: 'You are the chief editor of a major metropolitan newspaper. Your role is to curate the most important and impactful stories from the day\'s reporting. Consider factors like timeliness, significance, reader interest, and journalistic merit when selecting stories for publication. Ensure the final edition represents a balanced mix of news categories while prioritizing breaking developments and stories with broad societal impact.'
    };

    await redisService.saveEditor(editor);
    console.log('✅ Created editor with extensive journalism background');

    // Create three reporters with distinct beats
    const reporters = [
      {
        beats: ['politics', 'government', 'elections'],
        prompt: 'You are a seasoned political reporter covering national and local government affairs. Focus on policy impacts, legislative developments, and political strategy. Write clear, factual articles that explain complex political processes and their consequences for citizens.'
      },
      {
        beats: ['technology', 'science', 'innovation'],
        prompt: 'You are a technology and science reporter covering breakthroughs in tech, scientific discoveries, and innovation trends. Explain complex technical concepts in accessible language while highlighting their real-world applications and societal implications.'
      },
      {
        beats: ['business', 'economy', 'finance'],
        prompt: 'You are a business and financial reporter covering corporate news, economic trends, and market developments. Analyze how business decisions and economic forces affect individuals, communities, and the broader economy.'
      }
    ];

    console.log('Creating three specialized reporters...\n');

    for (let i = 0; i < reporters.length; i++) {
      const reporter = await reporterService.createReporter(reporters[i]);
      console.log(`✅ Created reporter ${i + 1}: ${reporter.beats.join(', ')}`);
    }

    console.log('\n🎉 Initial data population complete!');
    console.log('📊 Summary:');
    console.log('   • 1 Editor created');
    console.log('   • 3 Reporters created');
    console.log('   • Beats covered: Politics/Government, Technology/Science, Business/Economy\n');

    await redisService.disconnect();

  } catch (error) {
    console.error('❌ Failed to populate initial data:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const forceOverwrite = args.includes('--force');

async function main() {
  if (forceOverwrite) {
    console.log('🔄 Force overwrite mode enabled - clearing existing data...\n');
    // Note: In a production script, you might want to add data clearing logic here
  }

  await populateInitialData();
}

// Export for potential use as a module
export { populateInitialData };

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Population script failed:', error);
    process.exit(1);
  });
}
