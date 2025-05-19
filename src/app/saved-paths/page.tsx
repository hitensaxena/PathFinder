
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
  type SavedModuleQuizStatus
} from "@/services/learningPathService";
import { generateModuleContent, type GenerateModuleContentInput, type GenerateModuleContentOutput } from "@/ai/flows/generate-module-content";
import { LearningPathDisplay, type LearningModuleWithQuizStatus } from "@/components/learning-path-display"; // Updated import
import { SavedPathCardActions } from "@/components/saved-path-card-actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/spinner";
import { AlertCircle, BookCopy, LogIn, ListChecks } from "lucide-react";
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
      
      // Ensure detail is correctly typed for updateLearningPathModuleDetail
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
      // Optimistically update UI or refetch
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl flex flex-col justify-center items-center">
          <Spinner className="h-12 w-12 text-primary" />
          <p className="text-lg text-muted-foreground mt-4">Loading your saved paths...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl flex flex-col justify-center items-center text-center">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <LogIn className="mr-2 h-6 w-6 text-primary" /> Please Sign In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                You need to be signed in to view your saved learning paths.
              </p>
              <Button asChild>
                <Link href="/">Go to Homepage to Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl">
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2 flex items-center justify-center">
            <BookCopy className="mr-3 h-8 w-8 text-primary" /> Your Saved Learning Paths
          </h1>
          <p className="text-lg text-muted-foreground">
            Revisit your personalized learning journeys, generate detailed content, manage your paths, and test your knowledge.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 shadow-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Paths</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && user && savedPaths.length === 0 && (
          <Card className="shadow-lg bg-background">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ListChecks className="mr-2 h-6 w-6 text-primary" />
                No Saved Paths Yet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                You haven't saved any learning paths. Create one on the homepage!
              </p>
              <Button asChild>
                <Link href="/">Create a New Path</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!error && user && savedPaths.length > 0 && (
          <div className="space-y-12">
            {savedPaths.map((path) => {
              const displayPath = getAugmentedPathForDisplay(path);
              return (
              <Card key={path.id} className="shadow-xl overflow-hidden border-t-4 border-primary bg-background">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="mb-3 sm:mb-0">
                      <CardTitle className="text-2xl mb-0.5">
                        {path.learningGoal || "Learning Path"} 
                      </CardTitle>
                      {path.createdAt && (
                        <CardDescription className="text-sm">
                          Saved {formatDistanceToNow(path.createdAt.toDate(), { addSuffix: true })}
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
                <CardContent>
                  <LearningPathDisplay
                    path={displayPath} // Pass augmented path
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between max-w-4xl">
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
        {/* AuthButtons can be added here if needed on this page specifically */}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="text-center py-6 border-t bg-background">
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} PathAInder. All rights reserved.
      </p>
    </footer>
  );
}
