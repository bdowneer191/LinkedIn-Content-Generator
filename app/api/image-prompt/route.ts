
import { z } from 'zod';
import { queryAI } from '../../../lib/gemini';
import { rateLimiter } from '../../../lib/rate-limiter';
import { ContentCache } from '../../../lib/cache';
import { imagePromptGenerationPrompt } from '../../../lib/prompts';

const ImageReqSchema = z.object({
  content: z.string().min(100),
  contentType: z.enum(['post', 'article', 'carousel']),
  visualStyle: z.string().default('professional')
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = ImageReqSchema.parse(body);
    
    const cacheKey = ContentCache.generateKey('image-prompts', { hash: validated.content.slice(0, 100), style: validated.visualStyle });
    const cached = ContentCache.get(cacheKey);
    if (cached) return Response.json(cached);

    const prompt = imagePromptGenerationPrompt(
      validated.content,
      validated.contentType,
      validated.visualStyle
    );

    const result = await rateLimiter.add(() => queryAI<any>(prompt));
    
    ContentCache.set(cacheKey, result, 60);
    return Response.json(result);
  } catch (error: any) {
    return Response.json({ error: "Failed to generate image prompts" }, { status: 500 });
  }
}
