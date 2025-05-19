
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { GenerateLearningPathInput, GenerateLearningPathOutput as LearningPathData } from "@/ai/flows/generate-learning-path";

interface LearningPathContextType {
  pathData: LearningPathData | null;
  formInput: GenerateLearningPathInput | null;
  setGeneratedPath: (data: LearningPathData, input: GenerateLearningPathInput) => void;
  clearGeneratedPath: () => void;
}

const LearningPathContext = createContext<LearningPathContextType | undefined>(undefined);

export function LearningPathProvider({ children }: { children: ReactNode }) {
  const [pathData, setPathData] = useState<LearningPathData | null>(null);
  const [formInput, setFormInput] = useState<GenerateLearningPathInput | null>(null);

  const setGeneratedPath = useCallback((data: LearningPathData, input: GenerateLearningPathInput) => {
    setPathData(data);
    setFormInput(input);
  }, []);

  const clearGeneratedPath = useCallback(() => {
    setPathData(null);
    setFormInput(null);
  }, []);

  return (
    <LearningPathContext.Provider value={{ pathData, formInput, setGeneratedPath, clearGeneratedPath }}>
      {children}
    </LearningPathContext.Provider>
  );
}

export function useLearningPath() {
  const context = useContext(LearningPathContext);
  if (context === undefined) {
    throw new Error('useLearningPath must be used within a LearningPathProvider');
  }
  return context;
}
