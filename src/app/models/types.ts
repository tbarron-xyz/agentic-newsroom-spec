export interface Editor {
  bio: string;
  prompt: string;
}

export interface Reporter {
  id: string;
  beats: string[];
  prompt: string;
}

export interface Article {
  id: string;
  reporterId: string;
  headline: string;
  body: string;
  generationTime: number; // milliseconds since epoch
  prompt: string; // The full prompt used to generate this article
}

export interface NewspaperEdition {
  id: string;
  stories: string[]; // article IDs
  generationTime: number; // milliseconds since epoch
  prompt: string; // The full prompt used to generate this edition
}

export interface DailyEdition {
  id: string;
  editions: string[]; // edition IDs
  generationTime: number; // milliseconds since epoch
  // New detailed content from AI service
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
  modelFeedbackAboutThePrompt: {
    positive: string;
    negative: string;
  };
  newspaperName: string;
  prompt: string; // The full prompt used to generate this daily edition
}

export interface AdEntry {
  id: string;
  userId: string;
  name: string;
  bidPrice: number;
  promptContent: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'editor' | 'reporter' | 'user';
  createdAt: number;
  lastLoginAt?: number;
}

// Redis key patterns
export const REDIS_KEYS = {
  // Editor
  EDITOR_BIO: 'editor:bio',
  EDITOR_PROMPT: 'editor:prompt',

  // Reporters
  REPORTERS: 'reporters',
  REPORTER_BEATS: (id: string) => `reporter:${id}:beats`,
  REPORTER_PROMPT: (id: string) => `reporter:${id}:prompt`,

  // Articles
  ARTICLES_BY_REPORTER: (reporterId: string) => `articles:${reporterId}`,
  ARTICLE_HEADLINE: (articleId: string) => `article:${articleId}:headline`,
  ARTICLE_BODY: (articleId: string) => `article:${articleId}:body`,
  ARTICLE_TIME: (articleId: string) => `article:${articleId}:time`,
  ARTICLE_PROMPT: (articleId: string) => `article:${articleId}:prompt`,

  // Newspaper Editions
  EDITIONS: 'editions',
  EDITION_STORIES: (editionId: string) => `edition:${editionId}:stories`,
  EDITION_TIME: (editionId: string) => `edition:${editionId}:time`,
  EDITION_PROMPT: (editionId: string) => `edition:${editionId}:prompt`,

  // Daily Editions
  DAILY_EDITIONS: 'daily_editions',
  DAILY_EDITION_EDITIONS: (dailyEditionId: string) => `daily_edition:${dailyEditionId}:editions`,
  DAILY_EDITION_TIME: (dailyEditionId: string) => `daily_edition:${dailyEditionId}:time`,
  DAILY_EDITION_PROMPT: (dailyEditionId: string) => `daily_edition:${dailyEditionId}:prompt`,

  // Ads
  ADS: 'ads',
  AD_NAME: (adId: string) => `ad:${adId}:name`,
  AD_BID_PRICE: (adId: string) => `ad:${adId}:bid_price`,
  AD_PROMPT_CONTENT: (adId: string) => `ad:${adId}:prompt_content`,
  AD_USER_ID: (adId: string) => `ad:${adId}:user_id`,

  // Users
  USERS: 'users',
  USER_EMAIL: (userId: string) => `user:${userId}:email`,
  USER_PASSWORD_HASH: (userId: string) => `user:${userId}:password_hash`,
  USER_ROLE: (userId: string) => `user:${userId}:role`,
  USER_CREATED_AT: (userId: string) => `user:${userId}:created_at`,
  USER_LAST_LOGIN_AT: (userId: string) => `user:${userId}:last_login_at`,
  USER_BY_EMAIL: (email: string) => `user_by_email:${email}`,
} as const;

// Utility types for Redis operations
export interface RedisArticleData {
  id: string;
  headline: string;
  body: string;
  time: number;
}

export interface RedisEditionData {
  id: string;
  stories: string[];
  time: number;
}

export interface RedisDailyEditionData {
  id: string;
  editions: string[];
  time: number;
}
