import { RedisService } from './services/redis.service';
import { AIService } from './services/ai.service';
import { ReporterService } from './services/reporter.service';
import { EditorService } from './services/editor.service';
import { SchedulerService } from './jobs/scheduler.service';

async function initializeNewsroom(): Promise<void> {
  console.log('🚀 Initializing AI Newsroom...\n');

  try {
    // Initialize core services
    const redisService = new RedisService();
    await redisService.connect();

    const aiService = new AIService();
    const reporterService = new ReporterService(redisService, aiService);
    const editorService = new EditorService(redisService, aiService);
    const schedulerService = new SchedulerService(reporterService, editorService);

    // Check if we need to set up initial data
    const editor = await redisService.getEditor();
    const reporters = await redisService.getAllReporters();

    if (!editor || reporters.length === 0) {
      console.log('📝 Setting up initial newsroom data...\n');
      await setupInitialData(redisService, reporterService);
    } else {
      console.log('✅ Newsroom data already exists');
      console.log(`📊 Found ${reporters.length} reporters and 1 editor\n`);
    }

    // Start the scheduler
    schedulerService.start();

    // Set up graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received shutdown signal...');
      schedulerService.stop();
      await redisService.disconnect();
      console.log('👋 AI Newsroom shut down gracefully');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received termination signal...');
      schedulerService.stop();
      await redisService.disconnect();
      console.log('👋 AI Newsroom shut down gracefully');
      process.exit(0);
    });

    console.log('🎉 AI Newsroom is now running!');
    console.log('📅 Scheduled jobs:');
    console.log('   • Reporter articles: Every 15 minutes');
    console.log('   • Newspaper editions: Every 3 hours');
    console.log('   • Daily editions: Every 24 hours\n');

    // Keep the process running
    await new Promise(() => {}); // This will run indefinitely

  } catch (error) {
    console.error('❌ Failed to initialize AI Newsroom:', error);
    process.exit(1);
  }
}

async function setupInitialData(redisService: RedisService, reporterService: ReporterService): Promise<void> {
  console.log('Creating sample editor and reporters...\n');

  // Create editor
  const editor = {
    bio: 'Experienced newspaper editor with 20+ years in journalism. Specializes in curating compelling news narratives and identifying stories with broad impact.',
    prompt: 'You are an experienced newspaper editor. Your role is to select the most newsworthy and impactful stories from the available articles. Focus on stories that have broad appeal, significant consequences, or represent important trends. Prioritize breaking news, investigative pieces, and stories with human interest elements.'
  };

  await redisService.saveEditor(editor);
  console.log('✅ Created editor');

  // Create sample reporters
  const sampleReporters = [
    {
      beats: ['politics', 'government'],
      prompt: 'You are a political reporter covering government affairs, elections, and policy decisions. Write articles that explain complex political developments in clear, accessible language while maintaining journalistic objectivity.'
    },
    {
      beats: ['technology', 'innovation'],
      prompt: 'You are a technology reporter covering the latest developments in tech, startups, and innovation. Focus on how new technologies impact society, business, and daily life.'
    },
    {
      beats: ['business', 'finance'],
      prompt: 'You are a business reporter covering corporate news, financial markets, and economic trends. Explain complex business concepts and their real-world implications.'
    },
    {
      beats: ['sports', 'entertainment'],
      prompt: 'You are a sports and entertainment reporter covering major events, celebrity news, and cultural moments. Write engaging stories that capture the excitement and human elements.'
    }
  ];

  for (const reporterData of sampleReporters) {
    await reporterService.createReporter(reporterData);
  }

  console.log(`✅ Created ${sampleReporters.length} sample reporters\n`);
}

// Export services for potential use in other modules
export {
  RedisService,
  AIService,
  ReporterService,
  EditorService,
  SchedulerService
};

// Start the application if this file is run directly
if (require.main === module) {
  initializeNewsroom().catch((error) => {
    console.error('💥 Application failed to start:', error);
    process.exit(1);
  });
}
