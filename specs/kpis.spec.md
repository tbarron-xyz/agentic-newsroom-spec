# KPI Service Specification

## Overview
The KpiService provides tracking and monitoring of AI API usage metrics across the newsroom application. It tracks three key performance indicators (KPIs): "Total AI API spend", "Total text input tokens", and "Total text output tokens".

## Features

### 1. KPI Tracking Service (`src/app/services/kpi.service.ts`)
- **KpiService class** with Redis integration for persistent storage
- **incrementKpis()** method for updating all three KPIs based on token usage
- **incrementFromOpenAIResponse()** static convenience method for direct OpenAI response handling
- **getKpiValue()** and **getAllKpis()** methods for retrieving KPI data
- Automatic spend calculation using configurable pricing ($0.0015 per 1K input tokens, $0.002 per 1K output tokens)

### 2. Data Storage (`./data.spec.md`)
KPIs are stored in Redis with the following key patterns:
- `kpi:{name}:value` - Current KPI value (stored as string)
- `kpi:{name}:last_updated` - Timestamp of last update (milliseconds since epoch)

### 3. API Endpoint (`/api/kpi`)
- GET endpoint that returns all current KPI values
- Used by the editor dashboard to display usage metrics

### 4. Editor Dashboard Integration
- KPI display section in the editor settings page (`src/app/editor/page.tsx`)
- Real-time display of all three KPIs with formatted values
- Refresh button to update metrics
- Visual indicators with icons and color coding

### 5. AI Service Integration (`src/app/services/ai.service.ts`)
All OpenAI API calls automatically track usage via `KpiService.incrementFromOpenAIResponse()`:
- `generateStructuredArticle()` - Article generation from social media
- `selectNewsworthyStories()` - Story selection for newspaper editions
- `selectNotableEditions()` - Daily edition compilation
- `generateEvents()` - Event tracking and creation
- `generateArticlesFromEvents()` - Event-based article generation

## Implementation Details

### KPI Names Enum
```typescript
enum KpiName {
  TOTAL_AI_API_SPEND = 'Total AI API spend',
  TOTAL_TEXT_INPUT_TOKENS = 'Total text input tokens',
  TOTAL_TEXT_OUTPUT_TOKENS = 'Total text output tokens'
}
```

### Usage Tracking Flow
1. OpenAI API call completes with usage data
2. `KpiService.incrementFromOpenAIResponse(response)` is called
3. Token counts are extracted from `response.usage`
4. Spend is calculated: `(inputTokens/1000 * 0.0015) + (outputTokens/1000 * 0.002)`
5. All three KPIs are atomically updated in Redis

### Dashboard Display
The editor dashboard shows:
- **API Spend**: Total dollars spent (formatted to 4 decimal places)
- **Input Tokens**: Total tokens sent to AI (formatted with commas)
- **Output Tokens**: Total tokens received from AI (formatted with commas)

## Configuration
- Input token cost: $0.0015 per 1K tokens (configurable in KpiService)
- Output token cost: $0.002 per 1K tokens (configurable in KpiService)
- All pricing stored as constants in the service class

## Error Handling
- KPI tracking failures don't break main application functionality
- Graceful degradation if Redis is unavailable
- Console logging for debugging purposes

## Future Enhancements
- KPI reset functionality
- Historical KPI data tracking
- Cost alerts and thresholds
- Usage analytics and reporting