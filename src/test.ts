import { RedisService } from './services/redis.service';
import { AIService } from './services/ai.service';
import { ReporterService } from './services/reporter.service';
import { EditorService } from './services/editor.service';
import { SchedulerService } from './jobs/scheduler.service';

async function runTests(): Promise<void> {
  console.log('🧪 Running AI Newsroom Tests...\n');

  try {
    // Initialize services
    const redisService = new RedisService();
    await redisService.connect();

    const aiService = new AIService();
    const reporterService = new ReporterService(redisService, aiService);
    const editorService = new EditorService(redisService, aiService);
    const schedulerService = new SchedulerService(reporterService, editorService);

    console.log('✅ Services initialized successfully\n');

    // Test 1: Check initial data setup
    console.log('📊 Test 1: Checking initial data...');
    const editor = await redisService.getEditor();
    const reporters = await redisService.getAllReporters();

    if (editor) {
      console.log('✅ Editor found:', editor.bio.substring(0, 50) + '...');
    } else {
      console.log('❌ No editor found');
    }

    if (reporters.length > 0) {
      console.log(`✅ Found ${reporters.length} reporters:`);
      reporters.forEach((reporter, index) => {
        console.log(`   ${index + 1}. ${reporter.beats.join(', ')}`);
      });
    } else {
      console.log('❌ No reporters found');
    }
    console.log('');

    // Test 2: Manual reporter article generation
    console.log('📰 Test 2: Generating articles for all reporters...');
    try {
      const articleResults = await schedulerService.triggerReporterJob();
      console.log('✅ Article generation completed\n');
    } catch (error) {
      console.log('❌ Article generation failed:', error instanceof Error ? error.message : String(error));
      console.log('');
    }

    // Test 3: Check generated articles
    console.log('📄 Test 3: Checking generated articles...');
    const allStats = await reporterService.getAllReporterStats();
    let totalArticles = 0;

    for (const [reporterId, stats] of Object.entries(allStats)) {
      console.log(`Reporter ${reporterId} (${stats.reporter.beats.join(', ')}):`);
      console.log(`   Articles: ${stats.articleCount}`);
      if (stats.latestArticle) {
        console.log(`   Latest: "${stats.latestArticle.headline}"`);
      }
      totalArticles += stats.articleCount;
    }
    console.log(`\n📈 Total articles generated: ${totalArticles}\n`);

    // Test 4: Manual newspaper edition generation (only if we have articles)
    if (totalArticles > 0) {
      console.log('🗞️  Test 4: Generating newspaper edition...');
      try {
        const edition = await schedulerService.triggerNewspaperJob();
        console.log('✅ Newspaper edition generated\n');
      } catch (error) {
        console.log('❌ Newspaper edition generation failed:', error instanceof Error ? error.message : String(error));
        console.log('');
      }
    } else {
      console.log('🗞️  Test 4: Skipping newspaper edition (no articles available)\n');
    }

    // Test 5: Check newspaper editions
    console.log('📋 Test 5: Checking newspaper editions...');
    const latestEdition = await editorService.getLatestNewspaperEdition();
    if (latestEdition) {
      console.log(`✅ Latest edition: ${latestEdition.id} (${latestEdition.stories.length} stories)`);

      // Get edition with articles
      const editionWithArticles = await editorService.getEditionWithArticles(latestEdition.id);
      if (editionWithArticles) {
        console.log('   Stories in edition:');
        editionWithArticles.articles.forEach((article, index) => {
          console.log(`     ${index + 1}. "${article.headline}"`);
        });
      }
    } else {
      console.log('❌ No newspaper editions found');
    }
    console.log('');

    // Test 6: Manual daily edition generation (only if we have editions)
    if (latestEdition) {
      console.log('📅 Test 6: Generating daily edition...');
      try {
        const dailyEdition = await schedulerService.triggerDailyJob();
        console.log('✅ Daily edition generated\n');
      } catch (error) {
        console.log('❌ Daily edition generation failed:', error instanceof Error ? error.message : String(error));
        console.log('');
      }
    } else {
      console.log('📅 Test 6: Skipping daily edition (no newspaper editions available)\n');
    }

    // Test 7: Check daily editions
    console.log('📊 Test 7: Checking daily editions...');
    const latestDailyEdition = await editorService.getLatestDailyEdition();
    if (latestDailyEdition) {
      console.log(`✅ Latest daily edition: ${latestDailyEdition.id} (${latestDailyEdition.editions.length} newspaper editions)`);

      // Get daily edition with editions
      const dailyEditionWithEditions = await editorService.getDailyEditionWithEditions(latestDailyEdition.id);
      if (dailyEditionWithEditions) {
        console.log('   Newspaper editions in daily edition:');
        dailyEditionWithEditions.editions.forEach((edition, index) => {
          console.log(`     ${index + 1}. Edition ${edition.id} (${edition.stories.length} stories)`);
        });
      }
    } else {
      console.log('❌ No daily editions found');
    }
    console.log('');

    // Test 8: Scheduler status
    console.log('⏰ Test 8: Checking scheduler status...');
    const jobStatus = schedulerService.getJobStatus();
    const nextRuns = schedulerService.getNextRunTimes();

    console.log('Job statuses:');
    Object.entries(jobStatus).forEach(([job, running]) => {
      console.log(`   ${job}: ${running ? 'Running' : 'Stopped'}`);
    });

    console.log('\nNext run times:');
    Object.entries(nextRuns).forEach(([job, nextRun]) => {
      if (nextRun) {
        console.log(`   ${job}: ${nextRun.toLocaleString()}`);
      } else {
        console.log(`   ${job}: Not scheduled`);
      }
    });
    console.log('');

    // Cleanup
    await redisService.disconnect();
    console.log('🧹 Test cleanup completed');
    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('💥 Tests failed to run:', error);
    process.exit(1);
  });
}
