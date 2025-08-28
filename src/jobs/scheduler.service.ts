import { CronJob } from 'cron';
import { ReporterService } from '../services/reporter.service';
import { EditorService } from '../services/editor.service';

export class SchedulerService {
  private jobs: CronJob[] = [];

  constructor(
    private reporterService: ReporterService,
    private editorService: EditorService
  ) {}

  start(): void {
    console.log('Starting AI Newsroom Scheduler...');

    // Every 15 minutes: Generate articles for all reporters
    const reporterJob = new CronJob('*/15 * * * *', async () => {
      console.log('\n=== REPORTER ARTICLE GENERATION JOB ===');
      console.log(`[${new Date().toISOString()}] Starting scheduled article generation...`);

      try {
        const results = await this.reporterService.generateAllReporterArticles();
        const totalArticles = Object.values(results).reduce((sum, articles) => sum + articles.length, 0);

        console.log(`[${new Date().toISOString()}] Successfully generated ${totalArticles} articles`);
        console.log('Reporter job completed successfully\n');
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Reporter job failed:`, error);
      }
    });

    // Every 3 hours: Generate newspaper edition
    const newspaperJob = new CronJob('0 */3 * * *', async () => {
      console.log('\n=== NEWSPAPER EDITION GENERATION JOB ===');
      console.log(`[${new Date().toISOString()}] Starting scheduled newspaper edition generation...`);

      try {
        const edition = await this.editorService.generateNewspaperEdition();
        console.log(`[${new Date().toISOString()}] Successfully generated newspaper edition: ${edition.id}`);
        console.log(`[${new Date().toISOString()}] Edition contains ${edition.stories.length} stories`);
        console.log('Newspaper edition job completed successfully\n');
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Newspaper edition job failed:`, error);
      }
    });

    // Every 24 hours: Generate daily edition
    const dailyJob = new CronJob('0 0 * * *', async () => {
      console.log('\n=== DAILY EDITION GENERATION JOB ===');
      console.log(`[${new Date().toISOString()}] Starting scheduled daily edition generation...`);

      try {
        const dailyEdition = await this.editorService.generateDailyEdition();
        console.log(`[${new Date().toISOString()}] Successfully generated daily edition: ${dailyEdition.id}`);
        console.log(`[${new Date().toISOString()}] Daily edition contains ${dailyEdition.editions.length} newspaper editions`);
        console.log('Daily edition job completed successfully\n');
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Daily edition job failed:`, error);
      }
    });

    // Store jobs for potential management
    this.jobs = [reporterJob, newspaperJob, dailyJob];

    // Start all jobs
    this.jobs.forEach(job => job.start());

    console.log('All scheduled jobs have been started:');
    console.log('- Reporter articles: Every 15 minutes');
    console.log('- Newspaper editions: Every 3 hours');
    console.log('- Daily editions: Every 24 hours');
    console.log('Scheduler is now running...\n');
  }

  stop(): void {
    console.log('Stopping AI Newsroom Scheduler...');

    this.jobs.forEach(job => job.stop());
    this.jobs = [];

    console.log('All scheduled jobs have been stopped.');
  }

  // Manual trigger methods for testing
  async triggerReporterJob(): Promise<void> {
    console.log('Manually triggering reporter article generation...');
    try {
      const results = await this.reporterService.generateAllReporterArticles();
      const totalArticles = Object.values(results).reduce((sum, articles) => sum + articles.length, 0);
      console.log(`Manually generated ${totalArticles} articles`);
    } catch (error) {
      console.error('Manual reporter job failed:', error);
      throw error;
    }
  }

  async triggerNewspaperJob(): Promise<void> {
    console.log('Manually triggering newspaper edition generation...');
    try {
      const edition = await this.editorService.generateNewspaperEdition();
      console.log(`Manually generated newspaper edition: ${edition.id} with ${edition.stories.length} stories`);
    } catch (error) {
      console.error('Manual newspaper job failed:', error);
      throw error;
    }
  }

  async triggerDailyJob(): Promise<void> {
    console.log('Manually triggering daily edition generation...');
    try {
      const dailyEdition = await this.editorService.generateDailyEdition();
      console.log(`Manually generated daily edition: ${dailyEdition.id} with ${dailyEdition.editions.length} editions`);
    } catch (error) {
      console.error('Manual daily job failed:', error);
      throw error;
    }
  }

  getJobStatus(): { [key: string]: boolean } {
    return {
      reporterJob: this.jobs[0]?.running ?? false,
      newspaperJob: this.jobs[1]?.running ?? false,
      dailyJob: this.jobs[2]?.running ?? false
    };
  }

  getNextRunTimes(): { [key: string]: Date | null } {
    return {
      reporterJob: this.jobs[0]?.nextDate().toJSDate() ?? null,
      newspaperJob: this.jobs[1]?.nextDate().toJSDate() ?? null,
      dailyJob: this.jobs[2]?.nextDate().toJSDate() ?? null
    };
  }
}
