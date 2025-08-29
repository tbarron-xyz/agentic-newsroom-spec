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
}

export interface NewspaperEdition {
  id: string;
  stories: string[]; // article IDs
  generationTime: number; // milliseconds since epoch
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

  // Newspaper Editions
  EDITIONS: 'editions',
  EDITION_STORIES: (editionId: string) => `edition:${editionId}:stories`,
  EDITION_TIME: (editionId: string) => `edition:${editionId}:time`,

  // Daily Editions
  DAILY_EDITIONS: 'daily_editions',
  DAILY_EDITION_EDITIONS: (dailyEditionId: string) => `daily_edition:${dailyEditionId}:editions`,
  DAILY_EDITION_TIME: (dailyEditionId: string) => `daily_edition:${dailyEditionId}:time`,
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
