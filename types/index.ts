
export type Industry = string;

export interface ContentTopic {
  id: string;
  title: string;
  description: string;
  popularity: number; // 1-10
  keywords: string[];
  source: 'auto' | 'manual';
}

export interface ContentIdea {
  id: string;
  title: string;
  hook: string;
  angle: string;
  targetAudience: string;
  estimatedEngagement: number; // 1-100
  contentType: 'post' | 'article' | 'carousel';
  tone: 'professional' | 'casual' | 'inspirational';
}

export interface OutlineSection {
  id: string;
  title: string;
  keyPoints: string[];
  suggestedLength: number; // words
  order: number;
}

export interface ContentOutline {
  hook: string;
  sections: OutlineSection[];
  callToAction: string;
  hashtags: string[];
}

export interface ContentFormatting {
  paragraphs: number;
  lineBreaks: number;
  emojiCount: number;
}

export interface GeneratedContent {
  text: string;
  characterCount: number;
  wordCount: number;
  readingTime: number; // minutes
  hashtags: string[];
  seoScore: number; // 1-100
  formatting: ContentFormatting;
}

export interface ImagePrompt {
  id: string;
  prompt: string; // detailed for AI image generators
  placement: 'header' | 'inline' | string; // e.g., 'carousel-slide-N'
  purpose: string;
  aspectRatio: '16:9' | '1:1' | '4:5';
  style: string;
}

export interface SEORecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  issue: string;
  solution: string;
  impact: string;
}

export interface HashtagDetail {
  hashtag: string;
  type: 'broad' | 'niche' | 'trending' | 'branded';
  reachPotential: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface SEOAnalysis {
  seoScore: number; // 1-100
  recommendations: SEORecommendation[];
  hashtagAnalysis: HashtagDetail[];
  bestPractices: {
    timing: string;
    length: string;
    keywords: string[];
    hashtags: string[];
  };
}

export type Step = 1 | 2 | 3 | 4 | 5;

export interface AppState {
  currentStep: Step;
  industry: Industry;
  topics: ContentTopic[];
  selectedTopic: ContentTopic | null;
  ideas: ContentIdea[];
  selectedIdea: ContentIdea | null;
  outline: ContentOutline | null;
  userOutlineEdits: Partial<ContentOutline>; // Track user modifications
  content: GeneratedContent | null;
  imagePrompts: ImagePrompt[];
  seoAnalysis: SEOAnalysis | null;
  isGenerating: boolean;
  error: string | null;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
}

export type TopicResponse = ApiResponse<ContentTopic[]>;
export type IdeaResponse = ApiResponse<ContentIdea[]>;
export type OutlineResponse = ApiResponse<ContentOutline>;
export type ContentResponse = ApiResponse<GeneratedContent>;
export type ImagePromptResponse = ApiResponse<ImagePrompt[]>;
export type SEOResponse = ApiResponse<SEOAnalysis>;
