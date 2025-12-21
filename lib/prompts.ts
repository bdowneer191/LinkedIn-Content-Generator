import { ContentIdea, ContentOutline } from '../types/index';

/**
 * Prompt for Step 1: Generating trending topics
 */
export function topicSuggestionPrompt(industry?: string, interests?: string[], targetAudience?: string): string {
  return `
    You are a LinkedIn content strategist with expertise in viral content.
    Generate 5 trending LinkedIn topics for ${industry || 'general business'}.
    Consider: current trends, high engagement potential, professional relevance.
    
    ${interests && interests.length > 0 ? `Focus on these areas: ${interests.join(', ')}` : ''}
    ${targetAudience ? `Target audience: ${targetAudience}` : ''}
    
    Return ONLY valid JSON array with NO markdown formatting:
    [
      {
        "id": "unique-id",
        "title": "Clear, engaging title",
        "description": "2-3 sentence description of why this topic matters",
        "popularity": 8,
        "keywords": ["keyword1", "keyword2", "keyword3"]
      }
    ]
    
    Make topics actionable, relevant to current business climate, and engagement-worthy.
  `;
}

/**
 * Prompt for Step 2: Generating content ideas/angles with user instructions
 */
export function contentIdeasPrompt(topic: string, userInput: string, contentType: string, tone: string): string {
  return `
    You are a LinkedIn content creator specializing in ${tone} content.
    
    Topic: ${topic}
    CRITICAL USER INSTRUCTIONS (Follow these strictly): ${userInput}
    Content Type: ${contentType}
    
    Generate 5 unique content ideas that strictly follow the user instructions above.
    Each idea must follow LinkedIn's algorithm preferences.
    Each idea should have:
    - Compelling hook (first line that stops the scroll)
    - Unique angle/perspective
    - Clear target audience
    - Engagement prediction (1-10)
    
    Return ONLY valid JSON array:
    [
      {
        "id": "unique-id",
        "title": "Content title",
        "hook": "First 1-2 sentences that grab attention",
        "angle": "Unique perspective or approach",
        "targetAudience": "Specific audience description",
        "estimatedEngagement": 8
      }
    ]
    
    Focus on: storytelling, value-first approach, actionable insights, personal experiences.
  `;
}

/**
 * Prompt for Step 3: Generating a detailed outline
 */
export function outlineGenerationPrompt(idea: ContentIdea, sections: number = 3, includeCallToAction: boolean = true): string {
  return `
    Create a detailed LinkedIn content outline.
    
    Idea: ${idea.title}
    Hook: ${idea.hook}
    Sections: ${sections}
    
    Generate a structured outline with:
    1. Attention-grabbing hook (under 150 chars, visible before "see more")
    2. ${sections} main sections with:
       - Clear section title
       - 3-4 key points per section
       - Suggested word count
    3. ${includeCallToAction ? 'Strong call-to-action with engagement question' : ''}
    4. 3-5 relevant hashtags (mix of broad and niche)
    
    Return ONLY valid JSON:
    {
      "hook": "Compelling first line",
      "sections": [
        {
          "id": "section-1",
          "title": "Section title",
          "keyPoints": ["Point 1", "Point 2", "Point 3"],
          "suggestedLength": 150
        }
      ],
      "callToAction": "Engaging question or action",
      "hashtags": ["#Hashtag1", "#Hashtag2"]
    }
    
    Optimize for: LinkedIn algorithm, mobile readability, short paragraphs, natural flow.
  `;
}

/**
 * Prompt for Step 4: Generating full content text
 */
export function contentGenerationPrompt(outline: ContentOutline, contentType: string, maxLength: number = 1300): string {
  return `
    Generate complete LinkedIn ${contentType} content.
    
    Outline: ${JSON.stringify(outline)}
    Max Length: ${maxLength} words
    
    CRITICAL LinkedIn Formatting Rules:
    1. Start with hook (under 150 chars - this appears before "see more")
    2. Use SHORT paragraphs (2-3 sentences maximum)
    3. Add line breaks between paragraphs for mobile readability
    4. Include 1-2 relevant emojis (not excessive)
    5. End with clear CTA and engagement question
    6. Add 3-5 hashtags at the very end
    7. ${contentType === 'post' ? 'Keep under 1300 characters for maximum reach' : 'Aim for 1000-1500 words'}
    
    Content Structure:
    - Hook (critical first impression)
    - ${outline.sections.map(s => s.title).join('\n- ')}
    - ${outline.callToAction}
    
    Return ONLY valid JSON:
    {
      "content": {
        "text": "Full formatted content with \\n\\n for line breaks",
        "characterCount": 1250,
        "wordCount": 210,
        "readingTime": 2,
        "hashtags": ["#Tag1", "#Tag2"],
        "seoScore": 85
      },
      "formatting": {
        "paragraphs": 8,
        "lineBreaks": 7,
        "emojiCount": 2
      }
    }
    
    Write naturally, use storytelling, provide value, optimize for engagement.
  `;
}

/**
 * Prompt for Step 5: Generating image prompts
 */
export function imagePromptGenerationPrompt(content: string, contentType: string, visualStyle: string = 'professional'): string {
  return `
    Generate image creation prompts for LinkedIn content.
    
    Content Summary: ${content.substring(0, 500)}
    Content Type: ${contentType}
    Visual Style: ${visualStyle}
    
    Create 2-3 detailed image prompts suitable for:
    - DALL-E, Midjourney, or Stable Diffusion
    - Professional LinkedIn aesthetic
    - Mobile-first viewing
    
    Each prompt should specify:
    - Composition and layout
    - Color palette (professional, LinkedIn-appropriate)
    - Style and mood
    - Key visual elements
    - Text overlay areas (if applicable)
    
    Return ONLY valid JSON:
    {
      "imagePrompts": [
        {
          "id": "img-1",
          "prompt": "Detailed AI image generation prompt with composition, colors, style, and specific elements",
          "placement": "header",
          "purpose": "Main attention-grabbing visual",
          "aspectRatio": "1:1",
          "style": "${visualStyle}"
        }
      ],
      "designTips": [
        "Keep text minimal and readable on mobile",
        "Use high contrast for accessibility",
        "Align with LinkedIn's professional brand"
      ]
    }
    
    ${contentType === 'carousel' ? 'Include 3-5 carousel slide prompts' : ''}
    ${contentType === 'article' ? 'Include header + 1-2 inline images' : ''}
    ${contentType === 'post' ? 'Single impactful image' : ''}
    
    Focus on: professional aesthetics, brand consistency, mobile optimization.
  `;
}

/**
 * Prompt for Step 5: SEO and Algorithm Analysis
 */
export function seoAnalysisPrompt(content: string, topic: string, hashtags: string[] = []): string {
  return `
    Analyze this LinkedIn content for SEO and engagement optimization.
    
    Content: ${content}
    Topic: ${topic}
    Current Hashtags: ${hashtags.join(', ')}
    
    Provide comprehensive SEO analysis:
    
    1. Overall SEO Score (1-100) based on:
       - Keyword optimization
       - Content length and structure
       - Hashtag strategy
       - Engagement elements
       - Mobile readability
    
    2. Specific Recommendations with priority (high/medium/low):
       - Keyword density and placement
       - Hashtag improvements (3-5 max, mix of popular and niche)
       - Content structure issues
       - Engagement optimization
       - Call-to-action effectiveness
    
    3. LinkedIn Algorithm Best Practices:
       - Optimal posting times for target audience
       - Content length analysis
       - First comment strategy suggestions
       - Engagement bait (questions, polls)
       - Dwell time optimization techniques
    
    4. Hashtag Deep Analysis (Reach & Relevance):
       - Evaluate the effectiveness of current hashtags.
       - Provide a list of recommended hashtags with their "Reach Potential" (High/Medium/Low).
       - Classify each recommendation as "Broad", "Niche", "Trending", or "Branded".
       - Explain the strategic reason for each suggestion in the LinkedIn ecosystem.
    
    Return ONLY valid JSON:
    {
      "seoScore": 85,
      "recommendations": [
        {
          "category": "Keywords",
          "priority": "high",
          "issue": "Keyword density too low",
          "solution": "Include '${topic}' 2-3 more times naturally",
          "impact": "Increase discoverability by 15-20%"
        }
      ],
      "hashtagAnalysis": [
        {
          "hashtag": "#IndustryInsights",
          "type": "broad",
          "reachPotential": "high",
          "reasoning": "Broad industry hashtags help reach a wider professional audience beyond immediate connections."
        }
      ],
      "bestPractices": {
        "timing": "Tuesday 9 AM or Wednesday 12 PM EST",
        "length": "Current: ${content.length} chars. Optimal: 1200-1300 for max reach",
        "keywords": ["keyword1", "keyword2", "keyword3"],
        "hashtags": ["#OptimizedTag1", "#OptimizedTag2"]
      }
    }
    
    Be specific, actionable, and prioritize by impact on reach and engagement.
  `;
}

// Backwards compatibility for existing App.tsx calls
export const PROMPTS = {
  GENERATE_TOPICS: (industry: string) => topicSuggestionPrompt(industry),
  GENERATE_IDEAS: (topic: string, contentType: string, tone: string) => contentIdeasPrompt(topic, '', contentType, tone),
  GENERATE_OUTLINE: (idea: ContentIdea) => outlineGenerationPrompt(idea),
  GENERATE_CONTENT: (outline: ContentOutline, type: string) => contentGenerationPrompt(outline, type),
  GENERATE_IMAGE_PROMPTS: (content: string) => imagePromptGenerationPrompt(content, 'post'),
  GENERATE_SEO_TIPS: (content: string, topic: string) => seoAnalysisPrompt(content, topic, [])
};
