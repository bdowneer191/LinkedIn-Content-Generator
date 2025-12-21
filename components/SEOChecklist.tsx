
import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Info, CheckCircle2, ListFilter, ArrowRightCircle, Zap, TrendingUp, Globe, Target, Hash } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { calculateSEOScore } from '../lib/linkedin-seo';

export const SEOChecklist: React.FC = () => {
  const { state, updateState } = useApp();
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  if (!state.seoAnalysis) return null;

  const toggleComplete = (idx: number) => {
    const newSet = new Set(completedItems);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setCompletedItems(newSet);
  };

  const currentScore = calculateSEOScore(state.content?.text || '', state.content?.hashtags || []);

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in duration-700">
      <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-white to-gray-50/50">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-secondary/10 rounded-[1.5rem] text-secondary shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 leading-tight">Algorithm Readiness</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">LinkedIn SEO Audit v2.0</p>
          </div>
        </div>
        
        <div className="relative flex items-center justify-center">
           <svg className="w-24 h-24 transform -rotate-90">
             <circle 
                cx="48" cy="48" r="40" 
                stroke="currentColor" strokeWidth="8" 
                fill="transparent" 
                className="text-gray-100"
             />
             <circle 
                cx="48" cy="48" r="40" 
                stroke="currentColor" strokeWidth="8" 
                fill="transparent" 
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - currentScore / 100)}
                className={cn(
                  "transition-all duration-1000",
                  currentScore > 70 ? "text-secondary" : currentScore > 40 ? "text-amber-400" : "text-red-500"
                )}
             />
           </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-gray-900 leading-none">{currentScore}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Score</span>
           </div>
        </div>
      </div>
      
      <div className="p-10 space-y-10">
        {/* Detailed Hashtag Analysis */}
        {state.seoAnalysis.hashtagAnalysis && state.seoAnalysis.hashtagAnalysis.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                <TrendingUp size={14} /> Hashtag Reach Potential
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {state.seoAnalysis.hashtagAnalysis.map((item, idx) => (
                <div key={idx} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-primary font-black text-lg">{item.hashtag}</span>
                    <div className="flex gap-2">
                      <span className={cn(
                        "text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest",
                        item.reachPotential === 'high' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {item.reachPotential} Reach
                      </span>
                      <span className="bg-white text-gray-500 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest border border-gray-100">
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">{item.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
              <ListFilter size={14} /> Critical Recommendations
            </label>
            <span className="text-[10px] font-bold text-gray-400">{state.seoAnalysis.recommendations.length} items to address</span>
          </div>

          {state.seoAnalysis.recommendations.map((rec, i) => {
            const isDone = completedItems.has(i);
            return (
              <div 
                key={i} 
                className={cn(
                  "group flex gap-5 p-6 rounded-[2rem] border-2 transition-all cursor-pointer",
                  isDone ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-transparent hover:border-primary/20 hover:shadow-xl"
                )}
                onClick={() => toggleComplete(i)}
              >
                 <div className={cn(
                   "mt-1 w-7 h-7 rounded-full flex items-center justify-center transition-all",
                   isDone ? "bg-secondary text-white" : "border-2 border-gray-200 group-hover:border-primary group-hover:bg-primary group-hover:text-white"
                 )}>
                    {isDone ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-transparent" />}
                 </div>
                 <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-black text-sm text-gray-900 group-hover:text-primary transition-colors">{rec.category}</span>
                      <span className={cn(
                        "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border shadow-sm",
                        rec.priority === 'high' ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 font-medium leading-relaxed">{rec.issue}</p>
                    {!isDone && (
                      <div className="p-4 bg-gray-50 rounded-2xl text-sm border border-gray-100 group-hover:bg-white group-hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-2 text-primary font-black mb-2 uppercase tracking-widest text-[10px]">
                           <Zap size={12} className="fill-primary" /> Proposed Solution
                        </div>
                        <p className="text-gray-700 leading-relaxed font-medium">{rec.solution}</p>
                        <div className="mt-3 text-[10px] font-bold text-gray-400 flex items-center gap-2 italic">
                          <ArrowRightCircle size={12} /> Predicted Impact: {rec.impact}
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            );
          })}
        </div>

        <div className="p-8 bg-blue-50/30 rounded-[2rem] border-2 border-blue-100/50 space-y-6">
           <h4 className="font-black text-primary text-sm flex items-center gap-2 uppercase tracking-widest">
              <Info size={16} /> Algorithm Best Practices
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Peak Engagement Window</span>
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <p className="text-sm text-gray-700 font-bold">{state.seoAnalysis.bestPractices.timing}</p>
                 </div>
              </div>
              <div className="space-y-3">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Optimal Keyword Mix</span>
                 <div className="flex flex-wrap gap-2">
                    {state.seoAnalysis.bestPractices.keywords.map(k => (
                      <span key={k} className="text-[10px] bg-white text-primary border border-primary/20 px-2.5 py-1 rounded-full font-black uppercase tracking-tighter">
                        {k}
                      </span>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
