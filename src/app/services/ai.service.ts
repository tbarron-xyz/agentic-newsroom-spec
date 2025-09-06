import { Reporter, Article, REDIS_KEYS } from '../models/types';
import OpenAI from 'openai';
import { McpBskyClient } from "mcp-bsky-jetstream/client/dist/McpBskyClient.js";
import { zodResponseFormat } from 'openai/helpers/zod';
import { ZodSchema } from 'zod';
import { dailyEditionSchema, reporterArticleSchema } from '../models/schemas';
import { RedisService } from './redis.service';

export class AIService {
  private openai: OpenAI;
  private modelName: string = 'gpt-5-nano';
  private mcpClient: McpBskyClient;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    // Initialize MCP Bluesky client
    this.mcpClient = new McpBskyClient({
      serverUrl: process.env.MCP_BSKY_SERVER_URL || 'http://localhost:3001'
    });

    // Initialize modelName from Redis with default
    this.initializeModelName();
  }

  private async initializeModelName(): Promise<void> {
    try {
      const redis = new RedisService();
      await redis.connect();
      const storedModelName = await redis.getClient().get(REDIS_KEYS.MODEL_NAME);
      await redis.disconnect();

      this.modelName = storedModelName || 'gpt-5-nano';
    } catch (error) {
      console.warn('Failed to fetch modelName from Redis, using default:', error);
      this.modelName = 'gpt-5-nano';
    }
  }



  async generateStructuredArticle(reporter: Reporter): Promise<{
    id: string;
    reporterId: string;
    beat: string;
    headline: string;
    leadParagraph: string;
    body: string;
    keyQuotes: string[];
    sources: string[];
    wordCount: number;
    generationTime: number;
    reporterNotes: {
      researchQuality: string;
      sourceDiversity: string;
      factualAccuracy: string;
    };
    socialMediaSummary: string;
    prompt: string;
    tweetIds: string[];
  }> {
    const generationTime = Date.now();
    const articleId = `article_${generationTime}_${Math.random().toString(36).substring(2, 8)}`;
    const beat = reporter.beats[Math.floor(Math.random() * reporter.beats.length)];

    try {
      // Fetch recent social media messages to inform article generation
      let socialMediaMessages: Array<{did: string; text: string; time: number}> = [];
      try {
        this.mcpClient = new McpBskyClient({
          serverUrl: process.env.MCP_BSKY_SERVER_URL || 'http://localhost:3001'
        });
        await this.mcpClient.connect();
        socialMediaMessages = await this.mcpClient.getMessages();
        await this.mcpClient.disconnect();
      } catch (error) {
        console.warn('Failed to fetch social media messages:', error);
        // Continue with article generation even if social media fetch fails
      }

      // Fetch the most recent ad from data storage
      let mostRecentAd = null;
      try {
        const redis = new RedisService();
        await redis.connect();
        mostRecentAd = await redis.getMostRecentAd();
        await redis.disconnect();
      } catch (error) {
        console.warn('Failed to fetch most recent ad:', error);
        // Continue with article generation even if ad fetch fails
      }

      // Format social media messages for the prompt with ad insertion
      let socialMediaContext = '';
      if (socialMediaMessages.length > 0) {
        const messages = socialMediaMessages.slice(-200);
        const formattedMessages: string[] = [];

        for (let i = 0; i < messages.length; i++) {
          formattedMessages.push(`${i + 1}. "${messages[i].text}"`);

          // Insert ad prompt after every 20 message entries
          if ((i + 1) % 20 === 0 && mostRecentAd) {
            formattedMessages.push(`\n\n${mostRecentAd.promptContent}\n\n`);
          }
        }

        socialMediaContext = `\n\nRecent social media discussions related to ${beat}:\n${formattedMessages.join('\n')}`;
      }

      const systemPrompt = `You are a professional journalist creating structured news articles. Generate comprehensive, well-researched articles with proper journalistic structure including lead paragraphs, key quotes, sources, and reporter notes. Focus on: ${reporter.prompt}`;

      const userPrompt = `Create a comprehensive news article about recent developments in the ${beat} sector. Include:

1. A compelling headline
2. A strong lead paragraph (2-3 sentences)
3. A detailed body (300-500 words) with context and analysis
4. 2-4 key quotes from relevant sources
5. 3-5 credible sources
6. A brief social media summary (under 280 characters)
7. Reporter notes on research quality, source diversity, and factual accuracy

Make the article engaging, factual, and professionally written. Ensure all quotes are realistic and sources are credible.${socialMediaContext}

When generating the article, consider any relevant trends, discussions, or breaking news from the social media context provided above. Incorporate insights from these discussions where appropriate to make the article more timely and relevant.`;

      const fullPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;

      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        response_format: zodResponseFormat(reporterArticleSchema, "reporter_article")
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('No response content from AI service');
      }

      const parsedResponse = reporterArticleSchema.parse(JSON.parse(content));

      // Add generated fields
      parsedResponse.id = articleId;
      parsedResponse.reporterId = reporter.id;
      parsedResponse.beat = beat;
      parsedResponse.generationTime = generationTime;
      parsedResponse.wordCount = parsedResponse.body.split(' ').length;
      parsedResponse.prompt = fullPrompt; // Add the full prompt

      return parsedResponse;
    } catch (error) {
      console.error('Error generating structured article:', error);
      // Return fallback structured article
      const fallbackPrompt = `System: You are a professional journalist creating structured news articles. Generate comprehensive, well-researched articles with proper journalistic structure including lead paragraphs, key quotes, sources, and reporter notes. Focus on: ${reporter.prompt}

User: Create a comprehensive news article about recent developments in the ${beat} sector. Include:

1. A compelling headline
2. A strong lead paragraph (2-3 sentences)
3. A detailed body (300-500 words) with context and analysis
4. 2-4 key quotes from relevant sources
5. 3-5 credible sources
6. A brief social media summary (under 280 characters)
7. Reporter notes on research quality, source diversity, and factual accuracy

Make the article engaging, factual, and professionally written. Ensure all quotes are realistic and sources are credible.`;

      return {
        id: articleId,
        reporterId: reporter.id,
        beat,
        headline: `Breaking News in ${beat}`,
        leadParagraph: `Recent developments in the ${beat} sector have captured significant attention from industry experts and the general public.`,
        body: `A significant development has occurred in the ${beat} sector, capturing widespread attention and prompting discussion among industry experts and the general public. The situation continues to evolve with potential implications for various stakeholders. Further details are expected to emerge as the story develops.`,
        keyQuotes: [`"This development represents a significant shift in the ${beat} landscape," said an industry expert.`],
        sources: [`Industry Report on ${beat}`, 'Market Analysis Publication'],
        wordCount: 85,
        generationTime,
        reporterNotes: {
          researchQuality: 'Standard research conducted with available information',
          sourceDiversity: 'Limited source diversity due to breaking news nature',
          factualAccuracy: 'Information based on preliminary reports'
        },
        socialMediaSummary: `Breaking: Major developments in ${beat} sector capturing widespread attention. Stay tuned for updates! #${beat.replace(/\s+/g, '')}News`,
        prompt: fallbackPrompt,
        tweetIds: [] // No tweets used in fallback
      };
    }
  }





  async selectNewsworthyStories(articles: Article[], editorPrompt: string): Promise<{ selectedArticles: Article[]; fullPrompt: string }> {
    if (articles.length === 0) return { selectedArticles: [], fullPrompt: '' };

    try {
      const articlesText = articles.map((article, index) =>
        `Article ${index + 1}:\nHeadline: ${article.headline}\nContent: ${article.body.substring(0, 300)}...`
      ).join('\n\n');

      const systemPrompt = 'You are an experienced news editor evaluating story newsworthiness. Select the most important and engaging stories based on journalistic criteria.';
      const userPrompt = `Given the following articles and editorial guidelines: "${editorPrompt}", select the 3-5 most newsworthy stories from the list below. Consider factors like timeliness, impact, audience interest, and editorial fit.

Articles:
${articlesText}

Return only the article numbers (1, 2, 3, etc.) of the selected stories, separated by commas. Select between 3-5 articles based on their quality and newsworthiness.`;

      const fullPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;

      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      const selectedIndices = response.choices[0]?.message?.content?.trim()
        .split(',')
        .map(num => parseInt(num.trim()) - 1)
        .filter(index => index >= 0 && index < articles.length) || [];

      // If AI selection fails or returns empty, fall back to random selection
      if (selectedIndices.length === 0) {
        const minStories = 3;
        const maxStories = Math.min(5, articles.length);
        const numStories = Math.floor(Math.random() * (maxStories - minStories + 1)) + minStories;
        const shuffled = [...articles].sort(() => 0.5 - Math.random());
        return { selectedArticles: shuffled.slice(0, numStories), fullPrompt };
      }

      return { selectedArticles: selectedIndices.map(index => articles[index]), fullPrompt };
    } catch (error) {
      console.error('Error selecting newsworthy stories:', error);
      // Fallback to random selection
      const minStories = 3;
      const maxStories = Math.min(5, articles.length);
      const numStories = Math.floor(Math.random() * (maxStories - minStories + 1)) + minStories;
      const shuffled = [...articles].sort(() => 0.5 - Math.random());
      return {
        selectedArticles: shuffled.slice(0, numStories),
        fullPrompt: `System: You are an experienced news editor evaluating story newsworthiness. Select the most important and engaging stories based on journalistic criteria.

User: Given the following articles and editorial guidelines: "${editorPrompt}", select the 3-5 most newsworthy stories from the list below.`
      };
    }
  }

  async generateStructuredReporterResponse<T>(reporter: Reporter, schema: ZodSchema<T>): Promise<T> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: `You are a professional news reporter creating comprehensive structured news content. Generate a complete reporter response with multiple articles, coverage analysis, and editorial feedback. Focus on: ${reporter.prompt}`
          },
          {
            role: 'user',
            content: `Create a comprehensive reporter response for reporter covering beats: ${reporter.beats.join(', ')}.

Generate 1-3 articles for each beat, with complete journalistic structure including headlines, lead paragraphs, detailed bodies, key quotes, sources, and reporter notes.

Then provide:
1. Coverage summary analyzing which beats were covered and key themes
2. Model feedback with positive aspects, negative aspects, and suggestions for improvement

Make all content professional, factual, and engaging. Ensure proper journalistic standards are maintained throughout.`
          }
        ],
        response_format: zodResponseFormat(schema, "reporter_response")
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('No response content from AI service');
      }

      return schema.parse(JSON.parse(content));
    } catch (error) {
      console.error('Error generating structured reporter response:', error);
      throw error;
    }
  }

  async selectNotableEditions(editions: Array<{id: string; articles: Array<{headline: string; body: string}>}>, editorPrompt: string): Promise<{
    content: {
      frontPageHeadline: string;
      frontPageArticle: string;
      topics: Array<{
        name: string;
        headline: string;
        newsStoryFirstParagraph: string;
        newsStorySecondParagraph: string;
        oneLineSummary: string;
        supportingSocialMediaMessage: string;
        skepticalComment: string;
        gullibleComment: string;
      }>;
      modelFeedbackAboutThePrompt: { positive: string; negative: string };
      newspaperName: string;
    };
    fullPrompt: string;
  }> {
    if (editions.length === 0) {
      throw new Error('No editions available for daily edition generation');
    }

    try {
      const editionsText = editions.map((edition, index) => {
        const articlesText = edition.articles.map((article, articleIndex) =>
          `Article ${articleIndex + 1}:\nHeadline: ${article.headline}\nFirst Paragraph: ${article.body.split('\n')[0] || article.body.substring(0, 200)}`
        ).join('\n\n');
        return `Edition ${index + 1} (ID: ${edition.id}):\n${articlesText}`;
      }).join('\n\n');

      const systemPrompt = `You are a newspaper editor creating a comprehensive daily edition. Based on the available newspaper editions and their articles, create a structured daily newspaper with front page content, multiple topics, and editorial feedback. Create engaging, professional content that synthesizes the available editions into a cohesive daily newspaper.`;
      const userPrompt = `Using the editorial guidelines: "${editorPrompt}", create a comprehensive daily newspaper edition based on these available newspaper editions and their articles:

${editionsText}

Generate a complete daily edition with:
1. A compelling front page headline that captures the day's most important story
2. A detailed front page article (300-500 words)
3. 3-5 major topics, each with complete news coverage including headlines, two-paragraph stories, social media content, and contrasting viewpoints
4. Feedback about the editorial prompt (both positive and negative aspects)
5. An appropriate newspaper name

Make the content engaging, balanced, and professionally written. Focus on creating a cohesive narrative that connects the various editions into a unified daily newspaper experience.`;

      const fullPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;

      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        response_format: zodResponseFormat(dailyEditionSchema, "daily_edition")
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('No response content from AI service');
      }

      const parsedResponse = dailyEditionSchema.parse(JSON.parse(content));

      // Validate the response structure
      if (!parsedResponse.frontPageHeadline ||
          !parsedResponse.frontPageArticle ||
          !Array.isArray(parsedResponse.topics) ||
          !parsedResponse.modelFeedbackAboutThePrompt ||
          !parsedResponse.newspaperName) {
        throw new Error('Invalid response structure from AI service');
      }

      return { content: parsedResponse, fullPrompt };
    } catch (error) {
      console.error('Error generating daily edition:', error);
      // Return a fallback structure
      const fallbackContent = {
        frontPageHeadline: "Daily News Roundup",
        frontPageArticle: "Today's news brings together the most important stories from our recent editions, providing readers with a comprehensive overview of current events and developments.",
        topics: [
          {
            name: "General News",
            headline: "News Developments",
            newsStoryFirstParagraph: "Recent events have captured public attention with various developments across multiple sectors.",
            newsStorySecondParagraph: "These stories continue to evolve as more information becomes available and stakeholders respond to the changing landscape.",
            oneLineSummary: "Breaking news and updates from recent editions.",
            supportingSocialMediaMessage: "Stay informed with today's top stories! 📰 #DailyNews",
            skepticalComment: "Another day of carefully curated news - but what's really happening behind the headlines?",
            gullibleComment: "This is absolutely the most important news of the day! Everyone should read this immediately!"
          }
        ],
        modelFeedbackAboutThePrompt: {
          positive: "The editorial guidelines provide clear direction for content creation.",
          negative: "The prompt could benefit from more specific guidance on content prioritization."
        },
        newspaperName: "Daily Gazette"
      };

      return {
        content: fallbackContent,
        fullPrompt: `System: You are a newspaper editor creating a comprehensive daily edition. Based on the available newspaper editions, create a structured daily newspaper with front page content, multiple topics, and editorial feedback. Create engaging, professional content that synthesizes the available editions into a cohesive daily newspaper.

User: Using the editorial guidelines: "${editorPrompt}", create a comprehensive daily newspaper edition based on these available newspaper editions.`
      };
    }
  }
}
