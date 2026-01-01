// app/api/topics/route.ts - ENHANCED VERSION
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

// POST: Generate personalized topics
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
    
    // Enrich with metadata
    const enrichedTopics = topics.map((t, i) => ({
      ...t,
      id: t.id || `topic-${Date.now()}-${i}`,
      source: 'ai-generated',
      generatedAt: new Date().toISOString()
    }));

    ContentCache.set(cacheKey, enrichedTopics, 60);
    return Response.json(enrichedTopics);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    console.error("Topics API Error:", error);
    return Response.json({ error: "Failed to generate topics" }, { status: 500 });
  }
}

// GET: Real-time trending topics (NO MORE MOCK DATA)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const industry = url.searchParams.get('industry') || 'Business & Technology';
    
    const cacheKey = `topics-trending-${industry.toLowerCase().replace(/\s+/g, '-')}`;
    const cached = ContentCache.get(cacheKey);
    if (cached) return Response.json(cached);

    // Real-time trending analysis via AI
    const trendAnalysisPrompt = `
      Analyze current trending topics in ${industry} for LinkedIn content creation.
      
      Consider:
      - Current events and news (${new Date().toLocaleDateString()})
      - Emerging technologies and methodologies
      - Hot discussions in professional circles
      - Seasonal relevance (Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()})
      
      Generate 6 high-potential LinkedIn topics optimized for engagement.
      Include mix of:
      - Thought leadership angles
      - Practical how-to topics
      - Contrarian/debate-worthy positions
      - Personal experience frameworks
      
      Return ONLY valid JSON array:
      [
        {
          "id": "unique-id",
          "title": "Compelling title (10-15 words)",
          "description": "2-3 sentences explaining why this matters now",
          "popularity": 7-10,
          "keywords": ["keyword1", "keyword2", "keyword3"],
          "trendScore": 85,
          "reasoning": "Why this topic is trending"
        }
      ]
    `;

    const topics = await rateLimiter.add(() => queryAI<any[]>(trendAnalysisPrompt));
    
    // Validate and enrich
    const processedTopics = topics.map((t, i) => ({
      id: t.id || `trend-${Date.now()}-${i}`,
      title: t.title,
      description: t.description,
      popularity: Math.min(10, Math.max(1, t.popularity || t.trendScore / 10)),
      keywords: t.keywords || [],
      source: 'ai-trends',
      trendScore: t.trendScore || t.popularity * 10,
      reasoning: t.reasoning,
      generatedAt: new Date().toISOString()
    }));

    ContentCache.set(cacheKey, processedTopics, 180); // 3 hours cache for trending
    return Response.json(processedTopics);
    
  } catch (error) {
    console.error("Trending Topics Error:", error);
    
    // Fallback: Generate generic but still AI-powered topics
    try {
      const fallbackPrompt = topicSuggestionPrompt(
        'Professional Development', 
        ['Leadership', 'Innovation', 'Career Growth'], 
        'Business Professionals'
      );
      const fallbackTopics = await rateLimiter.add(() => queryAI<any[]>(fallbackPrompt));
      return Response.json(fallbackTopics);
    } catch (fallbackError) {
      return Response.json(
        { error: "Unable to generate trending topics. Please try again." }, 
        { status: 500 }
      );
    }
  }
}

// DELETE: Clear topic cache (useful for testing/refreshing)
export async function DELETE() {
  try {
    ContentCache.clear();
    return Response.json({ message: "Topic cache cleared" });
  } catch (error) {
    return Response.json({ error: "Failed to clear cache" }, { status: 500 });
  }
}
