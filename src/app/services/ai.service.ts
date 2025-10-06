import { Reporter, Article, Event, REDIS_KEYS } from '../models/types';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { dailyEditionSchema, reporterArticleSchema, eventGenerationResponseSchema } from '../models/schemas';
import { RedisService } from './redis.service';
import { KpiService } from './kpi.service';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { fetchLatestMessages } from './bluesky.service';

export class AIService {
  private openai: OpenAI;
  private modelName: string = 'gpt-5-nano';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
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



  async generateStructuredArticle(reporter: Reporter): Promise<{response: {
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
    messageIds: number[];
    potentialMessageIds: number[];
  }, prompt: string,
    messages: string[];
}> {
    const generationTime = Date.now();
    const articleId = `article_${generationTime}_${Math.random().toString(36).substring(2, 8)}`;
    const beatsList = reporter.beats.join(', ');

    try {
      // Get configurable message slice count from Redis
      let messageSliceCount = 200; // Default fallback
      try {
        const redis = new RedisService();
        await redis.connect();
        const editor = await redis.getEditor();
        await redis.disconnect();
        if (editor) {
          messageSliceCount = editor.messageSliceCount;
        }
      } catch (error) {
        console.warn('Failed to fetch message slice count from Redis, using default:', error);
      }

      // Fetch recent social media messages to inform article generation
      let socialMediaMessages: Array<{did: string; text: string; time: number}> = [];
      try {
        socialMediaMessages = await fetchLatestMessages(messageSliceCount);
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
        const formattedMessages: string[] = [];

        for (let i = 0; i < socialMediaMessages.length; i++) {
          formattedMessages.push(`${i + 1}. "${socialMediaMessages[i].text}"`);

          // Insert ad prompt after every 20 message entries
          if ((i + 1) % 20 === 0 && mostRecentAd) {
            formattedMessages.push(`\n\n${mostRecentAd.promptContent}\n\n`);
          }
        }

        socialMediaContext = `\n\nRecent social media discussions:\n${formattedMessages.join('\n')}`;
      }

      const systemPrompt = `You are a professional journalist creating structured news articles. Generate comprehensive, well-researched articles with proper journalistic structure including lead paragraphs, key quotes, sources, and reporter notes. ${reporter.prompt}`;

      const userPrompt = `Create a focused news article about one particular recent development. You have access to these beats: ${beatsList}. Choose one beat from this list and focus your article on a recent development within that chosen beat.

First, scan the provided social media messages for information relevant to any of your available beats. Identify the single most significant or noteworthy recent development from these messages that aligns with one of your assigned beats. If there are zero relevant social media messages, stop processing and return empty strings for the rest of the fields.

Focus the entire article on this one specific development, providing in-depth coverage rather than broad overview. Include:

1. A compelling headline focused on this specific development
2. A strong lead paragraph (2-3 sentences) that hooks readers with this particular story
3. A detailed body (300-500 words) with deep context and analysis of this one development
4. 2-4 key quotes specifically related to this development
5. 3-5 credible sources focused on this particular development
6. A brief social media summary (under 280 characters) about this specific story
7. Reporter notes on research quality, source diversity, and factual accuracy for this development
8. beat: Specify which beat from your assigned list you chose for this article
9. messageIds: List the indices (1, 2, 3, etc.) of only the relevant messages you identified and actually used to inform or write this article about this specific development. If you didn't find any relevant messages or didn't use any specific messages, use an empty array.

Make the article engaging, factual, and professionally written. Ensure all quotes are realistic and sources are credible. Focus exclusively on this one development to create a more targeted and impactful piece.${socialMediaContext}

When generating the article, first scan the social media context for messages relevant to your available beats, choose the most appropriate beat for the best story available, identify the most significant single development within that beat, then focus the entire article on that specific development to create a more targeted and impactful story. After writing the article, re-scan the social media messages for any that may be potentially related to your story; include their numeric indices in the "potentialMessageIds" field.`;

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

      // Save the entire AI response to JSON file
      try {
        const responseFilePath = join(process.cwd(), 'api_responses', `article_${generationTime}.json`);
        await writeFile(responseFilePath, JSON.stringify(response, null, 2));
      } catch (error) {
        console.warn('Failed to save AI response to file:', error);
        // Continue with article generation even if file save fails
      }

      const parsedResponse = reporterArticleSchema.parse(JSON.parse(content));

      // Add generated fields
      parsedResponse.id = articleId;
      parsedResponse.reporterId = reporter.id;
      parsedResponse.generationTime = generationTime;
      parsedResponse.wordCount = parsedResponse.body.split(' ').length;

      return { response: parsedResponse, prompt: fullPrompt, messages: socialMediaMessages.map(x => x.text)} ;
    } catch (error) {
      console.error('Error generating structured article:', error);
      // Return fallback structured article
      const fallbackBeat = reporter.beats[0] || 'General News';
      const fallbackPrompt = `System: You are a professional journalist creating structured news articles. Generate comprehensive, well-researched articles with proper journalistic structure including lead paragraphs, key quotes, sources, and reporter notes. Focus on: ${reporter.prompt}

User: Create a comprehensive news article about recent developments. You have access to these beats: ${beatsList}. Choose one beat from this list and focus your article on a recent development within that chosen beat. Include:

1. A compelling headline
2. A strong lead paragraph (2-3 sentences)
3. A detailed body (300-500 words) with context and analysis
4. 2-4 key quotes from relevant sources
5. 3-5 credible sources
6. A brief social media summary (under 280 characters)
7. Reporter notes on research quality, source diversity, and factual accuracy
8. beat: Specify which beat from your assigned list you chose for this article

Make the article engaging, factual, and professionally written. Ensure all quotes are realistic and sources are credible.`;

      return {response: {
        id: articleId,
        reporterId: reporter.id,
        beat: fallbackBeat,
        headline: `Breaking News in ${fallbackBeat}`,
        leadParagraph: `Recent developments in the ${fallbackBeat} sector have captured significant attention from industry experts and the general public.`,
        body: `A significant development has occurred in the ${fallbackBeat} sector, capturing widespread attention and prompting discussion among industry experts and the general public. The situation continues to evolve with potential implications for various stakeholders. Further details are expected to emerge as the story develops.`,
        keyQuotes: [`"This development represents a significant shift in the ${fallbackBeat} landscape," said an industry expert.`],
        sources: [`Industry Report on ${fallbackBeat}`, 'Market Analysis Publication'],
        wordCount: 85,
        generationTime,
        reporterNotes: {
          researchQuality: 'Standard research conducted with available information',
          sourceDiversity: 'Limited source diversity due to breaking news nature',
          factualAccuracy: 'Information based on preliminary reports'
        },
        socialMediaSummary: `Breaking: Major developments in ${fallbackBeat} sector capturing widespread attention. Stay tuned for updates! #${fallbackBeat.replace(/\s+/g, '')}News`,
        messageIds: [],potentialMessageIds:[], // No tweets used in fallback,
      }, messages:[], prompt:fallbackPrompt};
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

      // Track KPI usage
      await KpiService.incrementFromOpenAIResponse(response);

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
        response_format: zodResponseFormat(reporterArticleSchema, "reporter_article")
      });

      // Track KPI usage
      await KpiService.incrementFromOpenAIResponse(response);

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('No response content from AI service');
      }

      const parsedResponse = dailyEditionSchema.parse(JSON.parse(content));

      // Validate the response structure
      if (!parsedResponse.frontPageHeadline ||
          !parsedResponse.frontPageArticle ||
          !Array.isArray(parsedResponse.topics) ||
          !parsedResponse.modelFeedbackAboutThePrompt) {
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

  async generateEvents(reporter: Reporter, lastEvents: Event[]): Promise<{
    events: Array<{
      index?: number | null;
      title: string;
      facts: string[];
      where?: string | null;
      when?: string | null;
      messageIds: number[];
      potentialMessageIds: number[];
    }>;
    fullPrompt: string;
    messages: string[];
  }> {
    try {
      // Format last events for context
      const eventsContext = lastEvents.length > 0
        ? lastEvents.map((event, index) =>
            `Event ${index + 1}:\nTitle: ${event.title}\nFacts: ${event.facts.join(', ')}\nCreated: ${new Date(event.createdTime).toISOString()}`
          ).join('\n\n')
        : 'No previous events available.';

      // Get configurable message slice count
      let messageSliceCount = 200; // Default fallback
      try {
        const redis = new RedisService();
        await redis.connect();
        const editor = await redis.getEditor();
        await redis.disconnect();
        if (editor) {
          messageSliceCount = editor.messageSliceCount;
        }
      } catch (error) {
        console.warn('Failed to fetch message slice count for events, using default:', error);
      }

      // Fetch recent social media messages
      let socialMediaMessages: Array<{did: string; text: string; time: number}> = [];
      try {
        socialMediaMessages = await fetchLatestMessages(messageSliceCount);
      } catch (error) {
        console.warn('Failed to fetch social media messages for events:', error);
      }

      // Format social media messages for the prompt
      const socialMediaContext = socialMediaMessages.length > 0
        ? socialMediaMessages.map((msg, index) => `${index + 1}. "${msg.text}"`).join('\n')
        : 'No social media messages available.';

      const beatsList = reporter.beats.join(', ');

      const systemPrompt = `You are an AI journalist tasked with identifying and tracking important events and developments. Your goal is to create structured event records that capture key facts about ongoing stories and developments. You specialize in these beats: ${beatsList}. ${reporter.prompt}`;

       const userPrompt = `Based on the recent social media messages and the reporter's previous events, identify up to 5 significant events or developments that should be tracked. Focus on events and developments that align with your assigned beats: ${beatsList}. For each event:

1. If this matches an existing event from the previous events list, use the existing event's numerical index and add any new facts to it
2. If this is a new event, create a new title and initial facts
3. Each event should have 1-5 key facts that capture the essential information
4. messageIds: List the indices (1, 2, 3, etc.) of only the relevant messages you identified and actually used to create or update this event. If you didn't find any relevant messages or didn't use any specific messages, use an empty array.
5. potentialMessageIds: After creating/updating the event, re-scan the social media messages for any that may be potentially related to this event; include their numeric indices in this field.

Previous Events:
${eventsContext}

Recent Social Media Messages:
${socialMediaContext}

Instructions:
- Review the social media messages for significant developments that align with your assigned beats: ${beatsList}
- Prioritize events and developments within your beats over general news
- Match new information to existing events where appropriate, or create new events for new developments
- For each event, provide a clear title and 1-5 key facts
- Focus on factual, verifiable information
- Prioritize events that represent ongoing stories or important developments within your beats
- Return up to 5 events maximum
- IMPORTANT: Always include messageIds and potentialMessageIds arrays for each event, even if empty
 `;

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
        response_format: zodResponseFormat(eventGenerationResponseSchema, "event_generation")
      });

      // Track KPI usage
      await KpiService.incrementFromOpenAIResponse(response);

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('No response content from AI service for events');
      }

      const parsedResponse = eventGenerationResponseSchema.parse(JSON.parse(content));

      return {
        events: parsedResponse.events,
        fullPrompt,
        messages: socialMediaMessages.map(x => x.text)
      };
    } catch (error) {
      console.error('Error generating events:', error);
      // Return empty events on error
      return {
        events: [],
        fullPrompt: 'Error occurred during event generation',
        messages: []
      };
    }
  }

  async generateArticlesFromEvents(reporter: Reporter): Promise<{response: {
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
    messageIds: number[];
    potentialMessageIds: number[];
  }, prompt: string,
    messages: string[];
} | null> {
    const generationTime = Date.now();
    const articleId = `article_${generationTime}_${Math.random().toString(36).substring(2, 8)}`;
    const beatsList = reporter.beats.join(', ');

    try {
      // Get reporter's 5 latest events
      const redis = new RedisService();
      await redis.connect();
      const latestEvents = await redis.getEventsByReporter(reporter.id, 5);
      await redis.disconnect();

      // Get reporter's 5 latest articles for context
      const latestArticles = await redis.getArticlesByReporter(reporter.id, 5);

      // Format events for the prompt
      const eventsContext = latestEvents.length > 0
        ? latestEvents.map((event, index) =>
            `Event ${index + 1}:\nTitle: ${event.title}\nFacts: ${event.facts.join(', ')}\nCreated: ${new Date(event.createdTime).toISOString()}`
          ).join('\n\n')
        : 'No previous events available for this reporter.';

      // Format recent article headlines for context
      const articlesContext = latestArticles.length > 0
        ? latestArticles.map((article, index) =>
            `Article ${index + 1}: "${article.headline}"`
          ).join('\n')
        : 'No previous articles available for this reporter.';

      // Get configurable message slice count
      let messageSliceCount = 200; // Default fallback
      try {
        const redisService = new RedisService();
        await redisService.connect();
        const editor = await redisService.getEditor();
        await redisService.disconnect();
        if (editor) {
          messageSliceCount = editor.messageSliceCount;
        }
      } catch (error) {
        console.warn('Failed to fetch message slice count from Redis, using default:', error);
      }

      // Fetch recent social media messages to inform article generation
      let socialMediaMessages: Array<{did: string; text: string; time: number}> = [];
      try {
        socialMediaMessages = await fetchLatestMessages(messageSliceCount);
      } catch (error) {
        console.warn('Failed to fetch social media messages:', error);
        // Continue with article generation even if social media fetch fails
      }

      // Format social media messages for the prompt
      let socialMediaContext = '';
      if (socialMediaMessages.length > 0) {
        const formattedMessages: string[] = [];

        for (let i = 0; i < socialMediaMessages.length; i++) {
          formattedMessages.push(`${i + 1}. "${socialMediaMessages[i].text}"`);
        }

        socialMediaContext = `\n\nRecent social media discussions:\n${formattedMessages.join('\n')}`;
      }

      const systemPrompt = `You are a professional journalist creating structured news articles. Generate comprehensive, well-researched articles with proper journalistic structure including lead paragraphs, key quotes, sources, and reporter notes. ${reporter.prompt}`;

      const userPrompt = `Create a focused news article about one of your recent events. Your assigned beats are as follows: ${beatsList}.

Here are your 5 latest events:
${eventsContext}

Here are the headlines of your 5 latest articles:
${articlesContext}

Choose ONE of the 5 events above and write a comprehensive news article about it. Follow these guidelines:

 *First, scan the provided social media messages for information relevant to any of your available beats. If there are zero relevant social media messages, stop processing and return empty strings for the rest of the fields. Include the numerical indexes of the messages relevant to the article you write in the "messageIds" field.
 * Write a compelling headline focused on this specific event
 * Create a strong lead paragraph (2-3 sentences) that hooks readers with this particular story
 * Write a detailed body (300-500 words) with deep context and analysis of this event
 * Include 2-4 key quotes specifically related to this event
 * List 3-5 credible sources focused on this particular event
 * Create a brief social media summary (under 280 characters) about this specific story
 * Provide reporter notes on research quality, source diversity, and factual accuracy for this event
 * Specify which beat from your assigned list you chose for this article
 * IMPORTANT: Do not write about topics you've covered in your recent articles unless there is newly developed information about that topic. If all recent events have been covered, choose the one with the most significant new developments.

Make the article engaging, factual, and professionally written. Ensure all quotes are realistic and sources are credible. Focus exclusively on the chosen event to create a more targeted and impactful piece.${socialMediaContext}

When generating the article, first review your recent articles to avoid repetition, then choose the most appropriate event from your list, and focus the entire article on that specific event to create a more targeted and impactful story. After writing the article, re-scan the social media messages for any that may be related to your chosen event; include their numeric indices in the "potentialMessageIds" field.`;

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

      // Track KPI usage
      await KpiService.incrementFromOpenAIResponse(response);

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('No response content from AI service');
      }

      // Save the entire AI response to JSON file
      try {
        const responseFilePath = join(process.cwd(), 'api_responses', `article_from_events_${generationTime}.json`);
        await writeFile(responseFilePath, JSON.stringify(response, null, 2));
      } catch (error) {
        console.warn('Failed to save AI response to file:', error);
        // Continue with article generation even if file save fails
      }

      const parsedResponse = reporterArticleSchema.parse(JSON.parse(content));

      // Add generated fields
      parsedResponse.id = articleId;
      parsedResponse.reporterId = reporter.id;
      parsedResponse.generationTime = generationTime;
      parsedResponse.wordCount = parsedResponse.body.split(' ').length;

      return { response: parsedResponse, prompt: fullPrompt, messages: socialMediaMessages.map(x => x.text)} ;
    } catch (error) {
      console.error('Error generating article from events:', error);
      return null;
    }
  }
}
