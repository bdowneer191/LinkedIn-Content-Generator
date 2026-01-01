// components/SEOChecklist.tsx
import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, ListFilter, ArrowRightCircle, Zap, TrendingUp, Info, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { calculateSEOScore } from '../lib/linkedin-seo';
import { queryAI } from '../lib/gemini';
import { seoAnalysisPrompt } from '../lib/prompts';
import { rateLimiter } from '../lib/rate-limiter';

export const SEOChecklist: React.FC = () => {
  const { state, updateState } = useApp();
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  const [isAuditing, setIsAuditing] = useState(false);

  const runAudit = async () => {
    if (!state.content) return;
    setIsAuditing(true);
    try {
      const prompt = seoAnalysisPrompt(state.content.text, state.selectedTopic?.title || 'General', state.content.hashtags);
      const analysis = await rateLimiter.add(() => queryAI<any>(prompt));
      updateState({ seoAnalysis: analysis });
    } catch (err: any) {
      alert("Audit failed: " + err.message);
    } finally {
      setIsAuditing(false);
    }
  };

  const toggleComplete = (idx: number) => {
    const newSet = new Set(completedItems);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setCompletedItems(newSet);
  };

  const currentScore = calculateSEOScore(state.content?.text || '', state.content?.hashtags || []);

  if (!state.seoAnalysis) {
    return (
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden p-12 text-center">
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
          <ShieldCheck size={40} />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Final Polish</h3>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Run a deep-dive AI audit against the 2025 LinkedIn algorithm.</p>
        <button 
          onClick={runAudit} 
          disabled={isAuditing}
          className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
        >
          {isAuditing ? <Loader2 className="animate-spin" /> : <Zap className="fill-white" />}
          {isAuditing ? "Auditing Content..." : "Run SEO Audit"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in duration-700">
      <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-white to-gray-50/50">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-secondary/10 rounded-[1.5rem] text-secondary shadow-inner"><ShieldCheck size={32} /></div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 leading-tight">Algorithm Readiness</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">LinkedIn SEO Audit v2.0</p>
          </div>
        </div>
        <div className="relative flex items-center justify-center">
           <svg className="w-24 h-24 transform -rotate-90">
             <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
             <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - currentScore / 100)} className={cn("transition-all duration-1000", currentScore > 70 ? "text-secondary" : "text-amber-400")} />
           </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-gray-900 leading-none">{currentScore}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Score</span>
           </div>
        </div>
      </div>
      
      <div className="p-10 space-y-10">
        {state.seoAnalysis.hashtagAnalysis?.map((item, idx) => (
          <div key={idx} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-primary font-black text-lg">{item.hashtag}</span>
              <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase bg-blue-100 text-blue-700">{item.reachPotential || 'High'} Potential</span>
            </div>
            <p className="text-xs text-gray-600 font-medium">{item.reasoning}</p>
          </div>
        ))}

        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2"><ListFilter size={14}/> Recommendations</h4>
          {state.seoAnalysis.recommendations.map((rec, i) => {
            const isDone = completedItems.has(i);
            return (
              <div key={i} className={cn("group flex gap-5 p-6 rounded-[2rem] border-2 transition-all cursor-pointer", isDone ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-transparent hover:border-primary/20 hover:shadow-xl")} onClick={() => toggleComplete(i)}>
                 <div className={cn("mt-1 w-7 h-7 rounded-full flex items-center justify-center transition-all", isDone ? "bg-secondary text-white" : "border-2 border-gray-200 group-hover:border-primary group-hover:bg-primary group-hover:text-white")}>
                    {isDone ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-transparent" />}
                 </div>
                 <div className="flex-1">
                    <span className={cn("text-[10px] font-black px-2 py-1 rounded-full uppercase mb-2 inline-block", rec.priority === 'high' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600")}>{rec.priority} Priority</span>
                    <p className="text-sm text-gray-600 mb-2 font-medium">{rec.issue}</p>
                    {!isDone && <p className="text-sm text-gray-800 font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">💡 {rec.solution}</p>}
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
