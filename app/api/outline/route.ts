
import { z } from 'zod';
import { queryAI } from '../../../lib/gemini';
import { rateLimiter } from '../../../lib/rate-limiter';
import { ContentCache } from '../../../lib/cache';
import { outlineGenerationPrompt } from '../../../lib/prompts';

const OutlineSchema = z.object({
  idea: z.any(),
  sections: z.number().min(3).max(7).default(3),
  includeCallToAction: z.boolean().default(true)
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = OutlineSchema.parse(body);
    
    const cacheKey = ContentCache.generateKey('outline', { ideaTitle: validated.idea.title, sections: validated.sections });
    const cached = ContentCache.get(cacheKey);
    if (cached) return Response.json(cached);

    const prompt = outlineGenerationPrompt(
      validated.idea,
      validated.sections,
      validated.includeCallToAction
    );

    const outline = await rateLimiter.add(() => queryAI<any>(prompt));
    
    // Enrich with IDs and metadata
    const enrichedOutline = {
      ...outline,
      sections: outline.sections.map((s: any, idx: number) => ({
        ...s,
        id: s.id || `sec-${idx}`,
        order: idx + 1
      }))
    };

    ContentCache.set(cacheKey, enrichedOutline, 30);
    return Response.json(enrichedOutline);
  } catch (error: any) {
    return Response.json({ error: "Failed to generate outline" }, { status: 500 });
  }
}
