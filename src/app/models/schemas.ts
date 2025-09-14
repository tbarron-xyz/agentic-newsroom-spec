import { z } from 'zod';

export const dailyEditionSchema = z.object({
    frontPageHeadline: z.string(),
    frontPageArticle: z.string(),
    topics: z.array(z.object({
        name: z.string(),
        headline: z.string(),
        newsStoryFirstParagraph: z.string(),
        newsStorySecondParagraph: z.string(),
        oneLineSummary: z.string(),
        supportingSocialMediaMessage: z.string(),
        skepticalComment: z.string(),
        gullibleComment: z.string(),
    })),
    modelFeedbackAboutThePrompt: z.object({positive: z.string(), negative: z.string()}),
    // newspaperName: z.string(),
});

export const reporterArticleSchema = z.object({
    messageIds: z.array(z.number()).describe("The indexes of the social media messages used to write this article"),
    id: z.string(),
    reporterId: z.string(),
    beat: z.string(),
    headline: z.string(),
    leadParagraph: z.string(),
    body: z.string(),
    keyQuotes: z.array(z.string()),
    sources: z.array(z.string()),
    wordCount: z.number(),
    generationTime: z.number(),
    reporterNotes: z.object({
        researchQuality: z.string(),
        sourceDiversity: z.string(),
        factualAccuracy: z.string()
    }),
    socialMediaSummary: z.string(),
    potentialMessageIds: z.array(z.number()).describe("The indexes of potentially related social media messages")
});

export const reporterResponseSchema = z.object({
    reporterId: z.string(),
    reporterName: z.string(),
    articles: z.array(reporterArticleSchema),
    totalArticlesGenerated: z.number(),
    generationTimestamp: z.number(),
    coverageSummary: z.object({
        beatsCovered: z.array(z.string()),
        totalWordCount: z.number(),
        keyThemes: z.array(z.string())
    }),
    modelFeedback: z.object({
        positive: z.string(),
        negative: z.string(),
        suggestions: z.string()
    })
});

export const userSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    passwordHash: z.string(),
    role: z.enum(['admin', 'editor', 'reporter', 'user']),
    createdAt: z.number(),
    lastLoginAt: z.number().optional()
});

export const eventSchema = z.object({
    id: z.string(),
    reporterId: z.string(),
    createdTime: z.number(),
    updatedTime: z.number(),
    facts: z.array(z.string())
});

export const eventGenerationResponseSchema = z.object({
    events: z.array(z.object({
        id: z.string().nullable().optional().describe("Optional for new events"), // Optional for new events
        title: z.string(),
        facts: z.array(z.string()).max(5) // Max 5 facts per event
    })).max(5) // Max 5 events
});

export const loginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

export const registerRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});
