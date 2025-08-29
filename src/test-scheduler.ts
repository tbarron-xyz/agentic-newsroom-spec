import { RedisService } from './services/redis.service';
import { ReporterService } from './services/reporter.service';
import { EditorService } from './services/editor.service';
import { SchedulerService } from './jobs/scheduler.service';

// Mock AI service to avoid needing API key
class MockAIService {
  async generateText(): Promise<string> {
    return 'Mock generated text';
  }
}

async function testScheduler(): Promise<void> {
  console.log('🧪 Testing Scheduler Service...\n');

  try {
    // Initialize services with mock AI service
    const redisService = new RedisService();
    await redisService.connect();

    const aiService = new MockAIService();
    const reporterService = new ReporterService(redisService, aiService as any);
    const editorService = new EditorService(redisService, aiService as any);
    const schedulerService = new SchedulerService(reporterService, editorService);

    console.log('✅ Services initialized successfully\n');

    // Start the scheduler
    console.log('⏰ Starting scheduler...');
    schedulerService.start();

    // Test current time and next run times (this is what we implemented)
    const currentTime = new Date();
    const nextRunTimes = schedulerService.getNextRunTimes();

    console.log('🎉 Scheduler is now running!');
    console.log(`🕐 Current time: ${currentTime.toLocaleString()}`);
    console.log('📅 Scheduled jobs:');
    console.log('   • Reporter articles: Every 15 minutes');
    console.log(`     Next run: ${nextRunTimes.reporterJob?.toLocaleString() ?? 'Not scheduled'}`);
    console.log('   • Newspaper editions: Every 3 hours');
    console.log(`     Next run: ${nextRunTimes.newspaperJob?.toLocaleString() ?? 'Not scheduled'}`);
    console.log('   • Daily editions: Every 24 hours');
    console.log(`     Next run: ${nextRunTimes.dailyJob?.toLocaleString() ?? 'Not scheduled'}\n`);

    // Test job status
    const jobStatus = schedulerService.getJobStatus();
    console.log('Job statuses:');
    Object.entries(jobStatus).forEach(([job, running]) => {
      console.log(`   ${job}: ${running ? 'Running' : 'Stopped'}`);
    });

    // Stop scheduler
    schedulerService.stop();

    // Cleanup
    await redisService.disconnect();
    console.log('\n🧹 Test cleanup completed');
    console.log('🎉 Scheduler test completed successfully!');

  } catch (error) {
    console.error('💥 Scheduler test failed:', error);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testScheduler().catch((error) => {
    console.error('💥 Test failed to run:', error);
    process.exit(1);
  });
}
