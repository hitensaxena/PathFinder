
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
  type SavedModuleDetail 
} from "@/services/learningPathService";
import { generateModuleContent, type GenerateModuleContentInput, type GenerateModuleContentOutput } from "@/ai/flows/generate-module-content";
import { LearningPathDisplay } from "@/components/learning-path-display";
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
  content: string | null;
  youtubeSearchQueries: string[] | null;
  error: string | null;
};

// Path ID to ModuleIndex to ModuleContentState
type AllModuleContentsState = {
  [pathId: string]: {
    [moduleIndex: number]: ModuleContentState;
  };
};

export default function SavedPathsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [savedPaths, setSavedPaths] = useState<SavedLearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleContents, setModuleContents] = useState<AllModuleContentsState>({});

  const fetchPaths = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const paths = await getUserLearningPaths(user.uid);
      setSavedPaths(paths);
      initializeModuleContents(paths);
    } catch (e) {
      console.error("Error fetching saved learning paths:", e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while fetching your saved paths.";
      setError(errorMessage);
      toast({ title: "Error Fetching Paths", description: errorMessage, variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]); // initializeModuleContents will be defined below or made stable

  const initializeModuleContents = useCallback((paths: SavedLearningPath[]) => {
    const initialContents: AllModuleContentsState = {};
    paths.forEach(path => {
      initialContents[path.id] = {};
      if (path.modulesDetails) {
        Object.entries(path.modulesDetails).forEach(([moduleIndexStr, detail]) => {
          const moduleIndex = parseInt(moduleIndexStr, 10);
          if (!isNaN(moduleIndex)) {
            initialContents[path.id][moduleIndex] = {
              isLoading: false,
              content: detail.content,
              youtubeSearchQueries: detail.youtubeSearchQueries,
              error: null,
            };
          }
        });
      }
    });
    setModuleContents(initialContents);
  }, []);


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
      setModuleContents(prev => ({
        ...prev,
        [pathId]: {
          ...(prev[pathId] || {}),
          [moduleIndex]: { isLoading: false, content: null, youtubeSearchQueries: null, error: errorMessage }
        }
      }));
      toast({
        title: `Cannot Generate Content for "${moduleTitle}"`,
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    setModuleContents(prev => ({
      ...prev,
      [pathId]: {
        ...(prev[pathId] || {}),
        [moduleIndex]: { isLoading: true, content: null, youtubeSearchQueries: null, error: null }
      }
    }));

    try {
      const input: GenerateModuleContentInput = {
        moduleTitle,
        moduleDescription,
        learningGoal,
      };
      const result = await generateModuleContent(input);
      
      const newDetail: SavedModuleDetail = {
        content: result.detailedContent,
        youtubeSearchQueries: result.youtubeSearchQueries || [],
      };

      await updateLearningPathModuleDetail(pathId, moduleIndex, newDetail);

      setModuleContents(prev => ({
        ...prev,
        [pathId]: {
          ...(prev[pathId] || {}),
          [moduleIndex]: { isLoading: false, content: result.detailedContent, youtubeSearchQueries: result.youtubeSearchQueries || null, error: null }
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
          [moduleIndex]: { isLoading: false, content: null, youtubeSearchQueries: null, error: errorMessage }
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
    // Confirmation is handled by SavedPathCardActions
    try {
      await deleteLearningPath(pathId);
      // Optimistically update UI or re-fetch
      setSavedPaths(prevPaths => prevPaths.filter(p => p.id !== pathId));
      // Remove module contents for the deleted path
      setModuleContents(prevContents => {
        const newContents = {...prevContents};
        delete newContents[pathId];
        return newContents;
      });
    } catch (error) {
      // Error toast is handled by SavedPathCardActions, but log here if needed
      console.error("Error in handleDeletePath callback from page:", error);
    }
  };

  const handleRenamePath = async (pathId: string, newGoal: string) => {
    // Confirmation/input is handled by SavedPathCardActions
    try {
      await updateLearningPathGoal(pathId, newGoal);
      // Optimistically update UI or re-fetch
      setSavedPaths(prevPaths => prevPaths.map(p => p.id === pathId ? {...p, learningGoal: newGoal} : p));
    } catch (error) {
      // Error toast is handled by SavedPathCardActions, but log here if needed
      console.error("Error in handleRenamePath callback from page:", error);
    }
  };


  if (authLoading || (isLoading && savedPaths.length === 0)) { // Show loading if auth is loading OR initial data fetch is happening
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

  if (!user) {
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl">
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2 flex items-center justify-center">
            <BookCopy className="mr-3 h-8 w-8 text-primary" /> Your Saved Learning Paths
          </h1>
          <p className="text-lg text-muted-foreground">
            Revisit your personalized learning journeys, generate detailed content, and manage your paths.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 shadow-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Paths</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && savedPaths.length === 0 && (
          <Card className="shadow-lg">
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

        {!error && savedPaths.length > 0 && ( // No need for !isLoading here if we handle empty state correctly
          <div className="space-y-12">
            {savedPaths.map((path) => (
              <Card key={path.id} className="shadow-xl overflow-hidden border-t-4 border-primary">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">
                        {path.learningGoal || "Learning Path"} 
                      </CardTitle>
                      {path.createdAt && (
                        <CardDescription>
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
                    path={path}
                    moduleContents={moduleContents[path.id] || {}}
                    onGenerateModuleContent={(moduleIndex, moduleTitle, moduleDescription) => 
                      handleGenerateModuleContentForSavedPath(path.id, path.learningGoal, moduleIndex, moduleTitle, moduleDescription)
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

// Header and Footer components remain the same
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
        {/* AuthButtons could be imported here if needed, or ensure it's on the main page layout */}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="text-center py-6 border-t">
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} PathAInder. All rights reserved.
      </p>
    </footer>
  );
}
