import { RedisService } from '../services/redis.service';
import { AIService } from '../services/ai.service';
import { NewspaperEdition, DailyEdition, Article } from '../models/types';

async function populateDailyEdition(): Promise<void> {
  console.log('📰 Starting daily edition population...\n');

  try {
    // Initialize services
    const redisService = new RedisService();
    await redisService.connect();

    // Check for OpenAI API key
    const hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '';

    let aiService: AIService | null = null;
    if (hasApiKey) {
      aiService = new AIService();
      console.log('✅ OpenAI API key found - will generate AI content\n');
    } else {
      console.log('⚠️  No OpenAI API key found - will create mock data for testing\n');
    }



    // Check if daily editions already exist
    const existingDailyEditions = await redisService.getDailyEditions();
    if (existingDailyEditions.length > 0) {
      console.log('⚠️  Daily editions already exist!');
      console.log(`📊 Found ${existingDailyEditions.length} daily editions\n`);
      console.log('Use --force flag to overwrite existing data\n');
      await redisService.disconnect();
      return;
    }

    console.log('📝 Generating sample daily edition...\n');

    // Step 1: Ensure we have reporters and editor
    const existingReporters = await redisService.getAllReporters();
    const existingEditor = await redisService.getEditor();

    if (existingReporters.length === 0 || !existingEditor) {
      console.log('⚠️  No reporters or editor found. Please run populate-initial-data.ts first.\n');
      await redisService.disconnect();
      return;
    }

    // Step 2: Generate sample articles from reporters
    console.log('📝 Generating sample articles from reporters...\n');
    const allArticles = [];

    if (!aiService) {
      console.log('⚠️  Skipping article generation - no AI service available\n');
    } else {
      for (const reporter of existingReporters) {
        console.log(`  • Generating articles for ${reporter.beats.join(', ')} reporter...`);

        // Generate 2-3 articles per reporter
        const numArticles = Math.floor(Math.random() * 2) + 2; // 2-3 articles

        for (let i = 0; i < numArticles; i++) {
          const structuredArticle = await aiService.generateStructuredArticle(reporter);
          // Convert structured article to simple Article format for storage
          const article: Article = {
            id: structuredArticle.id,
            reporterId: structuredArticle.reporterId,
            headline: structuredArticle.headline,
            body: `${structuredArticle.leadParagraph}\n\n${structuredArticle.body}`,
            generationTime: structuredArticle.generationTime,
            prompt: structuredArticle.prompt,
            messageIds: structuredArticle.messageIds || [],
            messageTexts: [] // Message texts not populated in this script
          };
          await redisService.saveArticle(article);
          allArticles.push(article);
          console.log(`    ✅ Generated article: "${article.headline}"`);
        }
      }
    }

    // Step 3: Create a newspaper edition from the articles
    console.log('\n🗞️  Creating newspaper edition from articles...\n');

    if (!aiService) {
      console.log('⚠️  Cannot create newspaper edition without AI service\n');
      await redisService.disconnect();
      return;
    }

    const { selectedArticles, fullPrompt } = await aiService.selectNewsworthyStories(allArticles, existingEditor.prompt);
    const editionId = await redisService.generateId('edition');

    const newspaperEdition: NewspaperEdition = {
      id: editionId,
      stories: selectedArticles.map(article => article.id),
      generationTime: Date.now(),
      prompt: fullPrompt
    };

    await redisService.saveNewspaperEdition(newspaperEdition);
    console.log(`✅ Created newspaper edition with ${selectedArticles.length} stories`);

    // Step 4: Generate daily edition from the newspaper edition
    console.log('\n🌟 Generating daily edition...\n');

    // Prepare detailed edition information with articles
    const detailedEditions = [{
      id: newspaperEdition.id,
      articles: selectedArticles.map(article => ({
        headline: article.headline,
        body: article.body
      }))
    }];

    const { content: dailyEditionContent, fullPrompt: dailyEditionPrompt } = await aiService.selectNotableEditions(
      detailedEditions,
      existingEditor.prompt
    );

    const dailyEditionId = await redisService.generateId('daily_edition');

    const dailyEdition: DailyEdition = {
      id: dailyEditionId,
      editions: [newspaperEdition.id],
      generationTime: Date.now(),
      frontPageHeadline: dailyEditionContent.frontPageHeadline,
      frontPageArticle: dailyEditionContent.frontPageArticle,
      topics: dailyEditionContent.topics,
      modelFeedbackAboutThePrompt: dailyEditionContent.modelFeedbackAboutThePrompt,
      newspaperName: dailyEditionContent.newspaperName,
      prompt: dailyEditionPrompt
    };

    await redisService.saveDailyEdition(dailyEdition);

    console.log('✅ Created daily edition with:');
    console.log(`   • Newspaper: "${dailyEdition.newspaperName}"`);
    console.log(`   • Front page: "${dailyEdition.frontPageHeadline}"`);
    console.log(`   • Topics: ${dailyEdition.topics.length}`);
    console.log(`   • Articles generated: ${allArticles.length}`);

    console.log('\n🎉 Daily edition population complete!');
    console.log('📊 Summary:');
    console.log('   • 1 Newspaper Edition created');
    console.log('   • 1 Daily Edition created');
    console.log(`   • ${allArticles.length} Articles generated`);
    console.log(`   • ${dailyEdition.topics.length} Topics covered\n`);

    await redisService.disconnect();

  } catch (error) {
    console.error('❌ Failed to populate daily edition:', error);
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

  await populateDailyEdition();
}

// Export for potential use as a module
export { populateDailyEdition };

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Daily edition population failed:', error);
    process.exit(1);
  });
}
