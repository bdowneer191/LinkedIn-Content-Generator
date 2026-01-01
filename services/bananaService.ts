// services/bananaService.ts
export interface BananaConfig {
  apiKey: string;
  modelKey: string;
}

export async function generateImageWithBanana(prompt: string, apiKey: string) {
  if (!apiKey) throw new Error("Banana API Key is missing");

  const response = await fetch('https://api.banana.dev/start/v4', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: apiKey,
      modelKey: 'stabilityai/stable-diffusion-xl-base-1.0', // Or your specific model key
      modelInputs: { 
        prompt: prompt,
        num_inference_steps: 25,
        guidance_scale: 7.5
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Banana API Error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Banana returns base64 images usually
  if (data.modelOutputs && data.modelOutputs[0]?.image_base64) {
    return `data:image/png;base64,${data.modelOutputs[0].image_base64}`;
  }
  
  throw new Error("No image data received from Banana");
}
