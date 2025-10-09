import { RedisDataStorageService } from './redis-data-storage.service';
import { IDataStorageService } from './data-storage.interface';
import { AuthService } from './auth.service';
import { ReporterService } from './reporter.service';
import { EditorService } from './editor.service';
import { KpiService } from './kpi.service';
import { AIService } from './ai.service';
import { AbilitiesService } from './abilities.service';

export class ServiceContainer {
  private static instance: ServiceContainer;
  private dataStorageService: IDataStorageService | null = null;
  private authService: AuthService | null = null;
  private reporterService: ReporterService | null = null;
  private editorService: EditorService | null = null;
  private kpiService: KpiService | null = null;
  private aiService: AIService | null = null;
  private abilitiesService: AbilitiesService | null = null;

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  async getDataStorageService(): Promise<IDataStorageService> {
    if (!this.dataStorageService) {
      this.dataStorageService = new RedisDataStorageService();
      await this.dataStorageService.connect();
    }
    return this.dataStorageService;
  }

  async getAuthService(): Promise<AuthService> {
    if (!this.authService) {
      const dataStorage = await this.getDataStorageService();
      this.authService = new AuthService(dataStorage);
    }
    return this.authService;
  }

  async getReporterService(): Promise<ReporterService> {
    if (!this.reporterService) {
      const dataStorage = await this.getDataStorageService();
      const aiService = await this.getAIService();
      this.reporterService = new ReporterService(dataStorage, aiService);
    }
    return this.reporterService;
  }

  async getEditorService(): Promise<EditorService> {
    if (!this.editorService) {
      const dataStorage = await this.getDataStorageService();
      const aiService = await this.getAIService();
      this.editorService = new EditorService(dataStorage, aiService);
    }
    return this.editorService;
  }

  async getKpiService(): Promise<KpiService> {
    if (!this.kpiService) {
      const dataStorage = await this.getDataStorageService();
      this.kpiService = new KpiService(dataStorage);
    }
    return this.kpiService;
  }

  async getAIService(): Promise<AIService> {
    if (!this.aiService) {
      const dataStorage = await this.getDataStorageService();
      this.aiService = new AIService(dataStorage);
    }
    return this.aiService;
  }

  async getAbilitiesService(): Promise<AbilitiesService> {
    if (!this.abilitiesService) {
      this.abilitiesService = new AbilitiesService();
    }
    return this.abilitiesService;
  }

  // Cleanup method for testing or shutdown
  async disconnect(): Promise<void> {
    if (this.dataStorageService) {
      await this.dataStorageService.disconnect();
    }
    // Reset all services
    this.dataStorageService = null;
    this.authService = null;
    this.reporterService = null;
    this.editorService = null;
    this.kpiService = null;
    this.aiService = null;
    this.abilitiesService = null;
  }
}