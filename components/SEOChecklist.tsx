import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, ListFilter, Zap, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { calculateSEOScore } from '../lib/linkedin-seo';
import { queryAI } from '../lib/gemini';
import { seoAnalysisPrompt } from '../lib/prompts';
import { rateLimiter } from '../lib/rate-limiter';

export const SEOChecklist: React.FC = () => {
  const { state, updateState } = useApp();
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

  const currentScore = calculateSEOScore(state.content?.text || '', state.content?.hashtags || []);

  if (!state.seoAnalysis) {
    return (
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 p-12 text-center">
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
          <ShieldCheck size={40} />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Final Polish</h3>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Run a deep-dive AI audit against the 2025 LinkedIn algorithm.</p>
        <button onClick={runAudit} disabled={isAuditing} className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 mx-auto disabled:opacity-50">
          {isAuditing ? <Loader2 className="animate-spin" /> : <Zap className="fill-white" />}
          {isAuditing ? "Auditing..." : "Run SEO Audit"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in">
      <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <div>
          <h3 className="text-2xl font-black text-gray-900">Algorithm Readiness</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Score: {currentScore}/100</p>
        </div>
      </div>
      <div className="p-10 space-y-6">
        {state.seoAnalysis.recommendations.map((rec: any, i: number) => (
          <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-2xl bg-white">
            <div className="mt-1"><Zap size={16} className="text-amber-500"/></div>
            <div>
              <div className="font-bold text-gray-900 text-sm">{rec.issue}</div>
              <div className="text-gray-500 text-xs mt-1">{rec.solution}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
