"use client";

import { useState } from "react";
import { generateLearningPath } from "@/ai/flows/generate-learning-path";
import type { GenerateLearningPathInput, GenerateLearningPathOutput } from "@/ai/flows/generate-learning-path";
import { LearningInputForm } from "@/components/learning-input-form";
import { LearningPathDisplay } from "@/components/learning-path-display";
import { Spinner } from "@/components/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Image from 'next/image';

export default function PathAInderPage() {
  const [learningPath, setLearningPath] = useState<GenerateLearningPathOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async (data: GenerateLearningPathInput) => {
    setIsLoading(true);
    setError(null);
    setLearningPath(null); 
    try {
      // Add a small delay to simulate processing and show loading state
      // await new Promise(resolve => setTimeout(resolve, 1500));
      const result = await generateLearningPath(data);
      setLearningPath(result);
    } catch (e) {
      console.error("Error generating learning path:", e);
      setError(e instanceof Error ? e.message : "An unexpected error occurred while generating your learning path. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl">
        <header className="text-center mb-10 md:mb-16">
          <div className="flex justify-center items-center mb-4">
            {/* Replace with a proper logo if available, or keep simple text */}
            {/* For example, an inline SVG or a simple character logo */}
            <div className="bg-primary text-primary-foreground p-3 rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary ml-3">PathAInder</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Your AI Personalized Learning Path Planner
          </p>
        </header>

        {!learningPath && !isLoading && !error && (
           <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Chart Your Course to Knowledge</h2>
              <p className="text-muted-foreground mb-6">
                Unlock your potential with a learning plan tailored just for you. Simply tell us your goals, and our AI will craft a step-by-step roadmap to guide your studies. Get started on your learning adventure today!
              </p>
              <Image 
                src="https://placehold.co/600x400.png" 
                alt="Person planning their learning journey"
                data-ai-hint="learning planning"
                width={600} 
                height={400} 
                className="rounded-lg shadow-md object-cover"
              />
            </div>
            <LearningInputForm onSubmit={handleGeneratePlan} isLoading={isLoading} />
          </div>
        )}

        { (learningPath || isLoading || error) && <LearningInputForm onSubmit={handleGeneratePlan} isLoading={isLoading} /> }


        {isLoading && (
          <div className="flex flex-col justify-center items-center mt-12 space-y-4">
            <Spinner className="h-12 w-12 text-primary" />
            <p className="text-lg text-muted-foreground">
              Crafting your personalized learning path...
            </p>
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="mt-8 shadow-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Oops! Something went wrong.</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {learningPath && !isLoading && !error && (
          <>
            <LearningPathDisplay path={learningPath} />
            <div className="mt-8 text-center">
              <button 
                onClick={() => {
                  setLearningPath(null);
                  setError(null);
                  // Optionally reset form if child component exposes a reset method or manage form reset via key prop
                }}
                className="text-primary hover:underline"
              >
                Create a new plan
              </button>
            </div>
          </>
        )}
      </main>
      <footer className="text-center py-6 border-t">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PathAInder. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
