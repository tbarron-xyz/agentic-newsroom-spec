# AI Newsroom

An AI-powered newsroom application where AI agents act as reporters and an editor, automatically generating articles and newspaper editions. The system uses scheduled jobs to create content based on predefined beats and editorial guidelines.

## Features

- **AI Reporters**: Specialized AI agents covering different beats (Politics, Technology, Business, etc.)
- **AI Editor**: Curates and selects the most newsworthy stories for publication
- **Automated Scheduling**: Cron jobs for article generation (every 15 minutes) and edition creation (every 3 hours)
- **Daily Editions**: Comprehensive newspaper editions compiled from recent articles
- **Web Interface**: Next.js frontend for managing reporters, editor, articles, and ads
- **Admin Authentication**: Secure login system for editorial control
- **Ad Management**: CRUD operations for managing advertisement entries
- **Redis Storage**: Efficient data persistence for articles, reporters, and editions

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Redis
- **AI Integration**: OpenAI API for content generation
- **Scheduling**: Node-cron for automated tasks
- **Styling**: Tailwind CSS with Geist font

## Prerequisites

- Node.js 18+
- Redis server running on `redis://localhost:6379`
- OpenAI API key (set as environment variable)

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```
   NEWSROOM_ADMIN_PASS=your_admin_password
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Populate initial data**:
   ```bash
   npm run populate
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to access the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run populate` - Populate initial data (editor and reporters)
- `npm run populate-daily` - Populate initial daily edition

## API Endpoints

- `/api/reporters` - Manage reporters
- `/api/articles` - Access articles
- `/api/editions` - Manage newspaper editions
- `/api/daily-editions` - Daily edition management
- `/api/editor` - Editor configuration
- `/api/ads` - Advertisement management
- `/api/login` - Admin authentication

## Project Structure

- `src/app/` - Next.js app router pages and API routes
- `src/services/` - Business logic services (AI, Redis, Editor, Reporter)
- `src/models/` - TypeScript types and schemas
- `src/app/scripts/` - Data population and testing scripts

## Key Components

- **Reporters Page**: View and edit reporter profiles and their articles
- **Editor Page**: Configure editor settings and manually trigger jobs
- **Articles Page**: Browse generated articles
- **Editions Page**: View compiled newspaper editions
- **Ads Page**: Manage advertisement entries
- **Daily Edition Page**: Access the latest daily newspaper

## Contributing

This project follows standard Next.js development practices. Ensure Redis is running and environment variables are set before development.