import { createClient, RedisClientType } from 'redis';
import {
  Editor,
  Reporter,
  Article,
  NewspaperEdition,
  DailyEdition,
  REDIS_KEYS
} from '../models/types';

export class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: 'redis://localhost:6379',
      // Add username/password if needed
      // username: 'default',
      // password: 'yourpassword'
    });

    this.client.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    console.log('Connected to Redis');
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
    console.log('Disconnected from Redis');
  }

  // Editor operations
  async saveEditor(editor: Editor): Promise<void> {
    const multi = this.client.multi();
    console.log('Redis Write: SET', REDIS_KEYS.EDITOR_BIO, editor.bio);
    multi.set(REDIS_KEYS.EDITOR_BIO, editor.bio);
    console.log('Redis Write: SET', REDIS_KEYS.EDITOR_PROMPT, editor.prompt);
    multi.set(REDIS_KEYS.EDITOR_PROMPT, editor.prompt);
    await multi.exec();
  }

  async getEditor(): Promise<Editor | null> {
    const [bio, prompt] = await Promise.all([
      this.client.get(REDIS_KEYS.EDITOR_BIO),
      this.client.get(REDIS_KEYS.EDITOR_PROMPT)
    ]);

    if (!bio || !prompt) return null;

    return { bio, prompt };
  }

  // Reporter operations
  async saveReporter(reporter: Reporter): Promise<void> {
    const multi = this.client.multi();
    console.log('Redis Write: SADD', REDIS_KEYS.REPORTERS, reporter.id);
    multi.sAdd(REDIS_KEYS.REPORTERS, reporter.id);
    console.log('Redis Write: DEL', REDIS_KEYS.REPORTER_BEATS(reporter.id));
    multi.del(REDIS_KEYS.REPORTER_BEATS(reporter.id));
    reporter.beats.forEach(beat => {
      console.log('Redis Write: SADD', REDIS_KEYS.REPORTER_BEATS(reporter.id), beat);
      multi.sAdd(REDIS_KEYS.REPORTER_BEATS(reporter.id), beat);
    });
    console.log('Redis Write: SET', REDIS_KEYS.REPORTER_PROMPT(reporter.id), reporter.prompt);
    multi.set(REDIS_KEYS.REPORTER_PROMPT(reporter.id), reporter.prompt);
    await multi.exec();
  }

  async getAllReporters(): Promise<Reporter[]> {
    const reporterIds = await this.client.sMembers(REDIS_KEYS.REPORTERS);
    const reporters: Reporter[] = [];

    for (const id of reporterIds) {
      const reporter = await this.getReporter(id);
      if (reporter) {
        reporters.push(reporter);
      }
    }

    return reporters;
  }

  async getReporter(id: string): Promise<Reporter | null> {
    const [beats, prompt] = await Promise.all([
      this.client.sMembers(REDIS_KEYS.REPORTER_BEATS(id)),
      this.client.get(REDIS_KEYS.REPORTER_PROMPT(id))
    ]);

    if (!prompt) return null;

    return {
      id,
      beats,
      prompt
    };
  }

  // Article operations
  async saveArticle(article: Article): Promise<void> {
    const articleId = article.id;
    const multi = this.client.multi();

    // Add to reporter's article sorted set
    console.log('Redis Write: ZADD', REDIS_KEYS.ARTICLES_BY_REPORTER(article.reporterId), {
      score: article.generationTime,
      value: articleId
    });
    multi.zAdd(REDIS_KEYS.ARTICLES_BY_REPORTER(article.reporterId), {
      score: article.generationTime,
      value: articleId
    });

    // Store article data
    console.log('Redis Write: SET', REDIS_KEYS.ARTICLE_HEADLINE(articleId), article.headline);
    multi.set(REDIS_KEYS.ARTICLE_HEADLINE(articleId), article.headline);
    console.log('Redis Write: SET', REDIS_KEYS.ARTICLE_BODY(articleId), article.body);
    multi.set(REDIS_KEYS.ARTICLE_BODY(articleId), article.body);
    console.log('Redis Write: SET', REDIS_KEYS.ARTICLE_TIME(articleId), article.generationTime.toString());
    multi.set(REDIS_KEYS.ARTICLE_TIME(articleId), article.generationTime.toString());
    console.log('Redis Write: SET', REDIS_KEYS.ARTICLE_PROMPT(articleId), article.prompt);
    multi.set(REDIS_KEYS.ARTICLE_PROMPT(articleId), article.prompt);

    await multi.exec();
  }

  async getArticlesByReporter(reporterId: string, limit?: number): Promise<Article[]> {
    const count = limit || -1;
    const articleIds = await this.client.ZRANGE(
      REDIS_KEYS.ARTICLES_BY_REPORTER(reporterId),
      0,
      count - 1
    );
    // Reverse to get most recent first
    articleIds.reverse();

    const articles: Article[] = [];
    for (const articleId of articleIds) {
      const article = await this.getArticle(articleId);
      if (article) {
        articles.push(article);
      }
    }

    return articles;
  }

  async getArticlesInTimeRange(reporterId: string, startTime: number, endTime: number): Promise<Article[]> {
    const articleIds = await this.client.zRangeByScore(
      REDIS_KEYS.ARTICLES_BY_REPORTER(reporterId),
      startTime,
      endTime
    );

    const articles: Article[] = [];
    for (const articleId of articleIds) {
      const article = await this.getArticle(articleId);
      if (article) {
        articles.push(article);
      }
    }

    return articles;
  }

  async getArticle(articleId: string): Promise<Article | null> {
    const [headline, body, timeStr, prompt] = await Promise.all([
      this.client.get(REDIS_KEYS.ARTICLE_HEADLINE(articleId)),
      this.client.get(REDIS_KEYS.ARTICLE_BODY(articleId)),
      this.client.get(REDIS_KEYS.ARTICLE_TIME(articleId)),
      this.client.get(REDIS_KEYS.ARTICLE_PROMPT(articleId))
    ]);

    if (!headline || !body || !timeStr) return null;

    // Extract reporter ID from the articles sorted set
    // This is a bit complex, we need to find which reporter this article belongs to
    const reporterId = await this.findReporterForArticle(articleId);
    if (!reporterId) return null;

    return {
      id: articleId,
      reporterId,
      headline,
      body,
      generationTime: parseInt(timeStr),
      prompt: prompt || 'Prompt not available (generated before prompt storage was implemented)'
    };
  }

  private async findReporterForArticle(articleId: string): Promise<string | null> {
    const reporterIds = await this.client.sMembers(REDIS_KEYS.REPORTERS);

    for (const reporterId of reporterIds) {
      const exists = await this.client.zScore(REDIS_KEYS.ARTICLES_BY_REPORTER(reporterId), articleId);
      if (exists !== null) {
        return reporterId;
      }
    }

    return null;
  }

  // Newspaper Edition operations
  async saveNewspaperEdition(edition: NewspaperEdition): Promise<void> {
    const editionId = edition.id;
    const multi = this.client.multi();

    // Add to editions sorted set
    console.log('Redis Write: ZADD', REDIS_KEYS.EDITIONS, {
      score: edition.generationTime,
      value: editionId
    });
    multi.zAdd(REDIS_KEYS.EDITIONS, {
      score: edition.generationTime,
      value: editionId
    });

    // Store edition data
    console.log('Redis Write: DEL', REDIS_KEYS.EDITION_STORIES(editionId));
    multi.del(REDIS_KEYS.EDITION_STORIES(editionId));
    edition.stories.forEach(storyId => {
      console.log('Redis Write: SADD', REDIS_KEYS.EDITION_STORIES(editionId), storyId);
      multi.sAdd(REDIS_KEYS.EDITION_STORIES(editionId), storyId);
    });
    console.log('Redis Write: SET', REDIS_KEYS.EDITION_TIME(editionId), edition.generationTime.toString());
    multi.set(REDIS_KEYS.EDITION_TIME(editionId), edition.generationTime.toString());

    await multi.exec();
  }

  async getNewspaperEditions(limit?: number): Promise<NewspaperEdition[]> {
    const count = limit || -1;
    const editionIds = await this.client.ZRANGE(REDIS_KEYS.EDITIONS, 0, count == -1 ? count : count - 1);
    // Reverse to get most recent first
    editionIds.reverse();

    const editions: NewspaperEdition[] = [];
    for (const editionId of editionIds) {
      const edition = await this.getNewspaperEdition(editionId);
      if (edition) {
        editions.push(edition);
      }
    }

    return editions;
  }

  async getNewspaperEdition(editionId: string): Promise<NewspaperEdition | null> {
    const [stories, timeStr] = await Promise.all([
      this.client.sMembers(REDIS_KEYS.EDITION_STORIES(editionId)),
      this.client.get(REDIS_KEYS.EDITION_TIME(editionId))
    ]);

    if (!timeStr) return null;

    return {
      id: editionId,
      stories: stories || [],
      generationTime: parseInt(timeStr)
    };
  }

  // Daily Edition operations
  async saveDailyEdition(dailyEdition: DailyEdition): Promise<void> {
    const dailyEditionId = dailyEdition.id;
    const multi = this.client.multi();

    // Add to daily editions sorted set
    console.log('Redis Write: ZADD', REDIS_KEYS.DAILY_EDITIONS, {
      score: dailyEdition.generationTime,
      value: dailyEditionId
    });
    multi.zAdd(REDIS_KEYS.DAILY_EDITIONS, {
      score: dailyEdition.generationTime,
      value: dailyEditionId
    });

    // Store daily edition data
    console.log('Redis Write: DEL', REDIS_KEYS.DAILY_EDITION_EDITIONS(dailyEditionId));
    multi.del(REDIS_KEYS.DAILY_EDITION_EDITIONS(dailyEditionId));
    dailyEdition.editions.forEach(editionId => {
      console.log('Redis Write: SADD', REDIS_KEYS.DAILY_EDITION_EDITIONS(dailyEditionId), editionId);
      multi.sAdd(REDIS_KEYS.DAILY_EDITION_EDITIONS(dailyEditionId), editionId);
    });
    console.log('Redis Write: SET', REDIS_KEYS.DAILY_EDITION_TIME(dailyEditionId), dailyEdition.generationTime.toString());
    multi.set(REDIS_KEYS.DAILY_EDITION_TIME(dailyEditionId), dailyEdition.generationTime.toString());

    // Store new detailed content fields
    console.log('Redis Write: SET', `daily_edition:${dailyEditionId}:front_page_headline`, dailyEdition.frontPageHeadline);
    multi.set(`daily_edition:${dailyEditionId}:front_page_headline`, dailyEdition.frontPageHeadline);
    console.log('Redis Write: SET', `daily_edition:${dailyEditionId}:front_page_article`, dailyEdition.frontPageArticle);
    multi.set(`daily_edition:${dailyEditionId}:front_page_article`, dailyEdition.frontPageArticle);
    console.log('Redis Write: SET', `daily_edition:${dailyEditionId}:newspaper_name`, dailyEdition.newspaperName);
    multi.set(`daily_edition:${dailyEditionId}:newspaper_name`, dailyEdition.newspaperName);

    // Store model feedback
    console.log('Redis Write: SET', `daily_edition:${dailyEditionId}:model_feedback_positive`, dailyEdition.modelFeedbackAboutThePrompt.positive);
    multi.set(`daily_edition:${dailyEditionId}:model_feedback_positive`, dailyEdition.modelFeedbackAboutThePrompt.positive);
    console.log('Redis Write: SET', `daily_edition:${dailyEditionId}:model_feedback_negative`, dailyEdition.modelFeedbackAboutThePrompt.negative);
    multi.set(`daily_edition:${dailyEditionId}:model_feedback_negative`, dailyEdition.modelFeedbackAboutThePrompt.negative);

    // Store topics as JSON
    console.log('Redis Write: SET', `daily_edition:${dailyEditionId}:topics`, JSON.stringify(dailyEdition.topics));
    multi.set(`daily_edition:${dailyEditionId}:topics`, JSON.stringify(dailyEdition.topics));

    await multi.exec();
  }

  async getDailyEditions(limit?: number): Promise<DailyEdition[]> {
    const count = limit || -1;
    const dailyEditionIds = await this.client.ZRANGE(REDIS_KEYS.DAILY_EDITIONS, 0, count == -1 ? count : count - 1);
    // Reverse to get most recent first
    dailyEditionIds.reverse();

    const dailyEditions: DailyEdition[] = [];
    for (const dailyEditionId of dailyEditionIds) {
      const dailyEdition = await this.getDailyEdition(dailyEditionId);
      if (dailyEdition) {
        dailyEditions.push(dailyEdition);
      }
    }

    return dailyEditions;
  }

  async getDailyEdition(dailyEditionId: string): Promise<DailyEdition | null> {
    const [
      editions,
      timeStr,
      frontPageHeadline,
      frontPageArticle,
      newspaperName,
      modelFeedbackPositive,
      modelFeedbackNegative,
      topicsJson
    ] = await Promise.all([
      this.client.sMembers(REDIS_KEYS.DAILY_EDITION_EDITIONS(dailyEditionId)),
      this.client.get(REDIS_KEYS.DAILY_EDITION_TIME(dailyEditionId)),
      this.client.get(`daily_edition:${dailyEditionId}:front_page_headline`),
      this.client.get(`daily_edition:${dailyEditionId}:front_page_article`),
      this.client.get(`daily_edition:${dailyEditionId}:newspaper_name`),
      this.client.get(`daily_edition:${dailyEditionId}:model_feedback_positive`),
      this.client.get(`daily_edition:${dailyEditionId}:model_feedback_negative`),
      this.client.get(`daily_edition:${dailyEditionId}:topics`)
    ]);

    if (!timeStr) return null;

    // Parse topics JSON
    let topics: DailyEdition['topics'] = [];
    if (topicsJson) {
      try {
        topics = JSON.parse(topicsJson);
      } catch (error) {
        console.error('Error parsing topics JSON:', error);
        topics = [];
      }
    }

    return {
      id: dailyEditionId,
      editions,
      generationTime: parseInt(timeStr),
      frontPageHeadline: frontPageHeadline || '',
      frontPageArticle: frontPageArticle || '',
      newspaperName: newspaperName || 'Daily Gazette',
      modelFeedbackAboutThePrompt: {
        positive: modelFeedbackPositive || '',
        negative: modelFeedbackNegative || ''
      },
      topics
    };
  }

  // Utility methods
  async generateId(prefix: string): Promise<string> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  async clearAllData(): Promise<void> {
    await this.client.flushAll();
  }
}
