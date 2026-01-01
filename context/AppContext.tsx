import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, Step } from '../types/index';
import { storage } from '../lib/storage';

interface AppContextType {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  resetState: () => void;
  goToStep: (step: Step) => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const initialState: AppState = {
  currentStep: 1,
  industry: '',
  topics: [],
  selectedTopic: null,
  ideas: [],
  selectedIdea: null,
  outline: null,
  userOutlineEdits: {},
  content: null,
  imagePrompts: [],
  seoAnalysis: null,
  isGenerating: false,
  error: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = storage.load();
    if (saved) {
      // CRITICAL FIX: Always reset isGenerating to false on load.
      // This prevents the "Infinite Spinner" bug if the app was closed while generating.
      return { 
        ...saved, 
        isGenerating: false, 
        error: null 
      };
    }
    return initialState;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Auto-save changes
  useEffect(() => {
    storage.saveWithDebounce(state);
  }, [state]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetState = useCallback(() => {
    if (confirm("Clear current draft and start over?")) {
      storage.clear();
      setState(initialState);
    }
  }, []);

  const goToStep = useCallback((step: Step) => {
    setState(prev => ({ ...prev, currentStep: step }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Sync state.isGenerating with isLoading for easy UI usage
  useEffect(() => {
    setIsLoading(state.isGenerating);
  }, [state.isGenerating]);

  return (
    <AppContext.Provider 
      value={{ 
        state, 
        updateState, 
        resetState, 
        goToStep, 
        isLoading, 
        error: state.error, 
        clearError 
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
