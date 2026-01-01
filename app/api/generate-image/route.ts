// app/api/generate-image/route.ts
import { NextResponse } from 'next/server';
import { rateLimiter } from '../../../lib/rate-limiter'; // Reuse your rate limiter if desired

export const runtime = 'edge'; // Optional: Use edge if your plan supports it, otherwise remove

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.BANANA_API_KEY) {
      return NextResponse.json(
        { error: "Server configuration error: API Key missing" },
        { status: 500 }
      );
    }

    // Call Banana.dev from the secure server environment
    const response = await fetch('https://api.banana.dev/start/v4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: process.env.BANANA_API_KEY,
        modelKey: 'stabilityai/stable-diffusion-xl-base-1.0',
        modelInputs: { 
          prompt: prompt,
          num_inference_steps: 25,
          guidance_scale: 7.5
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Banana API Error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check for the base64 image output
    if (data.modelOutputs && data.modelOutputs[0]?.image_base64) {
      const imageUrl = `data:image/png;base64,${data.modelOutputs[0].image_base64}`;
      return NextResponse.json({ imageUrl });
    }

    return NextResponse.json(
      { error: "No image data received from generation provider" },
      { status: 500 }
    );

  } catch (error: any) {
    console.error("Image Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
