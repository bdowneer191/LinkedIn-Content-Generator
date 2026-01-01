import React, { useState } from 'react';
import { Sparkles, ArrowRight, Search, Edit3, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { queryAI } from '../lib/gemini';
import { topicSuggestionPrompt } from '../lib/prompts';
import { rateLimiter } from '../lib/rate-limiter';
import { cn } from '../lib/utils';
import { ContentTopic } from '../types/index';

export const TopicSelector: React.FC = () => {
  const { state, updateState, goToStep } = useApp();
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [industry, setIndustry] = useState(state.industry || '');
  const [manualTopic, setManualTopic] = useState('');
  
  const handleGenerateTopics = async () => {
    if (!industry) return;
    updateState({ isGenerating: true, error: null });
    try {
      const prompt = topicSuggestionPrompt(industry);
      const result = await rateLimiter.add(() => queryAI<any>(prompt));
      const topics = (result.topics || result).map((t: any, idx: number) => ({
        ...t,
        id: `topic-${Date.now()}-${idx}`,
        source: 'auto'
      }));
      updateState({ topics, industry, isGenerating: false });
    } catch (err: any) {
      updateState({ error: err.message, isGenerating: false });
    }
  };

  const handleSelectTopic = (topic: ContentTopic) => {
    updateState({ selectedTopic: topic });
    goToStep(2);
  };

  const handleManualContinue = () => {
    if (manualTopic.length < 10) return;
    const topic: ContentTopic = {
      id: `manual-${Date.now()}`,
      title: manualTopic,
      description: 'Manually entered topic',
      popularity: 5,
      keywords: manualTopic.split(' ').filter(w => w.length > 4).slice(0, 3),
      source: 'manual'
    };
    handleSelectTopic(topic);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('auto')}
            className={cn(
              "flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 transition-all relative",
              activeTab === 'auto' ? "text-primary bg-blue-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            )}
          >
            <Sparkles size={18} className={activeTab === 'auto' ? 'text-primary' : ''} /> 
            AI Suggestions
            {activeTab === 'auto' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={cn(
              "flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 transition-all relative",
              activeTab === 'manual' ? "text-primary bg-blue-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            )}
          >
            <Edit3 size={18} className={activeTab === 'manual' ? 'text-primary' : ''} /> 
            Manual Input
            {activeTab === 'manual' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        </div>

        <div className="p-12">
          {activeTab === 'auto' ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">What industry or domain are you focused on?</h3>
                <p className="text-gray-500 text-sm">We'll analyze trending topics and high-engagement content in your niche</p>
              </div>
              
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                <input
                  type="text"
                  placeholder="digital marketing"
                  className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-gray-200 focus:border-primary outline-none transition-all font-medium text-lg bg-gray-50 focus:bg-white"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateTopics()}
                />
              </div>

              <button
                onClick={handleGenerateTopics}
                disabled={state.isGenerating || !industry}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.99]"
              >
                {state.isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Analyzing trends...
                  </>
                ) : (
                  <>
                    <Sparkles size={24} />
                    Discover Trends
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Enter your specific topic</h3>
              <textarea
                placeholder="Describe what you want to write about..."
                className="w-full p-6 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all font-medium h-32 resize-none"
                value={manualTopic}
                onChange={(e) => setManualTopic(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <span className={cn("text-xs font-bold", manualTopic.length < 10 ? "text-amber-500" : "text-green-500")}>
                  {manualTopic.length} characters (min 10)
                </span>
                <button
                  onClick={handleManualContinue}
                  disabled={manualTopic.length < 10}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'auto' && state.topics.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          {state.topics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => handleSelectTopic(topic)}
              className="group bg-white p-8 rounded-3xl shadow-sm border-2 border-gray-100 hover:border-primary hover:shadow-2xl transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {topic.popularity > 8 && (
                      <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full">
                        <span className="text-lg">🔥</span>
                        <span className="text-xs font-black uppercase tracking-wider">Hot</span>
                      </div>
                    )}
                    <div className="text-xs font-bold text-gray-400">
                      Score: {topic.popularity}/10
                    </div>
                  </div>
                  
                  <h4 className="font-black text-2xl text-gray-900 group-hover:text-primary transition-colors leading-tight">
                    {topic.title}
                  </h4>
                  
                  <p className="text-gray-600 text-base leading-relaxed font-medium">
                    {topic.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {topic.keywords.map(kw => (
                      <span key={kw} className="text-xs text-gray-500 font-bold bg-gray-100 px-3 py-1.5 rounded-lg">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
                
                <button className="shrink-0 w-12 h-12 rounded-full bg-gray-100 group-hover:bg-primary text-gray-400 group-hover:text-white flex items-center justify-center transition-all">
                  <ArrowRight size={24} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
