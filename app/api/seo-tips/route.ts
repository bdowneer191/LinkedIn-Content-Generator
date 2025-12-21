
import { z } from 'zod';
import { queryAI } from '../../../lib/gemini';
import { rateLimiter } from '../../../lib/rate-limiter';
import { ContentCache } from '../../../lib/cache';
import { seoAnalysisPrompt } from '../../../lib/prompts';
import { calculateSEOScore, analyzeContent } from '../../../lib/linkedin-seo';

const SEOReqSchema = z.object({
  content: z.string().min(50),
  topic: z.string(),
  hashtags: z.array(z.string()).optional().default([])
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = SEOReqSchema.parse(body);
    
    const cacheKey = ContentCache.generateKey('seo-analysis', { hash: validated.content.slice(0, 100) });
    const cached = ContentCache.get(cacheKey);
    if (cached) return Response.json(cached);

    // Local analysis
    const localScore = calculateSEOScore(validated.content, validated.hashtags);
    const contentAnalysis = analyzeContent(validated.content);

    // AI analysis
    const prompt = seoAnalysisPrompt(validated.content, validated.topic, validated.hashtags);
    const aiAnalysis = await rateLimiter.add(() => queryAI<any>(prompt));
    
    const finalAnalysis = {
      seoScore: Math.round((localScore + aiAnalysis.seoScore) / 2),
      recommendations: aiAnalysis.recommendations.map((r: any) => ({
        ...r,
        difficulty: r.priority === 'high' ? 'medium' : 'easy' // Mock implementation of difficulty
      })),
      hashtagAnalysis: aiAnalysis.hashtagAnalysis || [],
      bestPractices: aiAnalysis.bestPractices,
      contentAnalysis
    };

    ContentCache.set(cacheKey, finalAnalysis, 15);
    return Response.json(finalAnalysis);
  } catch (error: any) {
    return Response.json({ error: "Failed to perform SEO analysis" }, { status: 500 });
  }
}
