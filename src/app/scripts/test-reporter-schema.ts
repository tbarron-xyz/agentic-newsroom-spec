import { ReporterService } from '../services/reporter.service';
import { AIService } from '../services/ai.service';
import { RedisService } from '../services/redis.service';
import { reporterResponseSchema } from '../models/schemas';

async function testReporterSchemaIntegration() {
  console.log('Testing reporterResponseSchema integration...');

  try {
    // Initialize services
    const redisService = new RedisService();
    await redisService.connect();

    const aiService = new AIService();
    const reporterService = new ReporterService(redisService, aiService);

    // Get all reporters
    const reporters = await redisService.getAllReporters();
    if (reporters.length === 0) {
      console.log('No reporters found. Please create a reporter first.');
      return;
    }

    const testReporter = reporters[0];
    console.log(`Testing with reporter: ${testReporter.id} (${testReporter.beats.join(', ')})`);

    // Test the schema-based generation
    console.log('Generating structured response using reporterResponseSchema...');
    const structuredResponse = await reporterService.generateStructuredReporterResponse(testReporter.id);

    // Validate the response against the schema
    const validationResult = reporterResponseSchema.safeParse(structuredResponse);

    if (validationResult.success) {
      console.log('✅ Schema validation passed!');
      console.log(`Generated ${structuredResponse.articles.length} articles`);
      console.log(`Coverage summary: ${structuredResponse.coverageSummary.beatsCovered.join(', ')}`);
      console.log(`Total word count: ${structuredResponse.coverageSummary.totalWordCount}`);
      console.log(`Key themes: ${structuredResponse.coverageSummary.keyThemes.join(', ')}`);
      console.log('Model feedback:', structuredResponse.modelFeedback);

      // Show first article details
      if (structuredResponse.articles.length > 0) {
        const firstArticle = structuredResponse.articles[0];
        console.log('\nFirst article details:');
        console.log(`- Headline: ${firstArticle.headline}`);
        console.log(`- Beat: ${firstArticle.beat}`);
        console.log(`- Word count: ${firstArticle.wordCount}`);
        console.log(`- Sources: ${firstArticle.sources.join(', ')}`);
      }
    } else {
      console.error('❌ Schema validation failed:', validationResult.error);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testReporterSchemaIntegration().then(() => {
  console.log('Test completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
