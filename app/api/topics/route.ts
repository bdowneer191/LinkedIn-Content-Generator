import { z } from 'zod';
import { queryAI } from '../../../lib/gemini';
import { rateLimiter } from '../../../lib/rate-limiter';
import { ContentCache } from '../../../lib/cache';
import { topicSuggestionPrompt } from '../../../lib/prompts';

const TopicsSchema = z.object({
  industry: z.string().optional(),
  interests: z.array(z.string()).optional(),
  targetAudience: z.string().optional()
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = TopicsSchema.parse(body);
    
    const cacheKey = ContentCache.generateKey('topics', validated);
    const cached = ContentCache.get(cacheKey);
    if (cached) return Response.json(cached);

    const prompt = topicSuggestionPrompt(
      validated.industry, 
      validated.interests, 
      validated.targetAudience
    );

    const topics = await rateLimiter.add(() => queryAI<any[]>(prompt));
    
    ContentCache.set(cacheKey, topics, 60);
    return Response.json(topics);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    console.error("Topics API Error:", error);
    return Response.json({ error: "Failed to generate topics" }, { status: 500 });
  }
}

export async function GET() {
  // REMOVED: Mock defaultTopics array
  // ADDED: Real-time generation for general trending business topics
  try {
    const cacheKey = 'topics-general-trending';
    const cached = ContentCache.get(cacheKey);
    if (cached) return Response.json(cached);

    const prompt = topicSuggestionPrompt(
      'General Business & Technology', 
      ['Future of Work', 'Innovation', 'Leadership'], 
      'Professionals on LinkedIn'
    );

    const topics = await rateLimiter.add(() => queryAI<any[]>(prompt));
    
    // Enrich with IDs if missing
    const processedTopics = topics.map((t, i) => ({
      ...t,
      id: t.id || `topic-trend-${Date.now()}-${i}`
    }));

    ContentCache.set(cacheKey, processedTopics, 120); // Cache for 2 hours
    return Response.json(processedTopics);
  } catch (error) {
    return Response.json({ error: "Failed to fetch trending topics" }, { status: 500 });
  }
}
