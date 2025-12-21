
import { z } from 'zod';
import { queryAI } from '../../../lib/gemini';
import { rateLimiter } from '../../../lib/rate-limiter';
import { ContentCache } from '../../../lib/cache';
import { contentGenerationPrompt } from '../../../lib/prompts';
import { calculateSEOScore, analyzeContent } from '../../../lib/linkedin-seo';

const ContentReqSchema = z.object({
  outline: z.any(),
  contentType: z.string(),
  maxLength: z.number().default(1300)
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = ContentReqSchema.parse(body);
    
    const cacheKey = ContentCache.generateKey('content', { hook: validated.outline.hook, type: validated.contentType });
    const cached = ContentCache.get(cacheKey);
    if (cached) return Response.json(cached);

    const prompt = contentGenerationPrompt(
      validated.outline,
      validated.contentType,
      validated.maxLength
    );

    const rawGenerated = await rateLimiter.add(() => queryAI<any>(prompt));
    const text = rawGenerated.content.text;
    const hashtags = rawGenerated.content.hashtags || [];
    
    // Post-process with local utils
    const seoScore = calculateSEOScore(text, hashtags);
    const analysis = analyzeContent(text);

    const responseData = {
      content: {
        ...rawGenerated.content,
        seoScore,
        characterCount: analysis.characterCount,
        wordCount: analysis.wordCount,
        readingTime: analysis.readingTime
      },
      formatting: {
        ...rawGenerated.formatting,
        paragraphs: analysis.paragraphCount,
        emojiCount: analysis.emojiCount
      }
    };

    ContentCache.set(cacheKey, responseData, 15);
    return Response.json(responseData);
  } catch (error: any) {
    return Response.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
