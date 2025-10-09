import { RedisClientType } from 'redis';
import {
  Editor,
  Reporter,
  Article,
  NewspaperEdition,
  DailyEdition,
  Event,
  AdEntry,
  User
} from '../models/types';

export interface IDataStorageService {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getClient(): RedisClientType;

  // Editor operations
  saveEditor(editor: Editor): Promise<void>;
  getEditor(): Promise<Editor | null>;

  // Reporter operations
  saveReporter(reporter: Reporter): Promise<void>;
  getAllReporters(): Promise<Reporter[]>;
  getReporter(id: string): Promise<Reporter | null>;

  // Article operations
  saveArticle(article: Article): Promise<void>;
  getArticlesByReporter(reporterId: string, limit?: number): Promise<Article[]>;
  getAllArticles(limit?: number): Promise<Article[]>;
  getArticlesInTimeRange(reporterId: string, startTime: number, endTime: number): Promise<Article[]>;
  getArticle(articleId: string): Promise<Article | null>;

  // Event operations
  saveEvent(event: Event): Promise<void>;
  getEventsByReporter(reporterId: string, limit?: number): Promise<Event[]>;
  getAllEvents(limit?: number): Promise<Event[]>;
  getLatestUpdatedEvents(limit?: number): Promise<Event[]>;
  getEvent(eventId: string): Promise<Event | null>;
  updateEventFacts(eventId: string, newFacts: string[]): Promise<void>;

  // Newspaper Edition operations
  saveNewspaperEdition(edition: NewspaperEdition): Promise<void>;
  getNewspaperEditions(limit?: number): Promise<NewspaperEdition[]>;
  getNewspaperEdition(editionId: string): Promise<NewspaperEdition | null>;

  // Daily Edition operations
  saveDailyEdition(dailyEdition: DailyEdition): Promise<void>;
  getDailyEditions(limit?: number): Promise<DailyEdition[]>;
  getDailyEdition(dailyEditionId: string): Promise<DailyEdition | null>;

  // Ad operations
  saveAd(ad: AdEntry): Promise<void>;
  getAllAds(): Promise<AdEntry[]>;
  getMostRecentAd(): Promise<AdEntry | null>;
  getAd(adId: string): Promise<AdEntry | null>;
  updateAd(adId: string, updates: Partial<Omit<AdEntry, 'id'>>): Promise<void>;
  deleteAd(adId: string): Promise<void>;

  // User operations
  createUser(user: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<User>;
  getUserById(userId: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUserLastLogin(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<void>;

  // Job status operations
  setJobRunning(jobName: string, running: boolean): Promise<void>;
  getJobRunning(jobName: string): Promise<boolean>;
  setJobLastRun(jobName: string, timestamp: number): Promise<void>;
  getJobLastRun(jobName: string): Promise<number | null>;
  setJobLastSuccess(jobName: string, timestamp: number): Promise<void>;
  getJobLastSuccess(jobName: string): Promise<number | null>;

  // KPI operations
  getKpiValue(kpiName: string): Promise<number>;
  setKpiValue(kpiName: string, value: number): Promise<void>;
  incrementKpiValue(kpiName: string, increment: number): Promise<void>;

  // Utility methods
  generateId(prefix: string): Promise<string>;
  clearAllData(): Promise<void>;
}