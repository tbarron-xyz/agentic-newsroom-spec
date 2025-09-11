import { AIService } from '../services/ai.service';
import { RedisService } from '../services/redis.service';

async function testAdIntegration() {
  console.log('Testing ad integration in article generation...');

  try {
    // First, create a test ad
    const redis = new RedisService();
    await redis.connect();

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

    await redis.disconnect();

    // Test the AI service with mock social media messages
    const aiService = new AIService();

    // Mock the MCP client to return test messages
    const mockMessages: Array<{did: string; text: string; time: number}> = [];
    for (let i = 1; i <= 45; i++) {
      mockMessages.push({
        did: `user${i}`,
        text: `This is test social media message number ${i} about current events and discussions.`,
        time: Date.now() - (i * 1000)
      });
    }

    // Temporarily replace the MCP client method for testing
    const originalGetMessages = aiService['mcpClient'].getMessages;
    aiService['mcpClient'].getMessages = async () => mockMessages;

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

    // Restore original method
    aiService['mcpClient'].getMessages = originalGetMessages;

    console.log('Test completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testAdIntegration();
