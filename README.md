# AI Newsroom

A Node.js TypeScript application that simulates an AI-powered newsroom with automated reporters and editors.

## Overview

The AI Newsroom consists of:
- **AI Reporters**: Generate articles based on their assigned beats (politics, technology, business, sports, entertainment)
- **AI Editor**: Curates newspaper editions by selecting the most newsworthy stories
- **Automated Scheduling**: Uses cron jobs to run reporter and editor tasks on predefined intervals

## Features

- **Automated Article Generation**: Reporters create 1-3 articles every 15 minutes based on their beats
- **Newspaper Editions**: Editor compiles selected stories into editions every 3 hours
- **Daily Editions**: Editor creates comprehensive daily editions every 24 hours
- **Redis Storage**: All data is stored in Redis with structured key patterns
- **TypeScript**: Full TypeScript implementation with proper type safety

## Architecture

```
src/
├── models/
│   └── types.ts          # TypeScript interfaces and Redis key patterns
├── services/
│   ├── redis.service.ts  # Redis data access layer
│   ├── ai.service.ts     # Mock AI article generation
│   ├── reporter.service.ts # Reporter management and article generation
│   └── editor.service.ts # Editor logic for curating editions
├── jobs/
│   └── scheduler.service.ts # Cron job scheduling
├── index.ts              # Main application entry point
└── test.ts               # Test suite
```

## Prerequisites

- Node.js (v16 or higher)
- Redis server running on localhost:6379
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-newsroom
```

2. Install dependencies:
```bash
npm install
```

3. Start Redis server (if not already running):
```bash
redis-server
```

## Usage

### Development Mode
Run the application in development mode with auto-restart:
```bash
npm run dev
```

### Production Mode
1. Build the application:
```bash
npm run build
```

2. Start the application:
```bash
npm start
```

### Testing
Run the test suite to verify functionality:
```bash
npm test
```

## Data Storage

The application uses Redis with the following key structure:

### Editor
- `editor:bio` - Editor biography
- `editor:prompt` - Editor system prompt

### Reporters
- `reporters` - Set of all reporter IDs
- `reporter:{id}:beats` - Set of reporter's beat strings
- `reporter:{id}:prompt` - Reporter's system prompt

### Articles
- `articles:{reporter_id}` - Sorted set of articles by reporter (score: timestamp)
- `article:{id}:headline` - Article headline
- `article:{id}:body` - Article body
- `article:{id}:time` - Article generation timestamp

### Newspaper Editions
- `editions` - Sorted set of all editions (score: timestamp)
- `edition:{id}:stories` - Set of article IDs in the edition
- `edition:{id}:time` - Edition generation timestamp

### Daily Editions
- `daily_editions` - Sorted set of all daily editions (score: timestamp)
- `daily_edition:{id}:editions` - Set of edition IDs in the daily edition
- `daily_edition:{id}:time` - Daily edition generation timestamp

## Scheduling

The application runs the following automated jobs:

- **Every 15 minutes**: All reporters generate 1-3 articles based on their beats
- **Every 3 hours**: Editor creates a newspaper edition from recent articles
- **Every 24 hours**: Editor creates a daily edition from recent newspaper editions

## Sample Data

On first run, the application automatically creates:

### Editor
- Experienced newspaper editor with 20+ years in journalism
- Prompt focused on selecting newsworthy, impactful stories

### Reporters
1. **Politics & Government Reporter**
   - Covers: politics, government
   - Focus: Policy decisions, elections, legislative developments

2. **Technology & Innovation Reporter**
   - Covers: technology, innovation
   - Focus: Tech breakthroughs, startups, industry trends

3. **Business & Finance Reporter**
   - Covers: business, finance
   - Focus: Market analysis, corporate news, economic trends

4. **Sports & Entertainment Reporter**
   - Covers: sports, entertainment
   - Focus: Major events, celebrity news, cultural moments

## Configuration

### Redis Connection
The application connects to Redis at `localhost:6379`. To modify the connection:

```typescript
// In src/services/redis.service.ts
constructor() {
  this.client = createClient({
    url: 'redis://your-host:6379',
    username: 'your-username',  // optional
    password: 'your-password'   // optional
  });
}
```

### Scheduling Intervals
To modify the cron job intervals, update the schedules in `src/jobs/scheduler.service.ts`:

```typescript
// Every 15 minutes
const reporterJob = new CronJob('*/15 * * * *', ...);

// Every 3 hours
const newspaperJob = new CronJob('0 */3 * * *', ...);

// Every 24 hours (midnight)
const dailyJob = new CronJob('0 0 * * *', ...);
```

## API Reference

### Services

#### RedisService
- `connect()` - Connect to Redis
- `disconnect()` - Disconnect from Redis
- `saveEditor(editor)` - Save editor data
- `getEditor()` - Retrieve editor data
- `saveReporter(reporter)` - Save reporter data
- `getAllReporters()` - Get all reporters
- `saveArticle(article)` - Save article
- `getArticlesByReporter(reporterId)` - Get articles by reporter
- `saveNewspaperEdition(edition)` - Save newspaper edition
- `getNewspaperEditions()` - Get all newspaper editions

#### ReporterService
- `generateArticlesForReporter(reporterId)` - Generate articles for specific reporter
- `generateAllReporterArticles()` - Generate articles for all reporters
- `getReporterArticles(reporterId)` - Get articles by reporter
- `createReporter(data)` - Create new reporter

#### EditorService
- `generateNewspaperEdition()` - Create newspaper edition from recent articles
- `generateDailyEdition()` - Create daily edition from recent newspaper editions
- `getLatestNewspaperEdition()` - Get most recent newspaper edition
- `getLatestDailyEdition()` - Get most recent daily edition

#### SchedulerService
- `start()` - Start all cron jobs
- `stop()` - Stop all cron jobs
- `triggerReporterJob()` - Manually trigger article generation
- `triggerNewspaperJob()` - Manually trigger newspaper edition generation
- `triggerDailyJob()` - Manually trigger daily edition generation

## Development

### Project Structure
- `src/` - Source code
- `dist/` - Compiled JavaScript (after build)
- `data.spec.md` - Data storage specification
- `spec.md` - Original requirements

### Adding New Features

1. **New Reporter Beat**: Add to sample data in `src/index.ts`
2. **New Article Type**: Extend `Article` interface in `src/models/types.ts`
3. **New Service**: Create in `src/services/` and integrate in main application
4. **New Job**: Add to `SchedulerService` with appropriate cron schedule

### Testing

The test suite (`src/test.ts`) verifies:
- Service initialization
- Data setup and retrieval
- Article generation
- Edition creation
- Scheduler functionality

Run tests with:
```bash
npm test
```

## Troubleshooting

### Redis Connection Issues
- Ensure Redis server is running: `redis-server`
- Check Redis is accessible on localhost:6379
- Verify no firewall blocking the connection

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check TypeScript compilation: `npm run build`
- Verify Node.js version compatibility

### Scheduling Issues
- Check system timezone settings
- Verify cron expressions are valid
- Monitor application logs for job execution

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## Future Enhancements

- Real AI integration (OpenAI, Claude)
- Web dashboard for monitoring
- Article quality scoring
- Reporter specialization improvements
- Historical data analysis
- Multi-language support
