import { Reporter, Article } from '../models/types';
import { RedisService } from './redis.service';
import { AIService } from './ai.service';
import { reporterResponseSchema } from '../models/schemas';

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

    // Generate 1-3 articles per reporter (simulating different stories from different beats)
    const numArticles = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numArticles; i++) {
      try {
        const structuredArticle = await this.aiService.generateStructuredArticle(reporter);
        // Convert structured article to simple Article format for storage
        const article: Article = {
          id: structuredArticle.id,
          reporterId: structuredArticle.reporterId,
          headline: structuredArticle.headline,
          body: `${structuredArticle.leadParagraph}\n\n${structuredArticle.body}`,
          generationTime: structuredArticle.generationTime
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

  async generateStructuredReporterResponse(reporterId: string): Promise<{
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
  }> {
    console.log(`Generating structured response for reporter ${reporterId}...`);

    // Get reporter information
    const reporter = await this.redisService.getReporter(reporterId);
    if (!reporter) {
      throw new Error(`Reporter ${reporterId} not found`);
    }

    try {
      // Use AIService method with reporterResponseSchema to generate the complete structured response
      const parsedResponse = await this.aiService.generateStructuredReporterResponse(reporter, reporterResponseSchema);

      // Add generated fields
      parsedResponse.reporterId = reporterId;
      parsedResponse.reporterName = `Reporter ${reporterId}`;
      parsedResponse.generationTimestamp = Date.now();

      // Add IDs and timestamps to articles
      parsedResponse.articles = parsedResponse.articles.map((article: any, index: number) => ({
        ...article,
        id: `article_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 8)}`,
        reporterId: reporterId,
        generationTime: Date.now()
      }));

      // Save articles to Redis (convert to simple Article format for storage)
      for (const structuredArticle of parsedResponse.articles) {
        const simpleArticle: Article = {
          id: structuredArticle.id,
          reporterId: structuredArticle.reporterId,
          headline: structuredArticle.headline,
          body: `${structuredArticle.leadParagraph}\n\n${structuredArticle.body}`,
          generationTime: structuredArticle.generationTime
        };
        await this.redisService.saveArticle(simpleArticle);
      }

      console.log(`Generated ${parsedResponse.articles.length} structured articles for reporter ${reporterId}`);
      return parsedResponse;
    } catch (error) {
      console.error('Error generating structured reporter response:', error);
      // Fallback to original implementation if schema-based generation fails
      return this.generateStructuredReporterResponseFallback(reporterId, reporter);
    }
  }

  private extractKeyThemes(content: string): string[] {
    // Simple theme extraction - in a real implementation, this could use NLP
    const themes = [];
    const keywords = ['technology', 'business', 'politics', 'economy', 'health', 'environment', 'sports', 'entertainment'];

    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword)) {
        themes.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }

    return themes.length > 0 ? themes : ['General News'];
  }

  private async generateReporterFeedback(
    reporter: Reporter,
    articles: any[],
    coverageSummary: any
  ): Promise<{
    positive: string;
    negative: string;
    suggestions: string;
  }> {
    try {
      // This would typically use AI to generate feedback, but for now we'll use simple logic
      const positive = `Successfully covered ${coverageSummary.beatsCovered.length} different beats with ${articles.length} well-structured articles.`;
      const negative = articles.length === 0 ? 'No articles were generated successfully.' : 'Some articles may benefit from additional fact-checking.';
      const suggestions = `Consider expanding coverage to include emerging trends in ${reporter.beats.join(', ')}.`;

      return { positive, negative, suggestions };
    } catch (error) {
      return {
        positive: 'Articles generated successfully',
        negative: 'Feedback generation encountered issues',
        suggestions: 'Review article quality and source diversity'
      };
    }
  }

  private async generateStructuredReporterResponseFallback(reporterId: string, reporter: Reporter): Promise<any> {
    console.log(`Using fallback implementation for reporter ${reporterId}...`);

    const generationTimestamp = Date.now();
    const structuredArticles = [];
    const beatsCovered = new Set<string>();
    const keyThemes = new Set<string>();
    let totalWordCount = 0;

    // Generate 1-3 structured articles per reporter
    const numArticles = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numArticles; i++) {
      try {
        const structuredArticle = await this.aiService.generateStructuredArticle(reporter);
        structuredArticles.push(structuredArticle);

        // Track coverage data
        beatsCovered.add(structuredArticle.beat);
        totalWordCount += structuredArticle.wordCount;

        // Extract key themes from article content (simplified)
        const themes = this.extractKeyThemes(structuredArticle.body);
        themes.forEach(theme => keyThemes.add(theme));

        console.log(`Generated structured article: "${structuredArticle.headline}"`);
      } catch (error) {
        console.error(`Failed to generate structured article ${i + 1} for reporter ${reporterId}:`, error);
      }
    }

    // Generate coverage summary and feedback
    const coverageSummary = {
      beatsCovered: Array.from(beatsCovered),
      totalWordCount,
      keyThemes: Array.from(keyThemes)
    };

    const modelFeedback = await this.generateReporterFeedback(reporter, structuredArticles, coverageSummary);

    const response = {
      reporterId,
      reporterName: `Reporter ${reporterId}`,
      articles: structuredArticles,
      totalArticlesGenerated: structuredArticles.length,
      generationTimestamp,
      coverageSummary,
      modelFeedback
    };

    // Save articles to Redis (convert to simple Article format for storage)
    for (const structuredArticle of structuredArticles) {
      const simpleArticle: Article = {
        id: structuredArticle.id,
        reporterId: structuredArticle.reporterId,
        headline: structuredArticle.headline,
        body: `${structuredArticle.leadParagraph}\n\n${structuredArticle.body}`,
        generationTime: structuredArticle.generationTime
      };
      await this.redisService.saveArticle(simpleArticle);
    }

    console.log(`Generated ${structuredArticles.length} structured articles for reporter ${reporterId} (fallback)`);
    return response;
  }
}
