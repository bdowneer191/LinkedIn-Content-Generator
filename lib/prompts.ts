import { ContentIdea, ContentOutline } from '../types/index';

/**
 * Step 1: Trending Topics Prompt
 */
export function topicSuggestionPrompt(industry?: string, interests?: string[], targetAudience?: string): string {
  return `
    You are a LinkedIn content strategist. Analyze the "${industry || 'General Business'}" sector.
    Context: Current Date ${new Date().toLocaleDateString()}.
    
    Task: Generate 5 trending, high-engagement LinkedIn topics.
    ${interests && interests.length > 0 ? `Focus areas: ${interests.join(', ')}` : ''}
    ${targetAudience ? `Target Audience: ${targetAudience}` : ''}
    
    Return ONLY valid JSON array with NO markdown formatting:
    [
      {
        "id": "unique-id",
        "title": "Compelling Title",
        "description": "Why this matters now (2 sentences)",
        "popularity": 9,
        "keywords": ["tag1", "tag2"]
      }
    ]
  `;
}

/**
 * Step 2: Content Ideation Prompt
 */
export function contentIdeasPrompt(topic: string, userInput: string, contentType: string, tone: string): string {
  return `
    Act as a professional ghostwriter. 
    Topic: ${topic}
    Format: ${contentType}
    Tone: ${tone}
    Context: ${userInput || 'Maximize professional engagement'}
    
    Generate 5 unique angles/hooks.
    Return ONLY valid JSON array:
    [
      {
        "id": "unique-id",
        "title": "Attention Grabbing Title",
        "hook": "The first 2 lines that stop the scroll...",
        "angle": "The unique perspective taken",
        "targetAudience": "Who this is for",
        "estimatedEngagement": 9
      }
    ]
  `;
}

/**
 * Step 3: Outline Generation Prompt
 */
export function outlineGenerationPrompt(idea: ContentIdea, sections: number = 3, includeCallToAction: boolean = true): string {
  return `
    Create a structured outline for this LinkedIn post: "${idea.title}".
    Hook: "${idea.hook}"
    Sections: ${sections}
    
    Generate a structured outline with:
    1. Attention-grabbing hook (under 150 chars)
    2. ${sections} main sections
    3. ${includeCallToAction ? 'Strong call-to-action' : ''}
    
    Return ONLY valid JSON:
    {
      "hook": "Refined scroll-stopping hook",
      "sections": [
        {
          "id": "sec-1",
          "title": "Section Header",
          "keyPoints": ["Point 1", "Point 2"],
          "suggestedLength": 50
        }
      ],
      "callToAction": "Engagement question",
      "hashtags": ["#Tag1", "#Tag2"]
    }
  `;
}

/**
 * Step 4: Content Generation Prompt
 */
export function contentGenerationPrompt(outline: ContentOutline, contentType: string, maxLength: number = 1300): string {
  return `
    Write the full LinkedIn post based on this outline: ${JSON.stringify(outline)}.
    Format: ${contentType}
    Max Length: ${maxLength}
    
    Rules:
    - Short paragraphs (1-2 sentences)
    - Double spacing between lines
    - Natural, professional tone
    - No markdown formatting in the output text
    
    Return ONLY valid JSON:
    {
      "content": {
        "text": "The full post text...",
        "hashtags": ["#tag1"],
        "characterCount": 1000,
        "wordCount": 200,
        "readingTime": 1,
        "seoScore": 85
      },
      "formatting": {
        "paragraphs": 5,
        "lineBreaks": 4,
        "emojiCount": 3
      }
    }
  `;
}

/**
 * Step 5: Image Prompt Generation
 */
export function imagePromptGenerationPrompt(content: string, contentType: string, visualStyle: string): string {
  return `
    Create a highly detailed AI image generation prompt for this content.
    Style: ${visualStyle}
    Context: ${content.substring(0, 200)}...
    
    Return ONLY valid JSON:
    {
      "imagePrompts": [
        {
          "id": "img-1",
          "prompt": "Detailed description for DALL-E 3/Midjourney including lighting, composition, and subject...",
          "placement": "header",
          "aspectRatio": "1:1",
          "purpose": "Visual Hook",
          "style": "${visualStyle}"
        }
      ],
      "designTips": ["Tip 1", "Tip 2"]
    }
  `;
}

/**
 * Step 5: SEO Audit Prompt
 */
export function seoAnalysisPrompt(content: string, topic: string, hashtags: string[]): string {
  return `
    Audit this LinkedIn post for the 2025 Algorithm.
    Content: ${content.substring(0, 500)}...
    Topic: ${topic}
    Current Hashtags: ${hashtags.join(', ')}
    
    Return ONLY valid JSON:
    {
      "seoScore": 85,
      "recommendations": [
        { "category": "Hooks", "priority": "high", "issue": "Too long", "solution": "Shorten to 150 chars", "impact": "High" }
      ],
      "hashtagAnalysis": [
        { "hashtag": "#Tag", "type": "niche", "reachPotential": "high", "reasoning": "Good targeting" }
      ],
      "bestPractices": {
        "timing": "Tue 9AM",
        "keywords": ["keyword1"],
        "length": "Optimal",
        "hashtags": ["#Optimized"]
      }
    }
  `;
}
