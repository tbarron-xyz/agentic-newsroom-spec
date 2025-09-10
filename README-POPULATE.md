# Initial Data Population Script

This script populates the Skylines system with initial data including one editor and three specialized reporters.

## Usage

### Basic Usage
```bash
npm run populate
```

### Force Overwrite (if data already exists)
```bash
npm run populate -- --force
```

## What Gets Created

### Editor
- **Role**: Chief Editor with 25+ years of journalism experience
- **Responsibilities**: Curates stories, maintains editorial standards, selects impactful content
- **Focus**: Timeliness, significance, reader interest, and journalistic merit

### Reporters (3 total)

1. **Political Reporter**
   - **Beats**: Politics, Government, Elections
   - **Focus**: Policy impacts, legislative developments, political strategy

2. **Technology & Science Reporter**
   - **Beats**: Technology, Science, Innovation
   - **Focus**: Tech breakthroughs, scientific discoveries, real-world applications

3. **Business & Finance Reporter**
   - **Beats**: Business, Economy, Finance
   - **Focus**: Corporate news, economic trends, market developments

## Features

- **Duplicate Prevention**: Script checks for existing data and prevents accidental overwrites
- **Detailed Logging**: Provides clear feedback on creation progress
- **Error Handling**: Graceful error handling with informative messages
- **Data Validation**: Ensures all required fields are properly set

## Prerequisites

- Redis server must be running on `redis://localhost:6379`
- All dependencies must be installed (`npm install`)

## Data Structure

The script creates the following Redis keys:

### Editor Data
- `editor:bio` - Editor's biography
- `editor:prompt` - Editor's AI prompt/instructions

### Reporter Data
For each reporter:
- `reporters` - Set of all reporter IDs
- `reporter:{id}:beats` - Set of beats covered by the reporter
- `reporter:{id}:prompt` - Reporter's AI prompt/instructions

## Integration

This script integrates with the existing Skylines services:
- `RedisService` - For data persistence
- `ReporterService` - For reporter management
- `AIService` - For AI-powered content generation

## Notes

- The script uses the existing service architecture for consistency
- Reporter IDs are auto-generated with timestamp-based unique identifiers
- All data follows the TypeScript interfaces defined in `src/models/types.ts`
- The script can be imported and used programmatically in other modules
