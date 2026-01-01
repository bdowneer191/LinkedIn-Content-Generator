import { ContentIdea, ContentOutline } from '../types/index';

export function topicSuggestionPrompt(industry?: string, interests?: string[], targetAudience?: string): string {
  return `
    You are a LinkedIn content strategist. Analyze the "${industry || 'General Business'}" sector.
    Context: Current Date ${new Date().toLocaleDateString()}.
    
    Task: Generate 5 trending, high-engagement LinkedIn topics.
    ${interests?.length ? `Focus areas: ${interests.join(', ')}` : ''}
    ${targetAudience ? `Target Audience: ${targetAudience}` : ''}
    
    Return ONLY valid JSON array:
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

export function outlineGenerationPrompt(idea: ContentIdea): string {
  return `
    Create a structured outline for this LinkedIn post: "${idea.title}".
    Hook: "${idea.hook}"
    
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

export function contentGenerationPrompt(outline: ContentOutline, contentType: string): string {
  return `
    Write the full LinkedIn post based on this outline: ${JSON.stringify(outline)}.
    Format: ${contentType}
    
    Rules:
    - Short paragraphs (1-2 sentences)
    - Double spacing between lines
    - Natural, professional tone
    - No markdown formatting in the output text
    
    Return ONLY valid JSON:
    {
      "content": {
        "text": "The full post text...",
        "hashtags": ["#tag1"]
      },
      "formatting": {
        "paragraphs": 5,
        "emojiCount": 3
      }
    }
  `;
}

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
          "purpose": "Visual Hook"
        }
      ]
    }
  `;
}

export function seoAnalysisPrompt(content: string, topic: string, hashtags: string[]): string {
  return `
    Audit this LinkedIn post for the 2025 Algorithm.
    Content: ${content.substring(0, 500)}...
    Topic: ${topic}
    
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
        "keywords": ["keyword1"]
      }
    }
  `;
}
