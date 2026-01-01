// components/ImagePromptCard.tsx
import React, { useState } from 'react';
import { Image as ImageIcon, Copy, Maximize, Palette, Layout, Info, ChevronDown, CheckCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { rateLimiter } from '../lib/rate-limiter';
import { queryAI } from '../lib/gemini';
import { imagePromptGenerationPrompt } from '../lib/prompts';

// ... (Keep your styles array and existing interfaces) ...

export const ImagePromptCard: React.FC = () => {
  const { state, updateState } = useApp();
  const [visualStyle, setVisualStyle] = useState(state.imagePrompts[0]?.style || 'professional');
  const [tipsOpen, setTipsOpen] = useState(false);
  
  // State for generation loading
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  // ... (Keep handleGeneratePrompts function) ...

  const handleGenerateRealImage = async (promptText: string) => {
    setIsGeneratingImg(true);
    try {
      // Call OUR internal secure API, not the external one directly
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }
      
      updateState({ generatedImage: data.imageUrl });
    } catch (error: any) {
      alert("Image generation failed: " + error.message);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ... (Keep existing Visual Direction section) ... */}

      {/* ... (Keep existing Prompt Display Grid) ... */}

      {/* MODIFIED: Real Image Generation Section (No Input Field) */}
      {state.imagePrompts.length > 0 && (
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-inner">
          <h4 className="font-bold mb-4 text-gray-900 flex items-center gap-2">
            <ImageIcon size={18} /> Real Image Generation
          </h4>
          
          {!state.generatedImage ? (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
                 <strong>Note:</strong> Generates using server-side credits.
              </div>
              <button 
                onClick={() => handleGenerateRealImage(state.imagePrompts[0]?.prompt)}
                disabled={isGeneratingImg || !state.imagePrompts[0]}
                className="w-full bg-secondary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary-dark transition-all disabled:opacity-50"
              >
                {isGeneratingImg ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Rendering on GPU...
                  </>
                ) : (
                  "Generate Real Image"
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
                <img src={state.generatedImage} alt="Generated" className="w-full h-auto" />
              </div>
              <button 
                onClick={() => updateState({ generatedImage: undefined })}
                className="text-xs font-bold text-gray-500 hover:text-primary w-full text-center"
              >
                Discard & Generate New
              </button>
            </div>
          )}
        </div>
      )}

      {/* ... (Keep existing Design Rules section) ... */}
    </div>
  );
};
