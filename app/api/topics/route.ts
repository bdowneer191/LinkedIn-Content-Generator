// app/api/topics/route.ts
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

// POST: Generate personalized topics based on user input
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = TopicsSchema.parse(body);
    
    // Generate a unique cache key based on the input parameters
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

    // Cache personalized results for 60 minutes
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

// GET: Generate Real-time trending topics (No Mock Data)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const industry = url.searchParams.get('industry') || 'Business & Technology';
    
    // Cache key specific to the requested industry
    const cacheKey = `topics-trending-${industry.toLowerCase().replace(/\s+/g, '-')}`;
    const cached = ContentCache.get(cacheKey);
    if (cached) return Response.json(cached);

    // Prompt for Real-time trending analysis
    // We inject the current date to encourage the model to use its latest internal knowledge
    const trendAnalysisPrompt = `
      You are a specialized LinkedIn trends analyst. 
      Analyze current trending topics in the "${industry}" sector for professional content creation.
      
      Context:
      - Current Date: ${new Date().toLocaleDateString()}
      - Quarter: Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}
      
      Task:
      Generate 6 high-potential, specific LinkedIn topics optimized for engagement.
      Focus on emerging technologies, methodology shifts, and hot professional debates.
      
      Return ONLY a valid JSON array matching this schema:
      [
        {
          "id": "unique-slug-id",
          "title": "Compelling Title (10-15 words)",
          "description": "2-3 sentences explaining why this matters right now.",
          "popularity": 9,
          "keywords": ["Keyword1", "Keyword2", "Keyword3"],
          "trendScore": 95,
          "reasoning": "Brief explanation of the trend factor."
        }
      ]
    `;

    const topics = await rateLimiter.add(() => queryAI<any[]>(trendAnalysisPrompt));
    
    // Validate and enrich response
    const processedTopics = topics.map((t, i) => ({
      id: t.id || `trend-${Date.now()}-${i}`,
      title: t.title,
      description: t.description,
      // Normalize popularity to 1-10 scale
      popularity: Math.min(10, Math.max(1, t.popularity || (t.trendScore ? t.trendScore / 10 : 8))),
      keywords: t.keywords || [],
      source: 'ai-trends',
      trendScore: t.trendScore || 85,
      reasoning: t.reasoning,
      generatedAt: new Date().toISOString()
    }));

    // Cache trending topics for 3 hours (180 minutes)
    ContentCache.set(cacheKey, processedTopics, 180); 
    return Response.json(processedTopics);
    
  } catch (error) {
    console.error("Trending Topics Error:", error);
    
    // Graceful Fallback: If trend analysis fails, attempt a standard generation
    // This ensures the UI never breaks even if the complex prompt fails
    try {
      const fallbackPrompt = topicSuggestionPrompt(
        'General Professional Development', 
        ['Leadership', 'Future of Work', 'Productivity'], 
        'LinkedIn Professionals'
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

// DELETE: Utility to clear topic cache (useful for testing/refreshing)
export async function DELETE() {
  try {
    ContentCache.clear();
    return Response.json({ message: "Topic cache cleared" });
  } catch (error) {
    return Response.json({ error: "Failed to clear cache" }, { status: 500 });
  }
}
