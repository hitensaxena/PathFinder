
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { 
  getUserLearningPaths, 
  updateLearningPathModuleDetail, 
  deleteLearningPath,
  updateLearningPathGoal,
  type SavedLearningPath, 
  type SavedModuleDetailedContent,
} from "@/services/learningPathService";
import { generateModuleContent } from "@/ai/flows/generate-module-content";
import type { GenerateModuleContentInput, GenerateModuleContentOutput } from "@/ai/flows/content-types";
import { LearningPathDisplay, type LearningModuleWithQuizStatus } from "@/components/learning-path-display";
import { SavedPathCardActions } from "@/components/saved-path-card-actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/spinner";
import { AlertCircle, BookCopy, LogIn, ListChecks, Home, ExternalLink, Sparkles } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

type ModuleContentState = {
  isLoading: boolean;
  sections: GenerateModuleContentOutput['sections'] | null; 
  error: string | null;
};

type AllModuleContentsState = {
  [pathId: string]: {
    [moduleIndex: string]: ModuleContentState; 
  };
};

export default function SavedPathsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [savedPaths, setSavedPaths] = useState<SavedLearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleContents, setModuleContents] = useState<AllModuleContentsState>({});

  const initializeModuleAndQuizContents = useCallback((paths: SavedLearningPath[]) => {
    const initialContents: AllModuleContentsState = {};
    paths.forEach(path => {
      initialContents[path.id] = {};
      if (path.modulesDetails) {
        Object.entries(path.modulesDetails).forEach(([moduleIndexStr, detail]) => {
           const moduleIndexKey = moduleIndexStr; 
            if (detail.sections && Array.isArray(detail.sections)) {
                 initialContents[path.id][moduleIndexKey] = {
                    isLoading: false,
                    sections: detail.sections,
                    error: null,
                };
            } else { 
                 initialContents[path.id][moduleIndexKey] = {
                    isLoading: false,
                    sections: null, 
                    error: null,
                };
            }
        });
      }
    });
    setModuleContents(initialContents);
  }, []);


  const fetchPaths = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const paths = await getUserLearningPaths(user.uid);
      setSavedPaths(paths);
      initializeModuleAndQuizContents(paths);
    } catch (e) {
      console.error("Error fetching saved learning paths:", e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while fetching your saved paths.";
      setError(errorMessage);
      toast({ title: "Error Fetching Paths", description: errorMessage, variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, initializeModuleAndQuizContents]);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setIsLoading(false);
      setSavedPaths([]);
      setModuleContents({});
      return;
    }
    fetchPaths();
  }, [user, authLoading, fetchPaths]);

  const handleGenerateModuleContentForSavedPath = async (
    pathId: string,
    learningGoal: string | undefined, 
    moduleIndex: number,
    moduleTitle: string,
    moduleDescription: string
  ) => {
    if (!learningGoal || typeof learningGoal !== 'string' || learningGoal === "Untitled Learning Path") {
      const errorMessage = "Learning goal context is missing or invalid for this saved path. Detailed content cannot be generated.";
      const moduleKey = String(moduleIndex);
      setModuleContents(prev => ({
        ...prev,
        [pathId]: {
          ...(prev[pathId] || {}),
          [moduleKey]: { isLoading: false, sections: null, error: errorMessage }
        }
      }));
      toast({
        title: `Cannot Generate Content for "${moduleTitle}"`,
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }
    const moduleKey = String(moduleIndex);
    setModuleContents(prev => ({
      ...prev,
      [pathId]: {
        ...(prev[pathId] || {}),
        [moduleKey]: { isLoading: true, sections: null, error: null }
      }
    }));

    try {
      const input: GenerateModuleContentInput = {
        moduleTitle,
        moduleDescription,
        learningGoal, 
      };
      const result = await generateModuleContent(input); 
      
      const newDetailUpdate: Pick<SavedModuleDetailedContent, 'sections'> = { sections: result.sections };

      await updateLearningPathModuleDetail(pathId, moduleIndex, newDetailUpdate);

      setModuleContents(prev => ({
        ...prev,
        [pathId]: {
          ...(prev[pathId] || {}),
          [moduleKey]: { isLoading: false, sections: result.sections, error: null }
        }
      }));
      toast({
        title: `Content for "${moduleTitle}"`,
        description: "Detailed content generated and saved successfully.",
      });
    } catch (e) {
      console.error(`Error generating content for module ${moduleIndex} in path ${pathId}:`, e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setModuleContents(prev => ({
        ...prev,
        [pathId]: {
          ...(prev[pathId] || {}),
          [moduleKey]: { isLoading: false, sections: null, error: errorMessage }
        }
      }));
      toast({
        title: `Error for "${moduleTitle}"`,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeletePath = async (pathId: string) => {
    try {
      await deleteLearningPath(pathId);
      setSavedPaths(prevPaths => prevPaths.filter(p => p.id !== pathId));
      setModuleContents(prevContents => {
        const newContents = {...prevContents};
        delete newContents[pathId];
        return newContents;
      });
      toast({ title: "Path Deleted", description: "The learning path has been successfully deleted."});
    } catch (error) {
      console.error("Error in handleDeletePath callback from page:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete path.";
      toast({ title: "Error Deleting Path", description: errorMessage, variant: "destructive"});
    }
  };

  const handleRenamePath = async (pathId: string, newGoal: string) => {
    try {
      await updateLearningPathGoal(pathId, newGoal);
      setSavedPaths(prevPaths => prevPaths.map(p => p.id === pathId ? {...p, learningGoal: newGoal} : p));
      toast({ title: "Path Renamed", description: "The learning path has been successfully renamed."});
    } catch (error) {
      console.error("Error in handleRenamePath callback from page:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to rename path.";
      toast({ title: "Error Renaming Path", description: errorMessage, variant: "destructive"});
    }
  };
  
  const getAugmentedPathForDisplay = (path: SavedLearningPath): { modules: LearningModuleWithQuizStatus[] } & Omit<SavedLearningPath, 'modules'> => {
    const augmentedModules = path.modules.map((module, index) => ({
      ...module,
      quizStatus: path.modulesDetails?.[String(index)]?.quiz,
    }));
    return { ...path, modules: augmentedModules };
  };


  if (authLoading || (isLoading && user && savedPaths.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl flex flex-col justify-center items-center">
          <Card className="p-8 shadow-xl rounded-xl">
            <Spinner className="h-16 w-16 text-primary mb-4" />
            <p className="text-xl text-muted-foreground mt-2">Loading your learning journeys...</p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl flex flex-col justify-center items-center text-center">
          <Card className="w-full max-w-md shadow-xl rounded-xl p-8 border-t-4 border-primary">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-3xl flex items-center justify-center">
                <LogIn className="mr-3 h-8 w-8 text-primary" /> Please Sign In
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg text-muted-foreground mb-8">
                You need to be signed in to view your saved learning paths.
              </p>
              <Button asChild size="lg" className="rounded-lg">
                <Link href="/">
                  <Home className="mr-2 h-5 w-5" /> Go to Homepage to Sign In
                </Link>
              </Button>
            </CardContent>
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
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-3 flex items-center justify-center">
            <BookCopy className="mr-4 h-10 w-10 text-primary" /> Your Learning Library
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Revisit your personalized journeys, generate detailed content, manage paths, and test your knowledge.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 shadow-lg rounded-xl p-6">
            <AlertCircle className="h-6 w-6" />
            <AlertTitle className="text-xl">Error Loading Paths</AlertTitle>
            <AlertDescription className="text-base mt-1">{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && user && savedPaths.length === 0 && (
          <Card className="shadow-xl bg-card rounded-xl p-8 border-t-4 border-accent text-center">
            <CardHeader className="p-0 mb-4">
              <ListChecks className="mx-auto h-16 w-16 text-accent/80 mb-4" />
              <CardTitle className="text-3xl font-semibold">
                No Saved Paths Yet
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-lg text-muted-foreground mb-8">
                You haven't saved any learning paths. Let's create one!
              </p>
              <Button asChild size="lg" className="rounded-lg">
                <Link href="/">
                  <Sparkles className="mr-2 h-5 w-5" /> Create a New Path
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!error && user && savedPaths.length > 0 && (
          <div className="space-y-10">
            {savedPaths.map((path) => {
              const displayPath = getAugmentedPathForDisplay(path);
              return (
              <Card key={path.id} className="shadow-xl overflow-hidden border-t-4 border-primary bg-card rounded-2xl transition-all hover:shadow-2xl">
                <CardHeader className="p-6 pb-4 bg-muted/30 border-b border-border">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-grow">
                      <CardTitle className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-1">
                        {path.learningGoal || "Learning Path"} 
                      </CardTitle>
                      {path.createdAt && (
                        <CardDescription className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(path.createdAt.toDate(), { addSuffix: true })}
                        </CardDescription>
                      )}
                    </div>
                    <SavedPathCardActions 
                      pathId={path.id}
                      currentLearningGoal={path.learningGoal || ""}
                      onDelete={handleDeletePath}
                      onRename={handleRenamePath}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <LearningPathDisplay
                    path={displayPath}
                    learningGoal={path.learningGoal || "Untitled Learning Path"} 
                    moduleContents={moduleContents[path.id] || {}}
                    onGenerateModuleContent={(moduleIndex, moduleTitle, moduleDescription) => 
                      handleGenerateModuleContentForSavedPath(path.id, path.learningGoal, moduleIndex, moduleTitle, moduleDescription)
                    }
                  />
                </CardContent>
              </Card>
            )})}
          </div>
        )}
      </main>
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
            <Link href="/">
              <Home className="mr-2 h-5 w-5" /> Home
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
