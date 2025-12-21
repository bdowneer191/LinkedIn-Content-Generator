
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
  // Return pre-cached/default topics for quick start
  const defaultTopics = [
    { id: '1', title: 'Generative AI in Business', description: 'How to integrate AI agents into daily workflows for 10x productivity.', popularity: 10, keywords: ['AI', 'Automation', 'Future of Work'] },
    { id: '2', title: 'Sustainable SaaS Architecture', description: 'Building energy-efficient cloud applications for a greener tech future.', popularity: 7, keywords: ['SaaS', 'Sustainability', 'Tech Trends'] },
    { id: '3', title: 'Remote Team Engagement', description: 'Strategies to maintain culture and high-performance in hybrid workspaces.', popularity: 9, keywords: ['Leadership', 'RemoteWork', 'HRTech'] }
  ];
  return Response.json(defaultTopics);
}
