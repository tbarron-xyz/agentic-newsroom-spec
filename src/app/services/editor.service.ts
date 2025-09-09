import { NewspaperEdition, DailyEdition, Article } from '../models/types';
import { RedisService } from './redis.service';
import { AIService } from './ai.service';

export class EditorService {
  constructor(
    private redisService: RedisService,
    private aiService: AIService
  ) {}

  async generateHourlyEdition(): Promise<NewspaperEdition> {
    console.log('Editor: Starting newspaper edition generation...');

    // Get all reporters
    const reporters = await this.redisService.getAllReporters();
    if (reporters.length === 0) {
      throw new Error('No reporters available to generate articles');
    }

    // Get articles from the last 3 hours
    const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
    const allRecentArticles: Article[] = [];

    for (const reporter of reporters) {
      const articles = await this.redisService.getArticlesInTimeRange(
        reporter.id,
        threeHoursAgo,
        Date.now()
      );
      allRecentArticles.push(...articles);
    }

    if (allRecentArticles.length === 0) {
      throw new Error('No articles found in the last 3 hours');
    }

    console.log(`Found ${allRecentArticles.length} articles from the last 3 hours`);

    // Get editor information
    const editor = await this.redisService.getEditor();
    if (!editor) {
      throw new Error('No editor configuration found');
    }

    // Use AI to select newsworthy stories
    const { selectedArticles, fullPrompt } = await this.aiService.selectNewsworthyStories(
      allRecentArticles,
      editor.prompt
    );

    console.log(`Selected ${selectedArticles.length} newsworthy stories for the edition`);

    // Create newspaper edition
    const editionId = await this.redisService.generateId('edition');
    const edition: NewspaperEdition = {
      id: editionId,
      stories: selectedArticles.map(article => article.id),
      generationTime: Date.now(),
      prompt: fullPrompt
    };

    // Save the edition
    await this.redisService.saveNewspaperEdition(edition);

    console.log(`Newspaper edition ${editionId} generated with ${selectedArticles.length} stories`);
    return edition;
  }

  async generateDailyEdition(): Promise<DailyEdition> {
    console.log('Editor: Starting daily edition generation...');

    // Get newspaper editions from the last 24 hours
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentEditions = await this.redisService.getNewspaperEditions();

    // Filter to only editions from the last 24 hours
    const last24HoursEditions = recentEditions.filter(
      edition => edition.generationTime >= twentyFourHoursAgo
    );

    if (last24HoursEditions.length === 0) {
      throw new Error('No newspaper editions found in the last 24 hours');
    }

    console.log(`Found ${last24HoursEditions.length} newspaper editions from the last 24 hours`);

    // Get editor information
    const editor = await this.redisService.getEditor();
    if (!editor) {
      throw new Error('No editor configuration found');
    }

    // Prepare detailed edition information with articles
    const detailedEditions = await Promise.all(
      last24HoursEditions.map(async (edition) => {
        const articles: Array<{headline: string; body: string}> = [];
        for (const articleId of edition.stories) {
          const article = await this.redisService.getArticle(articleId);
          if (article) {
            articles.push({
              headline: article.headline,
              body: article.body
            });
          }
        }
        return {
          id: edition.id,
          articles
        };
      })
    );

    // Use AI to generate comprehensive daily edition content
    const { content: dailyEditionContent, fullPrompt } = await this.aiService.selectNotableEditions(
      detailedEditions,
      editor.prompt
    );

    console.log(`Generated comprehensive daily edition with ${dailyEditionContent.topics.length} topics`);

    // Create daily edition with the new detailed format
    const dailyEditionId = await this.redisService.generateId('daily_edition');
    const dailyEdition: DailyEdition = {
      id: dailyEditionId,
      editions: last24HoursEditions.map(edition => edition.id), // Keep all edition IDs for reference
      generationTime: Date.now(),
      // Add the new detailed content
      frontPageHeadline: dailyEditionContent.frontPageHeadline,
      frontPageArticle: dailyEditionContent.frontPageArticle,
      topics: dailyEditionContent.topics,
      modelFeedbackAboutThePrompt: dailyEditionContent.modelFeedbackAboutThePrompt,
      newspaperName: dailyEditionContent.newspaperName,
      prompt: fullPrompt
    };

    // Save the daily edition
    await this.redisService.saveDailyEdition(dailyEdition);

    console.log(`Daily edition ${dailyEditionId} generated with comprehensive content for ${dailyEditionContent.newspaperName}`);
    return dailyEdition;
  }

  async getLatestNewspaperEdition(): Promise<NewspaperEdition | null> {
    const editions = await this.redisService.getNewspaperEditions(1);
    return editions.length > 0 ? editions[0] : null;
  }

  async getLatestDailyEdition(): Promise<DailyEdition | null> {
    const dailyEditions = await this.redisService.getDailyEditions(1);
    return dailyEditions.length > 0 ? dailyEditions[0] : null;
  }

  async getEditionWithArticles(editionId: string): Promise<{ edition: NewspaperEdition; articles: Article[] } | null> {
    const edition = await this.redisService.getNewspaperEdition(editionId);
    if (!edition) return null;

    const articles: Article[] = [];
    for (const articleId of edition.stories) {
      const article = await this.redisService.getArticle(articleId);
      if (article) {
        articles.push(article);
      }
    }

    return { edition, articles };
  }

  async getDailyEditionWithEditions(dailyEditionId: string): Promise<{ dailyEdition: DailyEdition; editions: NewspaperEdition[] } | null> {
    const dailyEdition = await this.redisService.getDailyEdition(dailyEditionId);
    if (!dailyEdition) return null;

    const editions: NewspaperEdition[] = [];
    for (const editionId of dailyEdition.editions) {
      const edition = await this.redisService.getNewspaperEdition(editionId);
      if (edition) {
        editions.push(edition);
      }
    }

    return { dailyEdition, editions };
  }
}
