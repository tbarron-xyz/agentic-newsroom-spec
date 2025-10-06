import { KpiName, REDIS_KEYS } from '../models/types';
import { RedisService } from './redis.service';
import OpenAI from 'openai';

export class KpiService {
  private redisService: RedisService;

  // Pricing constants (per 1M tokens)
  private readonly INPUT_TOKEN_COST = 0.050; // $0.050 per 1M input tokens
  private readonly OUTPUT_TOKEN_COST = 0.400; // $0.400 per 1M output tokens

  constructor() {
    this.redisService = new RedisService();
  }

  /**
   * Static method to increment KPIs from an OpenAI API response.
   * This is a convenience method that can be called directly without instantiating KpiService.
   */
  static async incrementFromOpenAIResponse(response: OpenAI.Chat.Completions.ChatCompletion): Promise<void> {
    if (!response.usage) {
      return;
    }

    const kpiService = new KpiService();
    await kpiService.incrementKpis({
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens
    });
  }

  async incrementKpis(usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }): Promise<void> {
    try {
      await this.redisService.connect();

      // Increment input tokens
      await this.incrementKpi(KpiName.TOTAL_TEXT_INPUT_TOKENS, usage.promptTokens);

      // Increment output tokens
      await this.incrementKpi(KpiName.TOTAL_TEXT_OUTPUT_TOKENS, usage.completionTokens);

      // Calculate and increment spend
      const spendIncrement = this.calculateSpend(usage.promptTokens, usage.completionTokens);
      await this.incrementKpi(KpiName.TOTAL_AI_API_SPEND, spendIncrement);

    } catch (error) {
      console.error('Error incrementing KPIs:', error);
      // Don't throw - KPI tracking should not break the main functionality
    } finally {
      await this.redisService.disconnect();
    }
  }

  private async incrementKpi(kpiName: KpiName, increment: number): Promise<void> {
    const currentValue = await this.getKpiValue(kpiName);
    const newValue = currentValue + increment;
    await this.setKpiValue(kpiName, newValue);
  }

  async getKpiValue(kpiName: KpiName): Promise<number> {
    try {
      await this.redisService.connect();
      const valueStr = await this.redisService.getClient().get(REDIS_KEYS.KPI_VALUE(kpiName));
      return valueStr ? parseFloat(valueStr) : 0;
    } catch (error) {
      console.error(`Error getting KPI value for ${kpiName}:`, error);
      return 0;
    } finally {
      await this.redisService.disconnect();
    }
  }

  private async setKpiValue(kpiName: KpiName, value: number): Promise<void> {
    try {
      await this.redisService.connect();
      const multi = this.redisService.getClient().multi();

      console.log('Redis Write: SET', REDIS_KEYS.KPI_VALUE(kpiName), value.toString());
      multi.set(REDIS_KEYS.KPI_VALUE(kpiName), value.toString());

      console.log('Redis Write: SET', REDIS_KEYS.KPI_LAST_UPDATED(kpiName), Date.now().toString());
      multi.set(REDIS_KEYS.KPI_LAST_UPDATED(kpiName), Date.now().toString());

      await multi.exec();
    } catch (error) {
      console.error(`Error setting KPI value for ${kpiName}:`, error);
      throw error;
    } finally {
      await this.redisService.disconnect();
    }
  }

  private calculateSpend(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000000) * this.INPUT_TOKEN_COST;
    const outputCost = (outputTokens / 1000000) * this.OUTPUT_TOKEN_COST;
    return inputCost + outputCost;
  }

  async getAllKpis(): Promise<Record<KpiName, number>> {
    const kpis: Partial<Record<KpiName, number>> = {};

    for (const kpiName of Object.values(KpiName)) {
      kpis[kpiName as KpiName] = await this.getKpiValue(kpiName as KpiName);
    }

    return kpis as Record<KpiName, number>;
  }
}