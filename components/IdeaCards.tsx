import React, { useState } from 'react';
import { Target, TrendingUp, ArrowRight, Loader2, Type, MessageSquare, Flame, Edit3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { queryAI } from '../lib/gemini';
import { contentIdeasPrompt } from '../lib/prompts';
import { rateLimiter } from '../lib/rate-limiter';
import { cn } from '../lib/utils';

export const IdeaCards: React.FC = () => {
  const { state, updateState, goToStep } = useApp();
  const [contentType, setContentType] = useState<'post' | 'article' | 'carousel'>('post');
  const [tone, setTone] = useState('professional');
  const [instructions, setInstructions] = useState('');

  const handleGenerateIdeas = async () => {
    if (!state.selectedTopic) return;
    updateState({ isGenerating: true, error: null });
    try {
      const prompt = contentIdeasPrompt(state.selectedTopic.title, instructions, contentType, tone);
      const result = await rateLimiter.add(() => queryAI<any>(prompt));
      const ideas = (result.ideas || result).map((i: any, idx: number) => ({
        ...i, id: `idea-${Date.now()}-${idx}`, contentType, tone
      }));
      updateState({ ideas, isGenerating: false });
    } catch (err: any) {
      updateState({ error: err.message, isGenerating: false });
    }
  };

  const handleSelectIdea = (idea: any) => {
    updateState({ selectedIdea: idea });
    goToStep(3);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Content Type</h3>
            <div className="flex gap-2">
              {['post', 'article', 'carousel'].map(t => (
                <button key={t} onClick={() => setContentType(t as any)} className={cn("px-4 py-2 rounded-xl border-2 font-bold capitalize text-sm transition-all", contentType === t ? "border-primary text-primary bg-blue-50" : "border-gray-100 text-gray-400")}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Tone</h3>
            <div className="flex gap-2">
              {['professional', 'casual', 'inspirational'].map(t => (
                <button key={t} onClick={() => setTone(t)} className={cn("px-4 py-2 rounded-xl border-2 font-bold capitalize text-sm transition-all", tone === t ? "border-primary text-primary bg-blue-50" : "border-gray-100 text-gray-400")}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
           <label className="text-xs font-black uppercase text-gray-400 flex items-center gap-2"><Edit3 size={12}/> Custom Instructions</label>
           <textarea className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-primary outline-none text-sm h-20" placeholder="e.g. Focus on SaaS metrics..." value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </div>

        <button onClick={handleGenerateIdeas} disabled={state.isGenerating} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
          {state.isGenerating ? <Loader2 className="animate-spin" /> : <Flame className="fill-white" />} Generate Angles
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {state.ideas.map((idea) => (
          <div key={idea.id} className="group bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-8 items-center hover:shadow-2xl hover:border-primary transition-all cursor-pointer" onClick={() => handleSelectIdea(idea)}>
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <span className="bg-green-50 text-green-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-green-100">Score: {idea.estimatedEngagement * 10}/100</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors">{idea.title}</h3>
              <p className="text-gray-600 text-lg italic border-l-4 border-primary/20 pl-4">"{idea.hook}..."</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-full group-hover:bg-primary group-hover:text-white transition-all text-gray-400">
               <ArrowRight size={24} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
