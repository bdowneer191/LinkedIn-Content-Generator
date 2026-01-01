import React, { useState } from 'react';
import { Target, TrendingUp, ArrowRight, Loader2, Type, MessageSquare, Flame, Edit3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { queryAI } from '../lib/gemini';
import { contentIdeasPrompt } from '../lib/prompts';
import { rateLimiter } from '../lib/rate-limiter';
import { cn } from '../lib/utils';
import { ContentIdea } from '../types/index';

export const IdeaCards: React.FC = () => {
  const { state, updateState, goToStep } = useApp();
  const [contentType, setContentType] = useState<'post' | 'article' | 'carousel'>('post');
  const [tone, setTone] = useState<'professional' | 'casual' | 'inspirational'>('professional');
  const [instructions, setInstructions] = useState('');

  const handleGenerateIdeas = async () => {
    if (!state.selectedTopic) return;
    updateState({ isGenerating: true, error: null });
    try {
      const prompt = contentIdeasPrompt(state.selectedTopic.title, instructions, contentType, tone);
      const result = await rateLimiter.add(() => queryAI<any>(prompt));
      
      const ideas = (result.ideas || result).map((i: any, idx: number) => ({
        ...i,
        id: `idea-${Date.now()}-${idx}`,
        contentType,
        tone
      }));
      
      updateState({ ideas, isGenerating: false });
    } catch (err: any) {
      updateState({ error: err.message, isGenerating: false });
    }
  };

  const handleSelectIdea = (idea: ContentIdea) => {
    updateState({ selectedIdea: idea });
    goToStep(3);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Content Type</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['post', 'article', 'carousel'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 capitalize font-bold text-sm",
                    contentType === type ? "bg-primary/5 border-primary text-primary" : "border-gray-100 text-gray-400 hover:border-gray-200"
                  )}
                >
                  <Type size={20} />
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Tone</h3>
            <div className="flex flex-wrap gap-2">
              {(['professional', 'casual', 'inspirational'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={cn(
                    "px-6 py-3 rounded-full border-2 transition-all font-bold text-sm capitalize",
                    tone === t ? "bg-primary text-white border-primary" : "border-gray-100 text-gray-400 hover:border-gray-200"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
           <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
              <Edit3 size={14} /> Custom Instructions (Optional)
           </label>
           <textarea 
             className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl focus:border-primary outline-none transition-all h-24 text-sm font-medium"
             placeholder="e.g. Focus on ROI, mention experience in SaaS..."
             value={instructions}
             onChange={(e) => setInstructions(e.target.value)}
           />
        </div>
        
        <button
          onClick={handleGenerateIdeas}
          disabled={state.isGenerating}
          className="btn-linkedin w-full py-4 text-lg flex items-center justify-center gap-3"
        >
          {state.isGenerating ? <Loader2 className="animate-spin" /> : <Flame className="fill-white" />}
          Generate Ideas
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {state.ideas.map((idea) => (
          <div
            key={idea.id}
            className="group bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-8 items-start lg:items-center hover:shadow-xl hover:border-primary transition-all cursor-pointer"
            onClick={() => handleSelectIdea(idea)}
          >
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                  <TrendingUp size={14} /> {idea.estimatedEngagement * 10}%
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                  <Target size={14} /> {idea.targetAudience}
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-primary transition-colors">{idea.title}</h3>
              <div className="relative pl-6 border-l-4 border-primary/20">
                <p className="text-gray-600 text-lg italic font-medium">"{idea.hook}..."</p>
              </div>
              <p className="text-gray-500 font-medium">{idea.angle}</p>
            </div>
            
            <button className="bg-gray-50 text-gray-400 group-hover:bg-primary group-hover:text-white p-5 rounded-full transition-all shadow-sm group-hover:shadow-lg">
              <ArrowRight size={28} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
