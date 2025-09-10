import { Reporter, Article } from '../models/types';
import { RedisService } from './redis.service';
import { AIService } from './ai.service';
import { reporterResponseSchema } from '../models/schemas';

type StructuredArticle = Awaited<ReturnType<AIService['generateStructuredArticle']>>;

type StructuredReporterResponse = {
  reporterId: string;
  reporterName: string;
  articles: Array<{
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
  }>;
  totalArticlesGenerated: number;
  generationTimestamp: number;
  coverageSummary: {
    beatsCovered: string[];
    totalWordCount: number;
    keyThemes: string[];
  };
  modelFeedback: {
    positive: string;
    negative: string;
    suggestions: string;
  };
};

export class ReporterService {
  constructor(
    private redisService: RedisService,
    private aiService: AIService
  ) {}

  async generateArticlesForReporter(reporterId: string): Promise<Article[]> {
    console.log(`Reporter ${reporterId}: Starting article generation...`);

    // Get reporter information
    const reporter = await this.redisService.getReporter(reporterId);
    if (!reporter) {
      throw new Error(`Reporter ${reporterId} not found`);
    }

    console.log(`Reporter ${reporterId} covers beats: ${reporter.beats.join(', ')}`);

    // Generate articles based on beats
    const articles: Article[] = [];

    // Generate 1 article per reporter
    const numArticles = 1;

    for (let i = 0; i < numArticles; i++) {
      try {
        const structuredArticle = await this.aiService.generateStructuredArticle(reporter);
        // Extract message texts for the used message IDs
        const messageTexts: string[] = [];
        if (structuredArticle.response.messageIds && structuredArticle.response.messageIds.length > 0) {
          // Note: In a real implementation, we would need access to the original messages
          // For now, we'll store the messageIds and leave messageTexts empty
          // The message texts would need to be retrieved from the MCP client or cached
          console.log(`Article used message IDs: ${structuredArticle.response.messageIds.join(', ')}`);
          structuredArticle.response.messageIds.forEach(x => messageTexts.push(structuredArticle.messages[x-1])); // -1 because ai service does a +1
        }

        // Convert structured article to simple Article format for storage
        const article: Article = {
          id: structuredArticle.response.id,
          reporterId: structuredArticle.response.reporterId,
          headline: structuredArticle.response.headline,
          body: `${structuredArticle.response.leadParagraph}\n\n${structuredArticle.response.body}`,
          generationTime: structuredArticle.response.generationTime,
          prompt: structuredArticle.prompt,
          messageIds: structuredArticle.response.messageIds || [],
          messageTexts: messageTexts
        };
        articles.push(article);
        console.log(`Generated article: "${article.headline}"`);
      } catch (error) {
        console.error(`Failed to generate article ${i + 1} for reporter ${reporterId}:`, error);
      }
    }

    // Save all articles
    for (const article of articles) {
      await this.redisService.saveArticle(article);
    }

    console.log(`Reporter ${reporterId} generated ${articles.length} articles`);
    return articles;
  }

  async generateAllReporterArticles(): Promise<{ [reporterId: string]: Article[] }> {
    console.log('Starting article generation for all reporters...');

    // Get all reporters
    const reporters = await this.redisService.getAllReporters();
    if (reporters.length === 0) {
      throw new Error('No reporters available to generate articles');
    }

    console.log(`Found ${reporters.length} reporters`);

    const results: { [reporterId: string]: Article[] } = {};

    // Generate articles for each reporter
    for (const reporter of reporters) {
      try {
        const articles = await this.generateArticlesForReporter(reporter.id);
        results[reporter.id] = articles;
      } catch (error) {
        console.error(`Failed to generate articles for reporter ${reporter.id}:`, error);
        results[reporter.id] = [];
      }
    }

    const totalArticles = Object.values(results).reduce((sum, articles) => sum + articles.length, 0);
    console.log(`Generated ${totalArticles} articles across ${reporters.length} reporters`);

    return results;
  }

  async getReporterArticles(reporterId: string, limit?: number): Promise<Article[]> {
    return await this.redisService.getArticlesByReporter(reporterId, limit);
  }

  async getAllReporterStats(): Promise<{ [reporterId: string]: { reporter: Reporter; articleCount: number; latestArticle?: Article } }> {
    const reporters = await this.redisService.getAllReporters();
    const stats: { [reporterId: string]: { reporter: Reporter; articleCount: number; latestArticle?: Article } } = {};

    for (const reporter of reporters) {
      const articles = await this.redisService.getArticlesByReporter(reporter.id, 1);
      stats[reporter.id] = {
        reporter,
        articleCount: await this.getArticleCountForReporter(reporter.id),
        latestArticle: articles.length > 0 ? articles[0] : undefined
      };
    }

    return stats;
  }

  private async getArticleCountForReporter(reporterId: string): Promise<number> {
    // This is a simplified count - in a real implementation, you might want to cache this
    const articles = await this.redisService.getArticlesByReporter(reporterId);
    return articles.length;
  }

  async createReporter(reporterData: Omit<Reporter, 'id'>): Promise<Reporter> {
    const reporterId = await this.redisService.generateId('reporter');
    const reporter: Reporter = {
      id: reporterId,
      ...reporterData
    };

    await this.redisService.saveReporter(reporter);
    console.log(`Created new reporter: ${reporterId} (${reporter.beats.join(', ')})`);

    return reporter;
  }

  async updateReporter(reporterId: string, updates: Partial<Omit<Reporter, 'id'>>): Promise<Reporter | null> {
    const existingReporter = await this.redisService.getReporter(reporterId);
    if (!existingReporter) {
      return null;
    }

    const updatedReporter: Reporter = {
      ...existingReporter,
      ...updates
    };

    await this.redisService.saveReporter(updatedReporter);
    console.log(`Updated reporter: ${reporterId}`);

    return updatedReporter;
  }

  async deleteReporter(reporterId: string): Promise<boolean> {
    const reporter = await this.redisService.getReporter(reporterId);
    if (!reporter) {
      return false;
    }

    // Note: In a real implementation, you might want to handle cleanup of associated articles
    // For now, we'll just remove the reporter from the set
    // The articles will remain but become orphaned

    const reporters = await this.redisService.getAllReporters();
    const updatedReporters = reporters.filter(r => r.id !== reporterId);

    // Clear and repopulate the reporters set
    // This is a simplified approach - in production, you'd want atomic operations
    await this.redisService.clearAllData();

    // Recreate all reporters except the deleted one
    for (const r of updatedReporters) {
      await this.redisService.saveReporter(r);
    }

    console.log(`Deleted reporter: ${reporterId}`);
    return true;
  }
}
