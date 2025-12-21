1. Core Functionality & Workflow
The app operates through a linear, 5-step pipeline designed to maximize "Dwell Time" and "Engagement Rate"—the two primary metrics of the LinkedIn feed algorithm.
Step 1: Topic Discovery
How it works: The agent uses the gemini-3-flash-preview model to perform a semantic analysis of a specific industry.
Technical Logic: It doesn't just list keywords; it generates "Trend Scores" (1-10) and keywords tags. Users can also input manual topics which the agent then enriches with metadata.
Step 2: Creative Ideation
How it works: It generates 5 distinct "angles" for the selected topic (e.g., The Contrarian View, The Step-by-Step Guide, The Personal Story).
Technical Logic: Each idea includes a "Hook" and an "Impact Meter." The UI uses a local estimation logic combined with AI reasoning to predict engagement potential.
Step 3: Structured Blueprinting (Outline Editor)
How it works: An interactive editor where users refine the "Scroll-Stopping Hook" (limited to 150 characters to ensure it stays "above the fold" before the "See More" button).
Technical Logic: The outline is broken into "Blocks" with key points. Users can drag-and-drop or reorder these to ensure a logical flow.
Step 4: Algorithmic Content Generation
How it works: The agent manifests the full text, strictly adhering to LinkedIn Formatting Rules:
Short paragraphs (max 2-3 sentences).
Double line breaks for mobile readability.
Strategic emoji placement.
Call-to-Action (CTA) engagement questions.
Local SEO Scoring: A local utility (linkedin-seo.ts) calculates a real-time score (0-100) based on character count (optimal: 1200-1300), line breaks, and hashtag density.
Step 5: Visual & Technical Enhancement
Image Prompts: Generates high-fidelity prompts for DALL-E 3 or Midjourney based on the content’s "Visual Style" (Minimalist, Corporate, etc.).
Deep SEO Audit: A final AI pass that checks for keyword mix, peak posting windows, and hashtag reach potential (Broad vs. Niche).
2. Technical Architecture
AI Integration (Gemini 3 Flash)
The app uses the @google/genai SDK.
Model Selection: gemini-3-flash-preview is used for its high speed and low latency, essential for a step-by-step UI.
Structured Outputs: All AI responses are forced into strict JSON schemas using responseMimeType: "application/json", ensuring the UI never breaks due to "AI chatter."
State & Persistence
Context Management: A custom AppContext manages the complex state across all 5 steps.
Auto-Save: Implements a debounced storage.ts utility that saves the state to localStorage every 1000ms.
Session Portability: Users can "Export" their entire session as a .json file and "Import" it later to resume work.
Performance & Safety
Rate Limiting: Since the Gemini Free Tier is limited to 15 Requests Per Minute (RPM), I implemented a RateLimiter class in lib/rate-limiter.ts. It queues requests and executes them with a jittered delay to prevent 429 errors.
Caching: The ContentCache utility hashes the prompt and stores the AI result in localStorage, so if a user goes back and forth between steps, they don't waste API credits.
3. Vercel Compatibility & Deployment
The app is built to be "Vercel-Native" using the following configurations:
Edge Runtime: All API routes (app/api/*/route.ts) are configured with export const runtime = 'edge'. This ensures global low latency and bypasses the standard 10s timeout of serverless functions.
Environment Variables: The app requires a single secret: API_KEY. In Vercel, this must be added to the Project Settings.
Security Headers: The vercel.json file is pre-configured with security headers (X-Frame-Options, X-Content-Type-Options) and caching rules for static assets to ensure a 100/100 Lighthouse score.
Static Site Generation (SSG) / Hybrid: The frontend is served as a fast static bundle, while the AI logic is handled via the dynamic Edge API routes.
4. Technical Summary Table
Feature	Technology
Framework	Next.js 14 / React 19 (Vite-compatible index.tsx)
Styling	Tailwind CSS (Custom LinkedIn Color Palette)
Icons	Lucide React
AI SDK	@google/genai (Gemini 3 Flash)
Validation	Zod (for API request/response integrity)
Toasts	Sonner
Runtime	Vercel Edge Runtime
Caching	Custom LocalStorage-based Semantic Cache
Rate Limiting	15 RPM Synchronized Queue
How to make it work (Deployment steps):
Clone the code to a GitHub repo.
Connect the repo to Vercel.
Add API_KEY (your Google AI Studio key) to Vercel environment variables.
Deploy. Vercel will automatically detect the vercel.json and the app/api directory to set up the backend.
