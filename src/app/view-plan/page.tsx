
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { useLearningPath } from "@/context/learning-path-context";
import { generateModuleContent, type GenerateModuleContentInput, type GenerateModuleContentOutput } from "@/ai/flows/generate-module-content";
import { saveLearningPath, type SavedModuleDetailedContent } from "@/services/learningPathService";
import { useAuth } from "@/context/auth-context";
import { LearningPathDisplay } from "@/components/learning-path-display";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Save, FilePlus, LogIn, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';


type ModuleContentState = {
  isLoading: boolean;
  sections: GenerateModuleContentOutput['sections'] | null;
  error: string | null;
};

export default function ViewPlanPage() {
  const { user, loading: authLoading } = useAuth();
  const { pathData, formInput, clearGeneratedPath } = useLearningPath();
  const router = useRouter();
  const { toast } = useToast();

  const [moduleContents, setModuleContents] = useState<{ [moduleIndex: number]: ModuleContentState }>({});
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null); // For errors on this page specifically
  const [showSaveSignInDialog, setShowSaveSignInDialog] = useState(false);

  useEffect(() => {
    if (!pathData || !formInput) {
      // If no path data in context (e.g., direct navigation or refresh), redirect to home
      // Small delay to allow context to potentially populate on initial load
      const timer = setTimeout(() => {
        if (!pathData || !formInput) {
            toast({ title: "No Plan Active", description: "Please generate a learning plan first.", variant: "destructive" });
            router.replace('/');
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathData, formInput, router, toast]);

  const handleGenerateModuleContent = async (moduleIndex: number, moduleTitle: string, moduleDescription: string) => {
    if (!formInput) { // formInput should be available if pathData is
      toast({ title: "Error", description: "Learning goal context is missing.", variant: "destructive" });
      return;
    }

    setModuleContents(prev => ({
      ...prev,
      [moduleIndex]: { isLoading: true, sections: null, error: null }
    }));

    try {
      const input: GenerateModuleContentInput = {
        moduleTitle,
        moduleDescription,
        learningGoal: formInput.learningGoal,
      };
      const result = await generateModuleContent(input);
      setModuleContents(prev => ({
        ...prev,
        [moduleIndex]: { isLoading: false, sections: result.sections, error: null }
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
        [moduleIndex]: { isLoading: false, sections: null, error: errorMessage }
      }));
      toast({
        title: `Error for "${moduleTitle}"`,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSaveSignInFromDialog = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Signed In",
        description: "Successfully signed in. You can now save your plan.",
      });
      setShowSaveSignInDialog(false);
      // Potentially re-trigger save after successful sign-in
      if (user && pathData && formInput) { // Check if user is now available
         handleSavePlan();
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Sign In Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSavePlan = async () => {
    if (!user) {
      setShowSaveSignInDialog(true);
      return;
    }

    if (!pathData || !formInput) {
      toast({
        title: "Cannot Save Plan",
        description: "Learning path data or original input is missing.",
        variant: "destructive",
      });
      return;
    }
    setIsSavingPlan(true);
    setPageError(null);

    const modulesDetailsForDb: { [moduleIndex: string]: SavedModuleDetailedContent } = {};
    Object.entries(moduleContents).forEach(([index, detailState]) => {
      if (detailState.sections && detailState.sections.length > 0) {
        modulesDetailsForDb[index] = { sections: detailState.sections };
      }
    });

    try {
      await saveLearningPath(user.uid, pathData, formInput.learningGoal, modulesDetailsForDb);
      toast({
        title: "Plan Saved!",
        description: "Your learning path has been saved. You can find it in 'My Paths'.",
      });
    } catch (e) {
      console.error("Error saving learning path:", e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while saving your plan.";
      setPageError(errorMessage);
      toast({
        title: "Error Saving Plan",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleCreateNewPlan = () => {
    clearGeneratedPath();
    router.push('/');
  };

  if (!pathData || !formInput) {
    // This check is primarily for the initial render before useEffect might redirect
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:px-6 md:py-12 flex flex-col justify-center items-center">
          <Spinner className="h-12 w-12 text-primary mb-4" />
          <p className="text-muted-foreground">Loading learning plan...</p>
           <p className="text-sm text-muted-foreground mt-2">If you see this for a long time, try creating a new plan.</p>
            <Button onClick={() => router.replace('/')} variant="outline" className="mt-6">
                <Home className="mr-2 h-4 w-4" /> Go to Homepage
            </Button>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3 text-center">
          Your Personalized Learning Path
        </h1>
        <p className="text-lg text-muted-foreground mb-8 text-center">
           Goal: <span className="font-medium text-primary">{formInput.learningGoal}</span>
        </p>

        {pageError && (
          <Alert variant="destructive" className="mb-6 shadow-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Oops! Something went wrong.</AlertTitle>
            <AlertDescription>{pageError}</AlertDescription>
          </Alert>
        )}

        <LearningPathDisplay
          path={pathData}
          moduleContents={moduleContents}
          onGenerateModuleContent={handleGenerateModuleContent}
        />

        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={handleCreateNewPlan}
            variant="outline"
            size="lg"
          >
            <FilePlus className="mr-2 h-5 w-5" /> Create a New Plan
          </Button>
          {!authLoading && ( // Only show save if auth state is determined
            <Button onClick={handleSavePlan} disabled={isSavingPlan || authLoading} size="lg">
              {isSavingPlan ? (
                <>
                  <Spinner className="mr-2 h-5 w-5" /> Saving Plan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" /> Save This Plan
                </>
              )}
            </Button>
          )}
        </div>
      </main>

      <AlertDialog open={showSaveSignInDialog} onOpenChange={setShowSaveSignInDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign In to Save</AlertDialogTitle>
              <AlertDialogDescription>
                Please sign in with your Google account to save your learning path.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveSignInFromDialog}>
                <LogIn className="mr-2 h-4 w-4" /> Sign In with Google
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      <Footer />
    </div>
  );
}


// Simple Header and Footer components for this page
function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between max-w-6xl">
        <Link href="/" className="flex items-center">
          <div className="bg-primary text-primary-foreground p-2 rounded-md shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary ml-2">PathAInder</h1>
        </Link>
        {/* AuthButtons could be added here if desired, or keep it simpler */}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="text-center py-6 border-t bg-muted">
      <div className="container mx-auto px-4 md:px-6">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PathAInder. All rights reserved. Powered by AI.
        </p>
      </div>
    </footer>
  );
}
