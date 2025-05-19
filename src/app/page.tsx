
"use client";

import { useState } from "react";
import { generateLearningPath, type GenerateLearningPathInput, type GenerateLearningPathOutput } from "@/ai/flows/generate-learning-path";
import { generateModuleContent, type GenerateModuleContentInput, type GenerateModuleContentOutput } from "@/ai/flows/generate-module-content";
import { saveLearningPath } from "@/services/learningPathService";
import { useAuth } from "@/context/auth-context";
import { LearningInputForm } from "@/components/learning-input-form";
import { LearningPathDisplay } from "@/components/learning-path-display";
import { AuthButtons } from "@/components/auth-buttons";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Save } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

type ModuleContent = {
  isLoading: boolean;
  content: string | null;
  error: string | null;
};

export default function PathAInderPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [learningPath, setLearningPath] = useState<GenerateLearningPathOutput | null>(null);
  const [currentFormInput, setCurrentFormInput] = useState<GenerateLearningPathInput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleContents, setModuleContents] = useState<{ [moduleIndex: number]: ModuleContent }>({});

  const handleGeneratePlan = async (data: GenerateLearningPathInput) => {
    setIsLoading(true);
    setError(null);
    setLearningPath(null);
    setCurrentFormInput(data); // Store the input for later use
    setModuleContents({}); // Reset module contents
    try {
      const result = await generateLearningPath(data);
      setLearningPath(result);
      toast({
        title: "Learning Path Generated!",
        description: "Your personalized learning path is ready.",
      });
    } catch (e) {
      console.error("Error generating learning path:", e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while generating your learning path. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error Generating Path",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateModuleContent = async (moduleIndex: number, moduleTitle: string, moduleDescription: string) => {
    if (!currentFormInput) {
      toast({ title: "Error", description: "Learning goal context is missing.", variant: "destructive" });
      return;
    }

    setModuleContents(prev => ({
      ...prev,
      [moduleIndex]: { isLoading: true, content: null, error: null }
    }));

    try {
      const input: GenerateModuleContentInput = {
        moduleTitle,
        moduleDescription,
        learningGoal: currentFormInput.learningGoal,
      };
      const result = await generateModuleContent(input);
      setModuleContents(prev => ({
        ...prev,
        [moduleIndex]: { isLoading: false, content: result.detailedContent, error: null }
      }));
      toast({
        title: `Content for "${moduleTitle}"`,
        description: "Detailed content generated successfully.",
      });
    } catch (e) {
      console.error(`Error generating content for module ${moduleIndex}:`, e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setModuleContents(prev => ({
        ...prev,
        [moduleIndex]: { isLoading: false, content: null, error: errorMessage }
      }));
      toast({
        title: `Error for "${moduleTitle}"`,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };


  const handleSavePlan = async () => {
    if (!user || !learningPath) {
      toast({
        title: "Cannot Save Plan",
        description: "You must be logged in and have a generated plan to save.",
        variant: "destructive",
      });
      return;
    }
    setIsSavingPlan(true);
    try {
      // Note: moduleContents are not saved in this version. To save them,
      // you'd need to augment the learningPath object or save them separately.
      await saveLearningPath(user.uid, learningPath);
      toast({
        title: "Plan Saved!",
        description: "Your learning path has been saved successfully.",
      });
    } catch (e) {
      console.error("Error saving learning path:", e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while saving your plan.";
      setError(errorMessage);
      toast({
        title: "Error Saving Plan",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSavingPlan(false);
    }
  };
  
  const resetState = () => {
    setLearningPath(null);
    setCurrentFormInput(null);
    setModuleContents({});
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between max-w-4xl">
          <div className="flex items-center">
            <div className="bg-primary text-primary-foreground p-2 rounded-md shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary ml-2">PathAInder</h1>
          </div>
          <AuthButtons />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Chart Your Course to Knowledge
          </h2>
          <p className="text-lg text-muted-foreground">
            Your AI Personalized Learning Path Planner
          </p>
        </div>

        {!learningPath && !isLoading && !error && (
           <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div className="space-y-6">
              <p className="text-muted-foreground">
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
            <LearningPathDisplay 
              path={learningPath} 
              moduleContents={moduleContents}
              onGenerateModuleContent={handleGenerateModuleContent}
            />
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button 
                onClick={resetState}
                variant="outline"
              >
                Create a New Plan
              </Button>
              {user && !authLoading && (
                <Button onClick={handleSavePlan} disabled={isSavingPlan}>
                  {isSavingPlan ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" /> Saving Plan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Plan
                    </>
                  )}
                </Button>
              )}
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
