"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import Link from "next/link";
import { useLearningPath } from "@/context/learning-path-context";
import { generateLearningPath, type GenerateLearningPathInput, type GenerateLearningPathOutput } from "@/ai/flows/generate-learning-path";
import { generateModuleContent, type GenerateModuleContentInput, type GenerateModuleContentOutput } from "@/ai/flows/generate-module-content";
import { generateModuleVideo, type GenerateModuleVideoInput, type GenerateModuleVideoOutput } from "@/ai/flows/generate-module-video";
import { saveLearningPath, type SavedModuleDetailedContent, type SavedLearningPath } from "@/services/learningPathService";
import { useAuth } from "@/context/auth-context";
import { LearningPathDisplay } from "@/components/learning-path-display";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Save, FilePlus, LogIn, Home, Sparkles, CheckCircle, BookCopy, Brain, Clock, Target, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import Footer from '@/components/footer';
import Header from '@/components/header';

type SectionContent = {
  sectionTitle: string;
  sectionContent: string;
  recommendedYoutubeVideoQuery: string;
  videoId?: string;
  videoTitle?: string;
  videoUrl?: string;
};

type ModuleContentState = {
  isLoading: boolean;
  sections: SectionContent[] | null;
  error: string | null;
};

type AllModuleContentsState = { [moduleIndex: string]: ModuleContentState };

export default function ViewPlanPage() {
  const { user, loading: authLoading } = useAuth();
  const { pathData, formInput, clearGeneratedPath } = useLearningPath();
  const router = useRouter();
  const { toast } = useToast();

  const [moduleContents, setModuleContents] = useState<AllModuleContentsState>({});
  const [isCreatingPath, setIsCreatingPath] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [showSaveSignInDialog, setShowSaveSignInDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && (!pathData || !formInput) && !isCreatingPath) {
      const timer = setTimeout(() => {
        if (!pathData || !formInput) {
            toast({ title: "No Plan Active", description: "Please generate a learning plan first.", variant: "destructive" });
            router.replace('/');
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathData, formInput, router, toast, authLoading, isCreatingPath]);

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
      const contentInput: GenerateModuleContentInput = {
        moduleTitle,
        moduleDescription,
        learningGoal: formInput.learningGoal,
      };
      
      const contentResult = await generateModuleContent(contentInput);
      let sectionsWithVideoData: SectionContent[] = [];

      if (contentResult.sections && contentResult.sections.length > 0) {
        const videoPromises: Promise<SectionContent>[] = contentResult.sections.map(section => {
          const videoInput: GenerateModuleVideoInput = {
            moduleTitle: section.sectionTitle,
            moduleDescription: section.sectionContent,
            learningGoal: formInput.learningGoal,
            searchQuery: section.recommendedYoutubeVideoQuery,
          };
          return generateModuleVideo(videoInput)
            .then(videoResult => ({
              sectionTitle: section.sectionTitle,
              sectionContent: section.sectionContent,
              recommendedYoutubeVideoQuery: section.recommendedYoutubeVideoQuery,
              videoId: videoResult.videoId,
              videoTitle: videoResult.videoTitle,
              videoUrl: videoResult.videoUrl,
            }))
            .catch(videoError => {
              console.error(`Error generating video for section "${section.sectionTitle}" using query "${section.recommendedYoutubeVideoQuery}":`, videoError);
              // The error is logged. Return the section without video info.
              return {
                sectionTitle: section.sectionTitle,
                sectionContent: section.sectionContent,
                recommendedYoutubeVideoQuery: section.recommendedYoutubeVideoQuery,
                videoId: undefined,
                videoTitle: undefined,
                videoUrl: undefined,
              };
            });
        });

        // Since each promise in videoPromises is guaranteed to resolve to a SectionContent object,
        // we can use Promise.all.
        sectionsWithVideoData = await Promise.all(videoPromises);
      } else {
        sectionsWithVideoData = [];
      }

      setModuleContents(prev => ({
        ...prev,
        [moduleKey]: { isLoading: false, sections: sectionsWithVideoData, error: null }
      }));
      
      toast({
        title: `Content for "${moduleTitle}"`,
        description: "Detailed content and video recommendations generated successfully.",
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

  const handleCreatePath = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create your learning path.",
        variant: "destructive",
      });
      // Consider setShowSaveSignInDialog(true); for better UX if needed
      return;
    }

    if (!pathData || !formInput) {
      toast({
        title: "Cannot Create Path",
        description: "Learning path data or original input is missing.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingPath(true);
    setPageError(null);
    const modulesDetailsForDb: { [moduleIndex: string]: SavedModuleDetailedContent } = {};

    // Initialize all module states to loading before the loop
    const initialModuleLoadingStates = pathData.modules.reduce((acc, _, i) => {
      acc[String(i)] = { isLoading: true, sections: null, error: null };
      return acc;
    }, {} as AllModuleContentsState);
    setModuleContents(initialModuleLoadingStates);

    const allGeneratedModuleData: { [moduleIndex: string]: { sections: SectionContent[] | null, error: string | null } } = {};

    try {
      for (let i = 0; i < pathData.modules.length; i++) {
        const module = pathData.modules[i];
        const moduleKey = String(i);
        try {
          const contentInput: GenerateModuleContentInput = {
            moduleTitle: module.title,
            moduleDescription: module.description,
            learningGoal: formInput.learningGoal,
          };
          const contentResult = await generateModuleContent(contentInput); // contentResult.sections is ModuleSectionSchema[]
          let sectionsWithVideos: SectionContent[] = [];

          if (contentResult.sections && contentResult.sections.length > 0) {
            const videoPromises: Promise<SectionContent>[] = contentResult.sections.map(section => {
              const videoInput: GenerateModuleVideoInput = {
                moduleTitle: section.sectionTitle, 
                moduleDescription: section.sectionContent, 
                learningGoal: formInput.learningGoal,
                searchQuery: section.recommendedYoutubeVideoQuery,
              };
              return generateModuleVideo(videoInput)
                .then(videoResult => ({
                  sectionTitle: section.sectionTitle,
                  sectionContent: section.sectionContent,
                  recommendedYoutubeVideoQuery: section.recommendedYoutubeVideoQuery,
                  videoId: videoResult.videoId,
                  videoTitle: videoResult.videoTitle,
                  videoUrl: videoResult.videoUrl,
                }))
                .catch(videoError => {
                  console.error(`Error generating video for section "${section.sectionTitle}" in module "${module.title}" using query "${section.recommendedYoutubeVideoQuery}":`, videoError);
                  // Return a SectionContent compliant object, error is logged.
                  return {
                    sectionTitle: section.sectionTitle,
                    sectionContent: section.sectionContent,
                    recommendedYoutubeVideoQuery: section.recommendedYoutubeVideoQuery,
                    videoId: undefined,
                    videoTitle: undefined,
                    videoUrl: undefined,
                  };
                });
            });

            // Since each promise in videoPromises is guaranteed to resolve to a SectionContent object (due to the .catch above),
            // we can use Promise.all.
            sectionsWithVideos = await Promise.all(videoPromises);
          } else {
            sectionsWithVideos = []; // No sections, so no videos
          }

          // For DB and local state: use sectionsWithVideos (SectionContent[])
          // SectionContent is compatible with ModuleSectionDetail for saving
          modulesDetailsForDb[moduleKey] = { sections: sectionsWithVideos }; 
          allGeneratedModuleData[moduleKey] = { sections: sectionsWithVideos, error: null }; // Error for the whole module content generation is handled separately

        } catch (moduleError) {
          console.error(`Error generating content for module ${i} ("${module.title}"):`, moduleError);
          const errorMessage = moduleError instanceof Error ? moduleError.message : "Failed to generate content for this module.";
          allGeneratedModuleData[moduleKey] = { sections: null, error: errorMessage };
          // modulesDetailsForDb will not have an entry for this failed module's content
        }
      }

      // Batch update all module states after the loop
      setModuleContents(prev => { // prev here are the initialModuleLoadingStates
        const newStates = { ...prev }; 
        Object.keys(allGeneratedModuleData).forEach(moduleIndex => {
          if (newStates[moduleIndex]) { // Ensure the key exists from initial loading state
            newStates[moduleIndex] = {
              isLoading: false, 
              sections: allGeneratedModuleData[moduleIndex].sections,
              error: allGeneratedModuleData[moduleIndex].error,
            };
          }
        });
        return newStates;
      });
      
      const hasAnyModuleGenerationError = Object.values(allGeneratedModuleData).some(data => data.error !== null);
      if (hasAnyModuleGenerationError) {
          toast({
              title: "Content Generation Complete with Issues",
              description: "Some module details could not be generated. They can be retried from the saved path view if this path is saved.",
              variant: "destructive",
              duration: 7000,
          });
      }

      const savedPathId = await saveLearningPath(user.uid, pathData, formInput.learningGoal, modulesDetailsForDb);

      toast({
        title: "Learning Path Created!",
        description: "Your personalized path has been generated and saved.",
      });

      router.push(`/library/${savedPathId}`);

    } catch (e) { 
      console.error("Error creating learning path:", e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while creating your path.";
      setPageError(errorMessage);
      toast({
        title: "Error Creating Path",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreatingPath(false);
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
      <main className="flex-grow container mx-auto px-4 py-10 md:py-16 max-w-5xl">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-3 flex items-center justify-center">
            <CheckCircle className="mr-4 h-10 w-10 text-green-500" /> Your Learning Plan is Ready!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Review the AI-generated outline. Ready to build it out?
          </p>
        </div>

        <Card className="shadow-xl overflow-hidden border-t-4 border-primary bg-card rounded-2xl">
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
            />

            <div className="flex justify-center mt-12">
              <Button
                size="lg"
                className="px-12 py-6 text-lg hover-lift hover-glow animate-slide-up"
                onClick={handleCreatePath}
                disabled={isCreatingPath || authLoading || !user}
              >
                {isCreatingPath ? (
                  <>
                    <Spinner className="mr-2 h-5 w-5" />
                    Creating Path...
                  </>
                ) : (
                   <><Sparkles className="mr-2 h-5 w-5" /> Create This Path</>
                )}
              </Button>
            </div>

          </CardContent>
        </Card>
      </main>

      <AlertDialog open={showSaveSignInDialog} onOpenChange={setShowSaveSignInDialog}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl">Sign In to Create & Save</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                You need to be signed in to create and save your personalized learning path.
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
    </div>
  );
}

