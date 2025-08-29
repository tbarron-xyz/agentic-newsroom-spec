import { Reporter, Article } from '../models/types';
import OpenAI from 'openai';

export class AIService {
  private openai: OpenAI;
  private readonly modelName: string = 'gpt-5-nano';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateArticle(reporter: Reporter): Promise<Article> {
    const generationTime = Date.now();
    const articleId = `article_${generationTime}_${Math.random().toString(36).substring(2, 8)}`;

    // Generate article using AI based on reporter's beats
    const beat = reporter.beats[Math.floor(Math.random() * reporter.beats.length)];
    const headline = await this.generateHeadline(beat);
    const body = await this.generateBody(beat, reporter.prompt);

    return {
      id: articleId,
      reporterId: reporter.id,
      headline,
      body,
      generationTime
    };
  }

  private async generateHeadline(beat: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: 'You are a professional news headline writer. Create compelling, concise headlines for news stories.'
          },
          {
            role: 'user',
            content: `Generate a catchy, professional news headline for a story in the ${beat} category. Make it engaging and newsworthy.`
          }
        ]
      });

      return response.choices[0]?.message?.content?.trim() || `Breaking News in ${beat}`;
    } catch (error) {
      console.error('Error generating headline:', error);
      return `Breaking News in ${beat}`;
    }
  }

  private async generateBody(beat: string, reporterPrompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: `You are a professional journalist writing for a news publication. Write engaging, informative news articles that are well-structured and follow journalistic standards. Include relevant quotes, context, and analysis. Write in a neutral, factual tone.`
          },
          {
            role: 'user',
            content: `Write a comprehensive news article about a recent development in the ${beat} sector. Incorporate this reporter's style and focus: "${reporterPrompt}". Make the article approximately 400-600 words, with proper structure including an introduction, body with details and quotes, and a conclusion.`
          }
        ]
      });

      return response.choices[0]?.message?.content?.trim() || `A significant development has occurred in the ${beat} sector, capturing widespread attention and prompting discussion among industry experts and the general public.`;
    } catch (error) {
      console.error('Error generating article body:', error);
      return `A significant development has occurred in the ${beat} sector, capturing widespread attention and prompting discussion among industry experts and the general public. The situation continues to evolve with potential implications for various stakeholders.`;
    }
  }

  async selectNewsworthyStories(articles: Article[], editorPrompt: string): Promise<Article[]> {
    if (articles.length === 0) return [];

    try {
      const articlesText = articles.map((article, index) =>
        `Article ${index + 1}:\nHeadline: ${article.headline}\nContent: ${article.body.substring(0, 300)}...`
      ).join('\n\n');

      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: 'You are an experienced news editor evaluating story newsworthiness. Select the most important and engaging stories based on journalistic criteria.'
          },
          {
            role: 'user',
            content: `Given the following articles and editorial guidelines: "${editorPrompt}", select the 3-5 most newsworthy stories from the list below. Consider factors like timeliness, impact, audience interest, and editorial fit.

Articles:
${articlesText}

Return only the article numbers (1, 2, 3, etc.) of the selected stories, separated by commas. Select between 3-5 articles based on their quality and newsworthiness.`
          }
        ]
      });

      const selectedIndices = response.choices[0]?.message?.content?.trim()
        .split(',')
        .map(num => parseInt(num.trim()) - 1)
        .filter(index => index >= 0 && index < articles.length) || [];

      // If AI selection fails or returns empty, fall back to random selection
      if (selectedIndices.length === 0) {
        const minStories = 3;
        const maxStories = Math.min(5, articles.length);
        const numStories = Math.floor(Math.random() * (maxStories - minStories + 1)) + minStories;
        const shuffled = [...articles].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numStories);
      }

      return selectedIndices.map(index => articles[index]);
    } catch (error) {
      console.error('Error selecting newsworthy stories:', error);
      // Fallback to random selection
      const minStories = 3;
      const maxStories = Math.min(5, articles.length);
      const numStories = Math.floor(Math.random() * (maxStories - minStories + 1)) + minStories;
      const shuffled = [...articles].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, numStories);
    }
  }

  async selectNotableEditions(editions: string[], editorPrompt: string): Promise<string[]> {
    if (editions.length === 0) return [];

    try {
      const editionsText = editions.map((edition, index) =>
        `Edition ${index + 1}: ${edition}`
      ).join('\n');

      const response = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: 'You are a newspaper editor evaluating which editions should be highlighted as notable or special editions. Consider factors like holidays, major events, anniversaries, and editorial significance.'
          },
          {
            role: 'user',
            content: `Given the editorial guidelines: "${editorPrompt}", select the 2-4 most notable or significant newspaper editions from the list below. Consider which editions would be most interesting or important to highlight.

Available editions:
${editionsText}

Return only the edition numbers (1, 2, 3, etc.) of the selected editions, separated by commas. Select between 2-4 editions based on their significance and editorial value.`
          }
        ]
      });

      const selectedIndices = response.choices[0]?.message?.content?.trim()
        .split(',')
        .map(num => parseInt(num.trim()) - 1)
        .filter(index => index >= 0 && index < editions.length) || [];

      // If AI selection fails or returns empty, fall back to random selection
      if (selectedIndices.length === 0) {
        const minEditions = 2;
        const maxEditions = Math.min(4, editions.length);
        const numEditions = Math.floor(Math.random() * (maxEditions - minEditions + 1)) + minEditions;
        const shuffled = [...editions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numEditions);
      }

      return selectedIndices.map(index => editions[index]);
    } catch (error) {
      console.error('Error selecting notable editions:', error);
      // Fallback to random selection
      const minEditions = 2;
      const maxEditions = Math.min(4, editions.length);
      const numEditions = Math.floor(Math.random() * (maxEditions - minEditions + 1)) + minEditions;
      const shuffled = [...editions].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, numEditions);
    }
  }
}
