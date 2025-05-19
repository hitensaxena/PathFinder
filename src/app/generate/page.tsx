"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { headers } from 'next/headers';
import { useLearningPath } from "@/context/learning-path-context";
import { generateLearningPath, type GenerateLearningPathInput, type GenerateLearningPathOutput } from "@/ai/flows/generate-learning-path";
import { useAuth } from "@/context/auth-context";
import { saveLearningPath, type SavedModuleDetailedContent } from "@/services/learningPathService";
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
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/spinner";
import { AlertCircle, ArrowLeft, Brain, Clock, Target, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GeneratePathPage() {
  const router = useRouter();
  // headers(); // Force dynamic rendering
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { setGeneratedPath } = useLearningPath();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [learningGoal, setLearningGoal] = useState("");
  const [currentKnowledgeLevel, setCurrentKnowledgeLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [preferredLearningStyle, setPreferredLearningStyle] = useState<"Videos" | "Articles" | "Interactive Exercises">("Videos");
  const [weeklyTimeCommitment, setWeeklyTimeCommitment] = useState<string>("5");

  useEffect(() => {
    const goal = searchParams?.get("goal") || "";
    setLearningGoal(goal);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate your learning path.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: GenerateLearningPathInput = {
      learningGoal: formData.get('learningGoal') as string,
      currentKnowledgeLevel,
      preferredLearningStyle,
      weeklyTimeCommitment: Number(weeklyTimeCommitment),
    };
    const additionalContext = formData.get('additionalContext') as string;
    if (additionalContext) {
      (data as any).additionalContext = additionalContext;
    }

    let generatedPathResult: GenerateLearningPathOutput | null = null;
    try {
      generatedPathResult = await generateLearningPath(data);
      setGeneratedPath(generatedPathResult, data);

      // Auto-save the generated path
      try {
         const savedPathId = await saveLearningPath(user.uid, generatedPathResult, data.learningGoal);
         toast({
            title: "Learning Path Saved!",
            description: "Your path has been automatically saved to your library.",
         });
         // Optionally, redirect to the saved path's detail page instead of view-plan
         // router.push(`/library/${savedPathId}`);
      } catch (saveError) {
         console.error("Error auto-saving learning path:", saveError);
         toast({
            title: "Auto-Save Failed",
            description: "Your path was generated, but could not be automatically saved.",
            variant: "destructive",
         });
      }

      // Redirect to view-plan (or library detail if uncommented above)
      router.push('/view-plan');

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

  return (
    <Suspense fallback={null}>
       {typeof window === 'undefined' ? null : (
         <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
           <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">

             <Button
               variant="ghost"
               className="mb-8 hover-lift"
               onClick={() => router.back()}
             >
               <ArrowLeft className="mr-2 h-4 w-4" /> Back
             </Button>

             <div className="text-center mb-12 animate-fade-in">
               <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                 Customize Your Learning Path
               </h1>
               <p className="text-xl text-muted-foreground">
                 Help us create the perfect learning journey for you
               </p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-8">
               <div className="grid md:grid-cols-2 gap-8">
                 {/* Learning Goal Card */}
                 <Card className="hover-lift hover-glow animate-slide-up">
                   <CardContent className="p-6">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="p-2 bg-primary/10 rounded-lg">
                         <Target className="h-5 w-5 text-primary" />
                       </div>
                       <Label htmlFor="learningGoal" className="text-lg font-medium">
                         Learning Goal
                       </Label>
                     </div>
                     <Input
                       id="learningGoal"
                       name="learningGoal"
                       placeholder="What do you want to learn?"
                       className="text-lg"
                       required
                       value={learningGoal}
                       onChange={(e) => setLearningGoal(e.target.value)}
                     />
                   </CardContent>
                 </Card>

                 {/* Current Knowledge Level Card */}
                 <Card className="hover-lift hover-glow animate-slide-up" style={{ animationDelay: "100ms" }}>
                   <CardContent className="p-6">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="p-2 bg-primary/10 rounded-lg">
                         <Brain className="h-5 w-5 text-primary" />
                       </div>
                       <Label htmlFor="currentKnowledgeLevel" className="text-lg font-medium">
                         Current Knowledge Level
                       </Label>
                     </div>
                     <Select name="currentKnowledgeLevel" required value={currentKnowledgeLevel} onValueChange={v => setCurrentKnowledgeLevel(v as "Beginner" | "Intermediate" | "Advanced")}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select your current level" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Beginner">Beginner</SelectItem>
                         <SelectItem value="Intermediate">Intermediate</SelectItem>
                         <SelectItem value="Advanced">Advanced</SelectItem>
                       </SelectContent>
                     </Select>
                   </CardContent>
                 </Card>

                 {/* Weekly Time Commitment Card */}
                 <Card className="hover-lift hover-glow animate-slide-up" style={{ animationDelay: "200ms" }}>
                   <CardContent className="p-6">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="p-2 bg-primary/10 rounded-lg">
                         <Clock className="h-5 w-5 text-primary" />
                       </div>
                       <Label htmlFor="weeklyTimeCommitment" className="text-lg font-medium">
                         Weekly Time Commitment
                       </Label>
                     </div>
                     <Select name="weeklyTimeCommitment" required value={weeklyTimeCommitment} onValueChange={setWeeklyTimeCommitment}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select your time commitment" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="1">1 hour/week</SelectItem>
                         <SelectItem value="3">3 hours/week</SelectItem>
                         <SelectItem value="5">5 hours/week</SelectItem>
                         <SelectItem value="10">10 hours/week</SelectItem>
                       </SelectContent>
                     </Select>
                   </CardContent>
                 </Card>

                 {/* Preferred Learning Style Card */}
                 <Card className="hover-lift hover-glow animate-slide-up" style={{ animationDelay: "300ms" }}>
                   <CardContent className="p-6">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="p-2 bg-primary/10 rounded-lg">
                         <Zap className="h-5 w-5 text-primary" />
                       </div>
                       <Label htmlFor="preferredLearningStyle" className="text-lg font-medium">
                         Preferred Learning Style
                       </Label>
                     </div>
                     <Select name="preferredLearningStyle" required value={preferredLearningStyle} onValueChange={v => setPreferredLearningStyle(v as "Videos" | "Articles" | "Interactive Exercises")}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select your learning style" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Videos">Videos</SelectItem>
                         <SelectItem value="Articles">Articles</SelectItem>
                         <SelectItem value="Interactive Exercises">Interactive Exercises</SelectItem>
                       </SelectContent>
                     </Select>
                   </CardContent>
                 </Card>
               </div>

               {/* Additional Context Card */}
               <Card className="hover-lift hover-glow animate-slide-up" style={{ animationDelay: "400ms" }}>
                 <CardContent className="p-6">
                   <Label htmlFor="additionalContext" className="text-lg font-medium mb-4 block">
                     Additional Context (Optional)
                   </Label>
                   <Textarea
                     id="additionalContext"
                     name="additionalContext"
                     placeholder="Tell us more about your goals, preferences, or any specific requirements..."
                     className="min-h-[120px] text-lg"
                   />
                 </CardContent>
               </Card>

               {error && (
                 <Alert variant="destructive" className="mb-6">
                   <AlertCircle className="h-5 w-5" />
                   <AlertTitle>Error</AlertTitle>
                   <AlertDescription>{error}</AlertDescription>
                 </Alert>
               )}

               <div className="flex justify-center">
                 <Button
                   type="submit"
                   size="lg"
                   className="px-12 py-6 text-lg hover-lift hover-glow animate-slide-up"
                   style={{ animationDelay: "500ms" }}
                   disabled={isLoading}
                 >
                   {isLoading ? (
                     <>
                       <Spinner className="mr-2 h-5 w-5" />
                       Generating Path...
                     </>
                   ) : (
                     "Generate Learning Path"
                   )}
                 </Button>
               </div>
             </form>
           </div>
         </div>
       )}
    </Suspense>
  );
} 