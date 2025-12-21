
// Redundant file. Content moved to types/index.ts
// Keeping WordPress types for reference if needed elsewhere
export interface WPConfig {
  siteUrl: string;
  username: string;
  appPassword: string;
}

export interface WPPost {
  id: number;
  title: string;
  link: string;
  excerpt: string;
  content: string;
}

export interface WPInternalLink {
  anchor: string;
  url: string;
  similarity?: number;
  reasoning?: string;
}

export interface WPSEOAnalysis {
  originalContent: string;
  optimizedContent: string;
  linksAdded: WPInternalLink[];
  seoTips: string[];
}
