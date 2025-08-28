import { Reporter, Article } from '../models/types';

export class AIService {
  // Mock AI service - in a real implementation, this would call OpenAI, Claude, etc.

  async generateArticle(reporter: Reporter): Promise<Article> {
    const generationTime = Date.now();
    const articleId = `article_${generationTime}_${Math.random().toString(36).substring(2, 8)}`;

    // Mock article generation based on reporter's beats
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
    // Mock headline generation - in reality, this would use AI
    const headlines = {
      'politics': [
        'Breaking: Major Policy Shift Announced',
        'Congress Reaches Bipartisan Agreement',
        'President Addresses Nation on Key Issues'
      ],
      'technology': [
        'Revolutionary AI Breakthrough Announced',
        'Tech Giant Unveils New Innovation',
        'Startup Raises Record Funding Round'
      ],
      'sports': [
        'Championship Game Ends in Dramatic Fashion',
        'Star Athlete Signs Historic Contract',
        'Underdog Team Makes Cinderella Run'
      ],
      'business': [
        'Market Hits All-Time High',
        'Major Merger Shakes Industry',
        'Economic Indicators Show Strong Growth'
      ],
      'entertainment': [
        'Blockbuster Film Breaks Box Office Records',
        'Celebrity Announces Major Career Move',
        'Award Show Delivers Surprising Winners'
      ]
    };

    const beatHeadlines = headlines[beat as keyof typeof headlines] || ['News Story Breaks'];
    return beatHeadlines[Math.floor(Math.random() * beatHeadlines.length)];
  }

  private async generateBody(beat: string, reporterPrompt: string): Promise<string> {
    // Mock article body generation - in reality, this would use AI with the reporter's prompt
    const templates = {
      'politics': `In a surprising turn of events, political leaders have taken decisive action on a critical issue affecting millions of Americans. The development comes at a pivotal moment in the legislative session, with stakeholders closely watching the outcome.

Sources close to the situation indicate that the decision was reached after extensive negotiations and careful consideration of various perspectives. The move is expected to have far-reaching implications for policy implementation and public opinion.

"This represents a significant step forward," said one anonymous source familiar with the discussions. "We're seeing real progress on an issue that has divided the nation for far too long."

Political analysts are already weighing in on the potential consequences, with some predicting immediate market reactions while others caution about long-term societal impacts. The coming weeks will be crucial in determining whether this breakthrough leads to meaningful change or fades into political rhetoric.

As the story continues to develop, all eyes remain on the key players and their next moves in this evolving political landscape.`,

      'technology': `The technology sector continues to push boundaries with innovative solutions that promise to reshape how we interact with digital systems. Today's announcement from industry leaders highlights the rapid pace of technological advancement and its potential to transform everyday experiences.

The new development combines cutting-edge artificial intelligence with practical applications that could revolutionize multiple industries. Early testing shows promising results, with users reporting significant improvements in efficiency and user experience.

Industry experts are particularly excited about the scalability of the technology and its potential for widespread adoption. "This isn't just another incremental improvement," noted one analyst. "This represents a fundamental shift in how we approach technological challenges."

As companies race to implement similar solutions, the competitive landscape is heating up. Investors are taking notice, with venture capital flowing into startups working on complementary technologies.

The coming months will be crucial in determining whether this innovation lives up to its potential or becomes another footnote in the tech industry's long history of ambitious projects.`,

      'sports': `The world of sports delivered another thrilling chapter today, with athletes pushing the limits of human performance and teams battling for supremacy in high-stakes competitions. The action unfolded with intensity that kept fans on the edge of their seats from start to finish.

Key moments included spectacular individual performances and strategic team plays that showcased the pinnacle of athletic achievement. The competition highlighted the incredible dedication and training that goes into reaching elite levels of sport.

"This is what makes sports so special," commented one veteran observer. "You never know when that magical moment will happen."

The results have significant implications for season standings, playoff positioning, and individual career trajectories. Coaches and players alike are already looking ahead to the next challenges while reflecting on today's accomplishments.

As the season progresses, fans can expect more of the same electrifying action that makes following sports such an engaging experience.`,

      'business': `The business world reacted strongly to today's economic developments, with markets showing volatility that reflects the complex interplay of global economic forces. Companies across various sectors are adjusting their strategies in response to shifting conditions and emerging opportunities.

Financial analysts are closely monitoring key indicators that could signal broader economic trends. The current environment presents both challenges and opportunities for businesses willing to adapt and innovate.

"We're seeing companies that are agile and forward-thinking really thrive in this climate," said one market strategist. "Those that remain rigid may find themselves at a competitive disadvantage."

Investment patterns are shifting, with capital flowing toward sectors showing strong growth potential and away from those facing headwinds. This reallocation of resources could have long-term implications for industry composition and economic development.

Business leaders are emphasizing the importance of resilience and strategic planning as they navigate these uncertain times. The ability to pivot quickly and seize emerging opportunities will likely separate winners from losers in the months ahead.`,

      'entertainment': `The entertainment industry continues to captivate audiences with fresh content and innovative storytelling that pushes creative boundaries. Today's developments highlight the dynamic nature of the industry and its ability to surprise and delight fans.

From blockbuster releases to independent productions, the entertainment landscape offers something for every taste. The current trends suggest a healthy appetite for diverse stories and fresh perspectives that challenge conventional narratives.

"This is an exciting time for storytelling," noted one industry insider. "We're seeing creators taking risks and audiences responding positively to authentic, engaging content."

The business side of entertainment is also evolving, with new distribution models and audience engagement strategies changing how content reaches viewers. Streaming platforms, traditional studios, and independent creators are all adapting to the shifting landscape.

As the industry continues to evolve, one thing remains clear: the power of compelling stories to connect with audiences and spark meaningful conversations will continue to drive entertainment forward.`
    };

    return templates[beat as keyof typeof templates] || `A significant development has occurred in the ${beat} sector, capturing widespread attention and prompting discussion among industry experts and the general public. The situation continues to evolve with potential implications for various stakeholders.

Key figures involved are monitoring the situation closely, with some expressing optimism about positive outcomes while others caution about potential challenges ahead. The coming days will likely bring more clarity to this developing story.

"This represents an important moment that could have lasting effects," said one observer familiar with the situation. "We're all watching closely to see how things unfold."

As more information becomes available, the full scope and impact of these events will become clearer. Stay tuned for updates as this story continues to develop.`;
  }

  async selectNewsworthyStories(articles: Article[], editorPrompt: string): Promise<Article[]> {
    // Mock story selection - in reality, this would use AI to evaluate newsworthiness
    // For now, randomly select 3-5 articles as "newsworthy"
    const minStories = 3;
    const maxStories = Math.min(5, articles.length);
    const numStories = Math.floor(Math.random() * (maxStories - minStories + 1)) + minStories;

    // Shuffle and select
    const shuffled = [...articles].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numStories);
  }

  async selectNotableEditions(editions: string[], editorPrompt: string): Promise<string[]> {
    // Mock edition selection - in reality, this would use AI to evaluate significance
    // For now, randomly select 2-4 editions as "notable"
    const minEditions = 2;
    const maxEditions = Math.min(4, editions.length);
    const numEditions = Math.floor(Math.random() * (maxEditions - minEditions + 1)) + minEditions;

    // Shuffle and select
    const shuffled = [...editions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numEditions);
  }
}
