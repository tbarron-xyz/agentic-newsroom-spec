import { ServiceContainer } from '../services/service-container';
import { exec } from 'child_process';
import { promisify } from 'util';

async function testAdIntegration() {
  console.log('Testing ad integration in article generation...');

  try {
    const container = ServiceContainer.getInstance();
    const redis = await container.getDataStorageService();
    const aiService = await container.getAIService();

    // First, create a test ad

    const testAd = {
      id: await redis.generateId('ad'),
      userId: '1',
      name: 'Test Advertisement',
      bidPrice: 10.50,
      promptContent: 'This is a test advertisement that should appear in the article prompt every 20 messages.'
    };

    await redis.saveAd(testAd);
    console.log('Created test ad:', testAd.id);

    // Create another ad to test most recent functionality
    const newerAd = {
      id: await redis.generateId('ad'),
      userId: '1',
      name: 'Newer Test Advertisement',
      bidPrice: 15.75,
      promptContent: 'This is the most recent advertisement that should be used in article generation.'
    };

    await redis.saveAd(newerAd);
    console.log('Created newer test ad:', newerAd.id);

    // Test the AI service with mock social media messages

    // Note: This test now uses the actual npx mbjc 500 command
    // Make sure the command is available and returns valid JSON

    // Create a mock reporter
    const mockReporter = {
      id: 'test_reporter',
      beats: ['Technology', 'Business'],
      prompt: 'Focus on innovative tech developments and business impacts',
      enabled: true
    };

    // Generate an article
    console.log('Generating article with ad integration...');
    const article = await aiService.generateStructuredArticle(mockReporter);

    console.log('Article generated successfully!');
    console.log('Article headline:', article.response.headline);
    console.log('Article prompt length:', article.prompt.length);

    // Check if the most recent ad prompt is in the article prompt
    const hasAdInPrompt = article.prompt.includes(newerAd.promptContent);
    console.log('Most recent ad included in prompt:', hasAdInPrompt);

    // Check if ad appears at the right positions (after 20, 40 messages)
    const promptLines = article.prompt.split('\n');
    let adInsertions = 0;
    for (let i = 0; i < promptLines.length; i++) {
      if (promptLines[i].includes(newerAd.promptContent)) {
        adInsertions++;
        console.log(`Ad found at line ${i + 1}`);
      }
    }
    console.log('Total ad insertions found:', adInsertions);

    // No need to restore since we're not mocking anymore

    console.log('Test completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testAdIntegration();
