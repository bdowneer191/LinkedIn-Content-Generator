
# LinkedIn Content Generator AI Agent

An advanced, professional-grade AI content creation tool specifically optimized for the LinkedIn 2025 algorithm. 

## 🚀 Features

- **Trending Topic Discovery**: AI-powered analysis of your industry to find high-engagement topics.
- **Content Ideation**: Generate unique angles, hooks, and perspectives tailored to your target audience.
- **Interactive Outline Editor**: Drag-and-drop sections, key points, and strategic hook editing.
- **Smart Content Generation**: Generates full posts/articles with algorithm-friendly formatting (short paragraphs, line breaks, emojis).
- **SEO & Algorithm Audit**: Real-time scoring based on length, hashtag strategy, engagement triggers, and readability.
- **AI Image Prompting**: Detailed prompts for DALL-E/Midjourney to accompany your professional content.
- **Local Persistence**: Auto-saves your progress; export/import drafts as JSON files.

## 🛠 Tech Stack

- **React + TypeScript**: Robust frontend architecture.
- **Tailwind CSS**: LinkedIn-inspired theme and design system.
- **Gemini 3 Flash**: High-performance LLM for content generation.
- **Zod**: Type-safe schema validation.
- **Sonner**: Delightful toast notifications.

## 🏁 Getting Started

1. **Environment Variables**:
   Ensure `process.env.API_KEY` is configured in your deployment environment.

2. **Installation**:
   ```bash
   npm install
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

## 📈 LinkedIn SEO Best Practices (Built-in)

- **Post Length**: Optimal range is 1200-1300 characters for maximum reach.
- **Mobile First**: Paragraphs are limited to 2-3 sentences with double line breaks.
- **The Hook**: Critical first 150 characters designed to stop the scroll.
- **Hashtags**: Recommended 3-5 tags, mixing broad industry terms with niche topics.

## 🔒 Privacy & Data

All content generation happens via the Gemini API. Your drafts are stored locally in your browser's `localStorage`. Use the Export feature to back up your work.

---
© 2025 AI Content Studio. Built for professional impact.
