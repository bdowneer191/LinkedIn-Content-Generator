
import React from 'react';
import { Check, Search, Lightbulb, FileText, FileCheck, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { Step } from '../types/index';

interface ProgressStepsProps {
  currentStep: Step;
  onStepClick?: (step: number) => void;
}

const steps = [
  { id: 1, name: 'Topics', icon: Search },
  { id: 2, name: 'Ideas', icon: Lightbulb },
  { id: 3, name: 'Outline', icon: FileText },
  { id: 4, name: 'Content', icon: FileCheck },
  { id: 5, name: 'Enhance', icon: Sparkles },
];

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl mx-auto px-4 py-8 gap-4 md:gap-0">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        
        return (
          <React.Fragment key={step.id}>
            <div 
              className={cn(
                "flex flex-col items-center relative z-10 group",
                onStepClick && "cursor-pointer"
              )}
              onClick={() => onStepClick?.(step.id)}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 shadow-sm",
                  isCompleted ? "bg-secondary border-secondary text-white" :
                  isCurrent ? "bg-primary border-primary text-white scale-110 shadow-lg shadow-blue-500/30" :
                  "bg-white border-gray-200 text-gray-400"
                )}
              >
                {isCompleted ? <Check size={24} /> : <Icon size={22} />}
              </div>
              <span className={cn(
                "mt-3 text-[10px] md:text-xs font-bold uppercase tracking-widest text-center whitespace-nowrap",
                isCurrent || isCompleted ? "text-gray-900" : "text-gray-400"
              )}>
                {step.name}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="hidden md:block flex-1 h-0.5 mx-4 -mt-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gray-100" />
                <div 
                  className={cn(
                    "absolute inset-0 bg-secondary transition-all duration-500",
                    isCompleted ? "translate-x-0" : "-translate-x-full"
                  )} 
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
