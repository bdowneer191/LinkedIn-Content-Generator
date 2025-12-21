
import { z } from 'zod';
import { queryAI } from '../../../lib/gemini';
import { rateLimiter } from '../../../lib/rate-limiter';
import { ContentCache } from '../../../lib/cache';
import { contentIdeasPrompt } from '../../../lib/prompts';

const IdeasSchema = z.object({
  topic: z.string().min(3),
  userInput: z.string().optional(),
  contentType: z.enum(['post', 'article', 'carousel']),
  tone: z.enum(['professional', 'casual', 'inspirational'])
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = IdeasSchema.parse(body);
    
    const cacheKey = ContentCache.generateKey('ideas', validated);
    const cached = ContentCache.get(cacheKey);
    if (cached) return Response.json(cached);

    const prompt = contentIdeasPrompt(
      validated.topic,
      validated.userInput || '',
      validated.contentType,
      validated.tone
    );

    const ideas = await rateLimiter.add(() => queryAI<any[]>(prompt));
    
    // Add IDs if missing and sort by engagement
    const processedIdeas = ideas.map((idea, idx) => ({
      ...idea,
      id: idea.id || `idea-${Date.now()}-${idx}`
    })).sort((a, b) => b.estimatedEngagement - a.estimatedEngagement);

    ContentCache.set(cacheKey, processedIdeas, 30);
    return Response.json(processedIdeas);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    return Response.json({ error: "Failed to generate ideas" }, { status: 500 });
  }
}
