import { NextRequest, NextResponse } from 'next/server';
import { createClient, RedisClientType } from 'redis';

// Simple Redis service for the API
class SimpleRedisService {
  private client: RedisClientType | null = null;

  async connect(): Promise<void> {
    if (!this.client) {
      this.client = createClient({
        url: 'redis://localhost:6379',
      });
      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
      });
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) await this.connect();
    return this.client!.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.client) await this.connect();
    await this.client!.set(key, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.client) await this.connect();
    return this.client!.hGetAll(key);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.client) await this.connect();
    await this.client!.hSet(key, field, value);
  }

  async lrange(key: string, start: number, end: number): Promise<string[]> {
    if (!this.client) await this.connect();
    return this.client!.lRange(key, start, end);
  }

  async lpush(key: string, value: string): Promise<void> {
    if (!this.client) await this.connect();
    await this.client!.lPush(key, value);
  }

  async del(key: string): Promise<void> {
    if (!this.client) await this.connect();
    await this.client!.del(key);
  }
}

// Simple mock implementations for the job triggers
class SimpleReporterService {
  constructor(private redisService: SimpleRedisService) {}

  async generateAllReporterArticles(): Promise<Record<string, any[]>> {
    console.log('Generating articles for all reporters...');
    // Mock implementation - in real scenario this would call the actual service
    return { 'mock-reporter': [{ id: '1', title: 'Mock Article', content: 'Mock content' }] };
  }
}

class SimpleEditorService {
  constructor(private redisService: SimpleRedisService) {}

  async generateNewspaperEdition(): Promise<any> {
    console.log('Generating newspaper edition...');
    // Mock implementation
    return {
      id: `edition-${Date.now()}`,
      stories: [{ id: '1', title: 'Mock Story', content: 'Mock content' }]
    };
  }

  async generateDailyEdition(): Promise<any> {
    console.log('Generating daily edition...');
    // Mock implementation
    return {
      id: `daily-${Date.now()}`,
      editions: [{ id: '1', stories: [] }]
    };
  }
}

let redisService: SimpleRedisService | null = null;
let reporterService: SimpleReporterService | null = null;
let editorService: SimpleEditorService | null = null;

async function initializeServices(): Promise<void> {
  if (!redisService) {
    redisService = new SimpleRedisService();
    await redisService.connect();
  }
  if (!reporterService) {
    reporterService = new SimpleReporterService(redisService);
  }
  if (!editorService) {
    editorService = new SimpleEditorService(redisService);
  }
}

// POST /api/editor/jobs/trigger - Trigger a specific job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobType } = body;

    if (!jobType || typeof jobType !== 'string') {
      return NextResponse.json(
        { error: 'Job type is required and must be a string' },
        { status: 400 }
      );
    }

    await initializeServices();

    let result;
    switch (jobType) {
      case 'reporter':
        const reporterResults = await reporterService!.generateAllReporterArticles();
        const totalArticles = Object.values(reporterResults).reduce((sum, articles) => sum + articles.length, 0);
        result = { message: `Reporter article generation job triggered successfully. Generated ${totalArticles} articles.` };
        break;
      case 'newspaper':
        const edition = await editorService!.generateNewspaperEdition();
        result = { message: `Newspaper edition generation job triggered successfully. Created edition: ${edition.id} with ${edition.stories.length} stories.` };
        break;
      case 'daily':
        const dailyEdition = await editorService!.generateDailyEdition();
        result = { message: `Daily edition generation job triggered successfully. Created daily edition: ${dailyEdition.id} with ${dailyEdition.editions.length} newspaper editions.` };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid job type. Must be one of: reporter, newspaper, daily' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error triggering job:', error);
    return NextResponse.json(
      { error: 'Failed to trigger job' },
      { status: 500 }
    );
  }
}

// GET /api/editor/jobs/status - Get job status and next run times
export async function GET() {
  try {
    // For now, return mock status since we don't have access to the actual scheduler
    const mockStatus = {
      status: {
        reporterJob: false,
        newspaperJob: false,
        dailyJob: false
      },
      nextRuns: {
        reporterJob: null,
        newspaperJob: null,
        dailyJob: null
      },
      note: 'Status information requires scheduler to be running. Use manual triggers to run jobs on demand.'
    };

    return NextResponse.json(mockStatus);
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}
