import { createClient, RedisClientType } from 'redis';
import {
  Editor,
  Reporter,
  Article,
  NewspaperEdition,
  DailyEdition,
  AdEntry,
  User,
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
    try { await this.client.connect(); } catch (e) {console.log(e)}
    console.log('Connected to Redis');
  }

  async disconnect(): Promise<void> {
    // await this.client..disconnect();
    console.log('Disconnected from Redis');
  }

  // Getter for client access (used by AIService)
  getClient() {
    return this.client;
  }

  // Editor operations
  async saveEditor(editor: Editor): Promise<void> {
    const multi = this.client.multi();
    console.log('Redis Write: SET', REDIS_KEYS.EDITOR_BIO, editor.bio);
    multi.set(REDIS_KEYS.EDITOR_BIO, editor.bio);
    console.log('Redis Write: SET', REDIS_KEYS.EDITOR_PROMPT, editor.prompt);
    multi.set(REDIS_KEYS.EDITOR_PROMPT, editor.prompt);
    console.log('Redis Write: SET', REDIS_KEYS.MODEL_NAME, editor.modelName);
    multi.set(REDIS_KEYS.MODEL_NAME, editor.modelName);
    console.log('Redis Write: SET', REDIS_KEYS.EDITOR_MESSAGE_SLICE_COUNT, editor.messageSliceCount.toString());
    multi.set(REDIS_KEYS.EDITOR_MESSAGE_SLICE_COUNT, editor.messageSliceCount.toString());
    console.log('Redis Write: SET', REDIS_KEYS.ARTICLE_GENERATION_PERIOD_MINUTES, editor.articleGenerationPeriodMinutes.toString());
    multi.set(REDIS_KEYS.ARTICLE_GENERATION_PERIOD_MINUTES, editor.articleGenerationPeriodMinutes.toString());
    if (editor.lastArticleGenerationTime !== undefined) {
      console.log('Redis Write: SET', REDIS_KEYS.LAST_ARTICLE_GENERATION_TIME, editor.lastArticleGenerationTime.toString());
      multi.set(REDIS_KEYS.LAST_ARTICLE_GENERATION_TIME, editor.lastArticleGenerationTime.toString());
    }
    await multi.exec();
  }

  async getEditor(): Promise<Editor | null> {
    const [bio, prompt, modelName, messageSliceCountStr, articleGenerationPeriodMinutesStr, lastArticleGenerationTimeStr] = await Promise.all([
      this.client.get(REDIS_KEYS.EDITOR_BIO),
      this.client.get(REDIS_KEYS.EDITOR_PROMPT),
      this.client.get(REDIS_KEYS.MODEL_NAME),
      this.client.get(REDIS_KEYS.EDITOR_MESSAGE_SLICE_COUNT),
      this.client.get(REDIS_KEYS.ARTICLE_GENERATION_PERIOD_MINUTES),
      this.client.get(REDIS_KEYS.LAST_ARTICLE_GENERATION_TIME)
    ]);

    if (!bio || !prompt) return null;

    return {
      bio,
      prompt,
      modelName: modelName || 'gpt-5-nano', // Default fallback
      messageSliceCount: messageSliceCountStr ? parseInt(messageSliceCountStr) : 200, // Default fallback
      articleGenerationPeriodMinutes: articleGenerationPeriodMinutesStr ? parseInt(articleGenerationPeriodMinutesStr) : 15, // Default fallback
      lastArticleGenerationTime: lastArticleGenerationTimeStr ? parseInt(lastArticleGenerationTimeStr) : undefined // Optional field
    };
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
    console.log('Redis Write: SET', REDIS_KEYS.ARTICLE_MESSAGE_IDS(articleId), JSON.stringify(article.messageIds));
    multi.set(REDIS_KEYS.ARTICLE_MESSAGE_IDS(articleId), JSON.stringify(article.messageIds));
    console.log('Redis Write: SET', REDIS_KEYS.ARTICLE_MESSAGE_TEXTS(articleId), JSON.stringify(article.messageTexts));
    multi.set(REDIS_KEYS.ARTICLE_MESSAGE_TEXTS(articleId), JSON.stringify(article.messageTexts));

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

  async getAllArticles(limit?: number): Promise<Article[]> {
    const reporterIds = await this.client.sMembers(REDIS_KEYS.REPORTERS);

    // Collect all articles with their timestamps
    const allArticles: { article: Article; timestamp: number }[] = [];

    for (const reporterId of reporterIds) {
      const articleIds = await this.client.ZRANGE(
        REDIS_KEYS.ARTICLES_BY_REPORTER(reporterId),
        0,
        -1
      );

      for (const articleId of articleIds) {
        const article = await this.getArticle(articleId);
        if (article) {
          allArticles.push({
            article,
            timestamp: article.generationTime
          });
        }
      }
    }

    // Sort by timestamp (most recent first)
    allArticles.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit if specified
    const limitedArticles = limit ? allArticles.slice(0, limit) : allArticles;

    return limitedArticles.map(item => item.article);
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
    const [headline, body, timeStr, prompt, messageIdsJson, messageTextsJson] = await Promise.all([
      this.client.get(REDIS_KEYS.ARTICLE_HEADLINE(articleId)),
      this.client.get(REDIS_KEYS.ARTICLE_BODY(articleId)),
      this.client.get(REDIS_KEYS.ARTICLE_TIME(articleId)),
      this.client.get(REDIS_KEYS.ARTICLE_PROMPT(articleId)),
      this.client.get(REDIS_KEYS.ARTICLE_MESSAGE_IDS(articleId)),
      this.client.get(REDIS_KEYS.ARTICLE_MESSAGE_TEXTS(articleId))
    ]);

    if (!headline || !body || !timeStr) return null;

    // Extract reporter ID from the articles sorted set
    // This is a bit complex, we need to find which reporter this article belongs to
    const reporterId = await this.findReporterForArticle(articleId);
    if (!reporterId) return null;

    // Parse messageIds and messageTexts JSON
    let messageIds: number[] = [];
    let messageTexts: string[] = [];

    if (messageIdsJson) {
      try {
        messageIds = JSON.parse(messageIdsJson);
      } catch (error) {
        console.error('Error parsing messageIds JSON:', error);
        messageIds = [];
      }
    }

    if (messageTextsJson) {
      try {
        messageTexts = JSON.parse(messageTextsJson);
      } catch (error) {
        console.error('Error parsing messageTexts JSON:', error);
        messageTexts = [];
      }
    }

    return {
      id: articleId,
      reporterId,
      headline,
      body,
      generationTime: parseInt(timeStr),
      prompt: prompt || 'Prompt not available (generated before prompt storage was implemented)',
      messageIds,
      messageTexts
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
    console.log('Redis Write: SET', REDIS_KEYS.EDITION_PROMPT(editionId), edition.prompt);
    multi.set(REDIS_KEYS.EDITION_PROMPT(editionId), edition.prompt);

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
    const [stories, timeStr, prompt] = await Promise.all([
      this.client.sMembers(REDIS_KEYS.EDITION_STORIES(editionId)),
      this.client.get(REDIS_KEYS.EDITION_TIME(editionId)),
      this.client.get(REDIS_KEYS.EDITION_PROMPT(editionId))
    ]);

    if (!timeStr) return null;

    return {
      id: editionId,
      stories: stories || [],
      generationTime: parseInt(timeStr),
      prompt: prompt || 'Prompt not available (generated before prompt storage was implemented)'
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
    console.log('Redis Write: SET', REDIS_KEYS.DAILY_EDITION_PROMPT(dailyEditionId), dailyEdition.prompt);
    multi.set(REDIS_KEYS.DAILY_EDITION_PROMPT(dailyEditionId), dailyEdition.prompt);

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
      topicsJson,
      prompt
    ] = await Promise.all([
      this.client.sMembers(REDIS_KEYS.DAILY_EDITION_EDITIONS(dailyEditionId)),
      this.client.get(REDIS_KEYS.DAILY_EDITION_TIME(dailyEditionId)),
      this.client.get(`daily_edition:${dailyEditionId}:front_page_headline`),
      this.client.get(`daily_edition:${dailyEditionId}:front_page_article`),
      this.client.get(`daily_edition:${dailyEditionId}:newspaper_name`),
      this.client.get(`daily_edition:${dailyEditionId}:model_feedback_positive`),
      this.client.get(`daily_edition:${dailyEditionId}:model_feedback_negative`),
      this.client.get(`daily_edition:${dailyEditionId}:topics`),
      this.client.get(REDIS_KEYS.DAILY_EDITION_PROMPT(dailyEditionId))
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
      topics,
      prompt: prompt || 'Prompt not available (generated before prompt storage was implemented)'
    };
  }

  // Ad operations
  async saveAd(ad: AdEntry): Promise<void> {
    const adId = ad.id;
    const multi = this.client.multi();

    // Add to ads set
    console.log('Redis Write: SADD', REDIS_KEYS.ADS, adId);
    multi.sAdd(REDIS_KEYS.ADS, adId);

    // Store ad data
    console.log('Redis Write: SET', REDIS_KEYS.AD_NAME(adId), ad.name);
    multi.set(REDIS_KEYS.AD_NAME(adId), ad.name);
    console.log('Redis Write: SET', REDIS_KEYS.AD_BID_PRICE(adId), ad.bidPrice.toString());
    multi.set(REDIS_KEYS.AD_BID_PRICE(adId), ad.bidPrice.toString());
    console.log('Redis Write: SET', REDIS_KEYS.AD_PROMPT_CONTENT(adId), ad.promptContent);
    multi.set(REDIS_KEYS.AD_PROMPT_CONTENT(adId), ad.promptContent);
    console.log('Redis Write: SET', REDIS_KEYS.AD_USER_ID(adId), ad.userId);
    multi.set(REDIS_KEYS.AD_USER_ID(adId), ad.userId);

    await multi.exec();
  }

  async getAllAds(): Promise<AdEntry[]> {
    const adIds = await this.client.sMembers(REDIS_KEYS.ADS);
    const ads: AdEntry[] = [];

    for (const adId of adIds) {
      const ad = await this.getAd(adId);
      if (ad) {
        ads.push(ad);
      }
    }

    return ads;
  }

  async getMostRecentAd(): Promise<AdEntry | null> {
    const adIds = await this.client.sMembers(REDIS_KEYS.ADS);
    if (adIds.length === 0) return null;

    // Sort ad IDs by timestamp (extracted from ID format: ad_timestamp_random)
    const sortedAdIds = adIds.sort((a, b) => {
      const timestampA = parseInt(a.split('_')[1]);
      const timestampB = parseInt(b.split('_')[1]);
      return timestampB - timestampA; // Most recent first
    });

    return await this.getAd(sortedAdIds[0]);
  }

  async getAd(adId: string): Promise<AdEntry | null> {
    const [name, bidPriceStr, promptContent, userId] = await Promise.all([
      this.client.get(REDIS_KEYS.AD_NAME(adId)),
      this.client.get(REDIS_KEYS.AD_BID_PRICE(adId)),
      this.client.get(REDIS_KEYS.AD_PROMPT_CONTENT(adId)),
      this.client.get(REDIS_KEYS.AD_USER_ID(adId))
    ]);

    if (!name || !bidPriceStr || !promptContent || !userId) return null;

    return {
      id: adId,
      userId,
      name,
      bidPrice: parseFloat(bidPriceStr),
      promptContent
    };
  }

  async updateAd(adId: string, updates: Partial<Omit<AdEntry, 'id'>>): Promise<void> {
    const multi = this.client.multi();

    if (updates.name !== undefined) {
      console.log('Redis Write: SET', REDIS_KEYS.AD_NAME(adId), updates.name);
      multi.set(REDIS_KEYS.AD_NAME(adId), updates.name);
    }

    if (updates.bidPrice !== undefined) {
      console.log('Redis Write: SET', REDIS_KEYS.AD_BID_PRICE(adId), updates.bidPrice.toString());
      multi.set(REDIS_KEYS.AD_BID_PRICE(adId), updates.bidPrice.toString());
    }

    if (updates.promptContent !== undefined) {
      console.log('Redis Write: SET', REDIS_KEYS.AD_PROMPT_CONTENT(adId), updates.promptContent);
      multi.set(REDIS_KEYS.AD_PROMPT_CONTENT(adId), updates.promptContent);
    }

    if (updates.userId !== undefined) {
      console.log('Redis Write: SET', REDIS_KEYS.AD_USER_ID(adId), updates.userId);
      multi.set(REDIS_KEYS.AD_USER_ID(adId), updates.userId);
    }

    await multi.exec();
  }

  async deleteAd(adId: string): Promise<void> {
    const multi = this.client.multi();

    // Remove from ads set
    console.log('Redis Write: SREM', REDIS_KEYS.ADS, adId);
    multi.sRem(REDIS_KEYS.ADS, adId);

    // Delete ad data
    console.log('Redis Write: DEL', REDIS_KEYS.AD_NAME(adId));
    multi.del(REDIS_KEYS.AD_NAME(adId));
    console.log('Redis Write: DEL', REDIS_KEYS.AD_BID_PRICE(adId));
    multi.del(REDIS_KEYS.AD_BID_PRICE(adId));
    console.log('Redis Write: DEL', REDIS_KEYS.AD_PROMPT_CONTENT(adId));
    multi.del(REDIS_KEYS.AD_PROMPT_CONTENT(adId));
    console.log('Redis Write: DEL', REDIS_KEYS.AD_USER_ID(adId));
    multi.del(REDIS_KEYS.AD_USER_ID(adId));

    await multi.exec();
  }

  // User operations
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<User> {
    const userId = await this.generateId('user');
    const now = Date.now();
    const newUser: User = {
      ...user,
      id: userId,
      createdAt: now
    };

    const multi = this.client.multi();

    // Add to users set
    console.log('Redis Write: SADD', REDIS_KEYS.USERS, userId);
    multi.sAdd(REDIS_KEYS.USERS, userId);

    // Store user data
    console.log('Redis Write: SET', REDIS_KEYS.USER_EMAIL(userId), newUser.email);
    multi.set(REDIS_KEYS.USER_EMAIL(userId), newUser.email);
    console.log('Redis Write: SET', REDIS_KEYS.USER_PASSWORD_HASH(userId), newUser.passwordHash);
    multi.set(REDIS_KEYS.USER_PASSWORD_HASH(userId), newUser.passwordHash);
    console.log('Redis Write: SET', REDIS_KEYS.USER_ROLE(userId), newUser.role);
    multi.set(REDIS_KEYS.USER_ROLE(userId), newUser.role);
    console.log('Redis Write: SET', REDIS_KEYS.USER_CREATED_AT(userId), newUser.createdAt.toString());
    multi.set(REDIS_KEYS.USER_CREATED_AT(userId), newUser.createdAt.toString());
    console.log('Redis Write: SET', REDIS_KEYS.USER_HAS_READER(userId), newUser.hasReader.toString());
    multi.set(REDIS_KEYS.USER_HAS_READER(userId), newUser.hasReader.toString());
    console.log('Redis Write: SET', REDIS_KEYS.USER_HAS_REPORTER(userId), newUser.hasReporter.toString());
    multi.set(REDIS_KEYS.USER_HAS_REPORTER(userId), newUser.hasReporter.toString());
    console.log('Redis Write: SET', REDIS_KEYS.USER_HAS_EDITOR(userId), newUser.hasEditor.toString());
    multi.set(REDIS_KEYS.USER_HAS_EDITOR(userId), newUser.hasEditor.toString());

    // Create email to user ID mapping
    console.log('Redis Write: SET', REDIS_KEYS.USER_BY_EMAIL(newUser.email), userId);
    multi.set(REDIS_KEYS.USER_BY_EMAIL(newUser.email), userId);

    await multi.exec();

    return newUser;
  }

  async getUserById(userId: string): Promise<User | null> {
    const [email, passwordHash, role, createdAtStr, lastLoginAtStr, hasReaderStr, hasReporterStr, hasEditorStr] = await Promise.all([
      this.client.get(REDIS_KEYS.USER_EMAIL(userId)),
      this.client.get(REDIS_KEYS.USER_PASSWORD_HASH(userId)),
      this.client.get(REDIS_KEYS.USER_ROLE(userId)),
      this.client.get(REDIS_KEYS.USER_CREATED_AT(userId)),
      this.client.get(REDIS_KEYS.USER_LAST_LOGIN_AT(userId)),
      this.client.get(REDIS_KEYS.USER_HAS_READER(userId)),
      this.client.get(REDIS_KEYS.USER_HAS_REPORTER(userId)),
      this.client.get(REDIS_KEYS.USER_HAS_EDITOR(userId))
    ]);

    if (!email || !passwordHash || !role || !createdAtStr) return null;

    return {
      id: userId,
      email,
      passwordHash,
      role: role as User['role'],
      createdAt: parseInt(createdAtStr),
      lastLoginAt: lastLoginAtStr ? parseInt(lastLoginAtStr) : undefined,
      hasReader: hasReaderStr === 'true',
      hasReporter: hasReporterStr === 'true',
      hasEditor: hasEditorStr === 'true'
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userId = await this.client.get(REDIS_KEYS.USER_BY_EMAIL(email));
    if (!userId) return null;

    return await this.getUserById(userId);
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    const now = Date.now();
    console.log('Redis Write: SET', REDIS_KEYS.USER_LAST_LOGIN_AT(userId), now.toString());
    await this.client.set(REDIS_KEYS.USER_LAST_LOGIN_AT(userId), now.toString());
  }

  async getAllUsers(): Promise<User[]> {
    const userIds = await this.client.sMembers(REDIS_KEYS.USERS);
    const users: User[] = [];

    for (const userId of userIds) {
      const user = await this.getUserById(userId);
      if (user) {
        users.push(user);
      }
    }

    return users;
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) return;

    const multi = this.client.multi();

    // Remove from users set
    console.log('Redis Write: SREM', REDIS_KEYS.USERS, userId);
    multi.sRem(REDIS_KEYS.USERS, userId);

    // Delete user data
    console.log('Redis Write: DEL', REDIS_KEYS.USER_EMAIL(userId));
    multi.del(REDIS_KEYS.USER_EMAIL(userId));
    console.log('Redis Write: DEL', REDIS_KEYS.USER_PASSWORD_HASH(userId));
    multi.del(REDIS_KEYS.USER_PASSWORD_HASH(userId));
    console.log('Redis Write: DEL', REDIS_KEYS.USER_ROLE(userId));
    multi.del(REDIS_KEYS.USER_ROLE(userId));
    console.log('Redis Write: DEL', REDIS_KEYS.USER_CREATED_AT(userId));
    multi.del(REDIS_KEYS.USER_CREATED_AT(userId));
    console.log('Redis Write: DEL', REDIS_KEYS.USER_LAST_LOGIN_AT(userId));
    multi.del(REDIS_KEYS.USER_LAST_LOGIN_AT(userId));
    console.log('Redis Write: DEL', REDIS_KEYS.USER_HAS_READER(userId));
    multi.del(REDIS_KEYS.USER_HAS_READER(userId));
    console.log('Redis Write: DEL', REDIS_KEYS.USER_HAS_REPORTER(userId));
    multi.del(REDIS_KEYS.USER_HAS_REPORTER(userId));
    console.log('Redis Write: DEL', REDIS_KEYS.USER_HAS_EDITOR(userId));
    multi.del(REDIS_KEYS.USER_HAS_EDITOR(userId));

    // Delete email mapping
    console.log('Redis Write: DEL', REDIS_KEYS.USER_BY_EMAIL(user.email));
    multi.del(REDIS_KEYS.USER_BY_EMAIL(user.email));

    await multi.exec();
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
