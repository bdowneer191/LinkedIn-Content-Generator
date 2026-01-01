// app/api/image-prompt/route.ts
import { z } from 'zod';
import { queryAI } from '../../../lib/gemini';
import { rateLimiter } from '../../../lib/rate-limiter';
import { ContentCache } from '../../../lib/cache';
import { imagePromptGenerationPrompt } from '../../../lib/prompts';

const ImageReqSchema = z.object({
  content: z.string().min(100),
  contentType: z.enum(['post', 'article', 'carousel']),
  visualStyle: z.string().default('professional'),
  // Added optional brand schema
  userBrand: z.object({
    colors: z.array(z.string()),
    style: z.string()
  }).optional()
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = ImageReqSchema.parse(body);
    
    // Create a cache key that includes brand info to avoid stale non-branded results
    const cacheKey = ContentCache.generateKey('image-prompts', { 
      hash: validated.content.slice(0, 100), 
      style: validated.visualStyle,
      brand: validated.userBrand 
    });

    const cached = ContentCache.get(cacheKey);
    if (cached) return Response.json(cached);

    const prompt = imagePromptGenerationPrompt(
      validated.content,
      validated.contentType,
      validated.visualStyle,
      validated.userBrand
    );

    const result = await rateLimiter.add(() => queryAI<any>(prompt));
    
    // Enrich result with IDs if they are missing
    const enrichedResult = {
      ...result,
      imagePrompts: (result.imagePrompts || []).map((p: any, i: number) => ({
        ...p,
        id: p.id || `img-${Date.now()}-${i}`
      }))
    };
    
    ContentCache.set(cacheKey, enrichedResult, 60);
    return Response.json(enrichedResult);
  } catch (error: any) {
    console.error("Image Prompt Gen Error:", error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    return Response.json({ error: "Failed to generate image prompts" }, { status: 500 });
  }
}
