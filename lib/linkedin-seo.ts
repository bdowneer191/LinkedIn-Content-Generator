
export const LINKEDIN_BEST_PRACTICES = {
  POST_OPTIMAL_LENGTH: 1300,
  POST_MAX_LENGTH: 3000,
  ARTICLE_MIN_LENGTH: 1000,
  ARTICLE_OPTIMAL_LENGTH: 1500,
  PARAGRAPH_MAX_SENTENCES: 3,
  LINE_BREAKS_MIN: 5,
  EMOJI_MAX: 3,
  HASHTAG_MIN: 3,
  HASHTAG_MAX: 5,
  HOOK_MAX_CHARS: 150,
  KEYWORD_DENSITY_MIN: 0.01,
  KEYWORD_DENSITY_MAX: 0.03,
};

export interface ContentAnalysis {
  characterCount: number;
  wordCount: number;
  readingTime: number;
  paragraphCount: number;
  lineBreakCount: number;
  emojiCount: number;
  hashtagCount: number;
  keywordDensity: Record<string, number>;
}

/**
 * Calculates a 0-100 score for LinkedIn content SEO.
 */
export function calculateSEOScore(content: string, hashtags: string[] = []): number {
  let score = 0;
  const bp = LINKEDIN_BEST_PRACTICES;

  // 1. Length Check (20 pts)
  if (content.length >= 800 && content.length <= bp.POST_MAX_LENGTH) {
    score += 20;
  } else if (content.length > 300) {
    score += 10;
  }

  // 2. Line Breaks / Formatting (15 pts)
  const lineBreaks = (content.match(/\n\n/g) || []).length;
  if (lineBreaks >= bp.LINE_BREAKS_MIN) {
    score += 15;
  } else if (lineBreaks >= 2) {
    score += 7;
  }

  // 3. Hashtags (20 pts)
  const detectedHashtags = (content.match(/#\w+/g) || []).length;
  const totalHashtags = Math.max(detectedHashtags, hashtags.length);
  if (totalHashtags >= bp.HASHTAG_MIN && totalHashtags <= bp.HASHTAG_MAX) {
    score += 20;
  } else if (totalHashtags > 0 && totalHashtags < bp.HASHTAG_MIN) {
    score += 10;
  }

  // 4. Hook Quality (25 pts)
  // Check the first 1-2 lines
  const firstLines = content.split('\n').slice(0, 2).join('\n').trim();
  if (firstLines.length > 30 && firstLines.length <= bp.HOOK_MAX_CHARS) {
    score += 25;
  } else if (firstLines.length > 0) {
    score += 10;
  }

  // 5. Engagement Triggers / CTA (10 pts)
  const lowers = content.toLowerCase();
  const hasCTA = lowers.includes('comment') || 
                 lowers.includes('?') || 
                 lowers.includes('share') || 
                 lowers.includes('agree') ||
                 lowers.includes('thoughts');
  if (hasCTA) score += 10;

  // 6. Emoji Usage (10 pts)
  const emojis = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojis > 0 && emojis <= bp.EMOJI_MAX) {
    score += 10;
  } else if (emojis > bp.EMOJI_MAX) {
    score += 5; // Too many is better than none, but penalized
  }

  return Math.min(score, 100);
}

/**
 * Detailed analysis of post structure and content.
 */
export function analyzeContent(content: string): ContentAnalysis {
  const words = content.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Reading time (approx 200 words per minute)
  const readingTime = Math.ceil(wordCount / 200);
  
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  const emojis = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  const hashtags = (content.match(/#\w+/g) || []).length;
  
  // Simple Keyword Density (Top 5 meaningful words)
  const stopWords = new Set(['the', 'and', 'a', 'to', 'in', 'is', 'i', 'it', 'that', 'you', 'for', 'with', 'on', 'was', 'be', 'are', 'as', 'at']);
  const freq: Record<string, number> = {};
  words.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length > 3 && !stopWords.has(clean)) {
      freq[clean] = (freq[clean] || 0) + 1;
    }
  });

  const density: Record<string, number> = {};
  Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([word, count]) => {
      density[word] = count / wordCount;
    });

  return {
    characterCount: content.length,
    wordCount,
    readingTime,
    paragraphCount: paragraphs.length,
    lineBreakCount: (content.match(/\n/g) || []).length,
    emojiCount: emojis,
    hashtagCount: hashtags,
    keywordDensity: density,
  };
}

/**
 * Provides placeholder hashtag suggestions based on a topic.
 * In a real scenario, this might call an API.
 */
export function generateHashtagSuggestions(topic: string, existing: string[] = []): string[] {
  const cleanTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
  const baseTags = [
    cleanTopic,
    'networking',
    'growth',
    'innovation',
    'leadership',
    'strategy',
    'productivity',
    'success',
    'career',
    'future'
  ];
  
  const uniqueTags = new Set([...existing.map(t => t.replace('#', '').toLowerCase()), ...baseTags]);
  return Array.from(uniqueTags).slice(0, 5);
}

/**
 * Formats content to ensure it is mobile-friendly.
 */
export function optimizeForMobile(content: string): string {
  // Split into sentences
  const sentences = content.split(/(?<=[.!?])\s+/);
  let optimized = '';
  let sentenceCount = 0;

  sentences.forEach((sentence) => {
    optimized += sentence + ' ';
    sentenceCount++;

    // Force line break every 2 sentences if not already broken
    if (sentenceCount >= 2) {
      optimized = optimized.trim() + '\n\n';
      sentenceCount = 0;
    }
  });

  return optimized.trim();
}
