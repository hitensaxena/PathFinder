
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { useLearningPath } from "@/context/learning-path-context";
import { generateModuleContent, type GenerateModuleContentInput, type GenerateModuleContentOutput } from "@/ai/flows/generate-module-content";
import { saveLearningPath, type SavedModuleDetailedContent, type SavedLearningPath } from "@/services/learningPathService";
import { useAuth } from "@/context/auth-context";
import { LearningPathDisplay } from "@/components/learning-path-display";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Save, FilePlus, LogIn, Home, Sparkles, CheckCircle, BookCopy } from "lucide-react"; // Added BookCopy
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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


type SectionContent = {
  sectionTitle: string;
  sectionContent: string;
  recommendedYoutubeVideoQuery: string;
};

type ModuleContentState = {
  isLoading: boolean;
  sections: SectionContent[] | null;
  error: string | null;
};

export default function ViewPlanPage() {
  const { user, loading: authLoading } = useAuth();
  const { pathData, formInput, clearGeneratedPath } = useLearningPath();
  const router = useRouter();
  const { toast } = useToast();

  const [moduleContents, setModuleContents] = useState<{ [moduleIndex: string]: ModuleContentState }>({});
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [showSaveSignInDialog, setShowSaveSignInDialog] = useState(false);
  const [isPlanSaved, setIsPlanSaved] = useState(false);


  useEffect(() => {
    if (!authLoading && (!pathData || !formInput)) {
      const timer = setTimeout(() => {
        if (!pathData || !formInput) { // Re-check inside timeout
            toast({ title: "No Plan Active", description: "Please generate a learning plan first.", variant: "destructive" });
            router.replace('/');
        }
      }, 200); // Short delay to allow context to populate
      return () => clearTimeout(timer);
    }
  }, [pathData, formInput, router, toast, authLoading]);

  const handleGenerateModuleContent = async (moduleIndex: number, moduleTitle: string, moduleDescription: string) => {
    if (!formInput) {
      toast({ title: "Error", description: "Learning goal context is missing.", variant: "destructive" });
      return;
    }
    const moduleKey = String(moduleIndex);
    setModuleContents(prev => ({
      ...prev,
      [moduleKey]: { isLoading: true, sections: null, error: null }
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
        [moduleKey]: { isLoading: false, sections: result.sections, error: null }
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
        [moduleKey]: { isLoading: false, sections: null, error: errorMessage }
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
      setIsPlanSaved(true); // Mark plan as saved
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

  if (authLoading || !pathData || !formInput) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:px-6 md:py-12 flex flex-col justify-center items-center">
          <Card className="p-8 shadow-xl rounded-xl">
            <Spinner className="h-16 w-16 text-primary mb-4" />
            <p className="text-xl text-muted-foreground mt-2">Loading learning plan...</p>
            <p className="text-sm text-muted-foreground mt-1">If this takes too long, try creating a new plan.</p>
            <Button onClick={() => router.replace('/')} variant="outline" className="mt-6 rounded-lg">
                <Home className="mr-2 h-5 w-5" /> Go to Homepage
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/40">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-10 md:py-16 max-w-5xl">
        <Card className="shadow-2xl rounded-xl border-t-4 border-primary overflow-hidden">
          <CardHeader className="p-6 md:p-8 bg-muted/50 border-b border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-grow">
                <p className="text-sm font-medium text-primary mb-1">Your Personalized Learning Path</p>
                <CardTitle className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  {formInput.learningGoal}
                </CardTitle>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto flex-col sm:flex-row">
                {!authLoading && user && !isPlanSaved && (
                    <Button onClick={handleSavePlan} disabled={isSavingPlan} size="lg" className="w-full sm:w-auto rounded-lg shadow-md hover:shadow-primary/30">
                      {isSavingPlan ? (
                        <>
                          <Spinner className="mr-2 h-5 w-5" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-5 w-5" /> Save This Plan
                        </>
                      )}
                    </Button>
                  )}
                  {!authLoading && user && isPlanSaved && (
                     <Button disabled size="lg" className="w-full sm:w-auto rounded-lg bg-green-600 hover:bg-green-700">
                        <CheckCircle className="mr-2 h-5 w-5" /> Plan Saved!
                    </Button>
                  )}
                   {!authLoading && !user && (
                    <Button onClick={() => setShowSaveSignInDialog(true)} size="lg" className="w-full sm:w-auto rounded-lg shadow-md">
                        <LogIn className="mr-2 h-5 w-5" /> Sign In to Save
                    </Button>
                  )}
                <Button
                  onClick={handleCreateNewPlan}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto rounded-lg shadow-md"
                >
                  <FilePlus className="mr-2 h-5 w-5" /> Create New Plan
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            {pageError && (
              <Alert variant="destructive" className="mb-6 shadow-md rounded-lg p-4">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-lg">Oops! Something went wrong.</AlertTitle>
                <AlertDescription className="text-base mt-0.5">{pageError}</AlertDescription>
              </Alert>
            )}

            <LearningPathDisplay
              path={pathData}
              learningGoal={formInput.learningGoal}
              moduleContents={moduleContents}
              onGenerateModuleContent={handleGenerateModuleContent}
            />
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={showSaveSignInDialog} onOpenChange={setShowSaveSignInDialog}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl">Sign In to Save</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Please sign in with your Google account to save your learning path.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-2">
              <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveSignInFromDialog} className="rounded-lg">
                <LogIn className="mr-2 h-5 w-5" /> Sign In with Google
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      <Footer />
    </div>
  );
}


function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center group">
          <div className="bg-primary text-primary-foreground p-2.5 rounded-lg shadow-md transition-transform group-hover:scale-105">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-primary ml-3 tracking-tight">PathAInder</h1>
        </Link>
        <Button variant="ghost" asChild className="rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10">
            <Link href="/saved-paths">
              <BookCopy className="mr-2 h-5 w-5" /> My Paths
            </Link>
        </Button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="text-center py-8 border-t border-border/60 bg-background">
       <div className="container mx-auto px-4 md:px-6">
        <p className="text-md text-muted-foreground">
          &copy; {new Date().getFullYear()} PathAInder. All rights reserved. 
           Powered by <span className="font-semibold text-primary">AI</span> with <span className="text-accent">inspiration</span>.
        </p>
      </div>
    </footer>
  );
}

