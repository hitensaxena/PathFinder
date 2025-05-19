
"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation'; // Added for redirection
import { useLearningPath } from "@/context/learning-path-context"; // Added context hook
import { generateLearningPath, type GenerateLearningPathInput } from "@/ai/flows/generate-learning-path";
import { useAuth } from "@/context/auth-context";
import { LearningInputForm } from "@/components/learning-input-form";
import { AuthButtons } from "@/components/auth-buttons";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { AlertCircle, LogIn, Lightbulb, Sparkles, Youtube, ChevronRight } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function PathAInderPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter(); // For navigation
  const { setGeneratedPath } = useLearningPath(); // Context function

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignInDialog, setShowSignInDialog] = useState(false);

  const handleSignInFromDialog = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Signed In",
        description: "Successfully signed in with Google. You can now generate your plan.",
      });
      setShowSignInDialog(false);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Sign In Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePlan = async (data: GenerateLearningPathInput) => {
    if (!user) {
      setShowSignInDialog(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await generateLearningPath(data);
      setGeneratedPath(result, data); // Store in context
      toast({
        title: "Learning Path Generated!",
        description: "Redirecting to view your personalized learning path...",
      });
      router.push('/view-plan'); // Navigate to the new page
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
      setIsLoading(false); // Loader on this page stops once navigation happens or on error
    }
  };
  
  const scrollToForm = () => {
    document.getElementById('learning-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between max-w-6xl">
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

      <main className="flex-grow">
        {/* SaaS Landing Page Content */}
        {!isLoading && ( // Only show landing or form if not actively generating path on this page
          <>
            {/* Hero Section */}
            <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-background">
              <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                  Unlock Your Potential with AI-Powered Learning Paths
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Stop wandering aimlessly. PathAInder crafts personalized, step-by-step roadmaps to help you achieve your learning goals faster and smarter.
                </p>
                <Button size="lg" onClick={scrollToForm} className="shadow-lg">
                  Get Your Free Learning Plan <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <div className="mt-12">
                  <Image 
                    src="https://placehold.co/800x450.png" 
                    alt="Dashboard showing a personalized learning path"
                    data-ai-hint="learning dashboard"
                    width={800} 
                    height={450} 
                    className="rounded-lg shadow-2xl object-cover mx-auto"
                  />
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-16 md:py-24">
              <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground text-center mb-4">Why Choose PathAInder?</h2>
                <p className="text-lg text-muted-foreground text-center mb-12">Discover the features that make learning with AI effective and engaging.</p>
                <div className="grid md:grid-cols-3 gap-8">
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <div className="p-3 bg-primary/10 rounded-full w-fit mb-3">
                        <Lightbulb className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>Personalized Roadmaps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Tell us your goal, current knowledge, and learning style. Our AI crafts a unique path tailored to you.</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                       <div className="p-3 bg-primary/10 rounded-full w-fit mb-3">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>AI-Generated Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Dive deeper with detailed explanations and concepts for each module, generated on demand.</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <div className="p-3 bg-primary/10 rounded-full w-fit mb-3">
                        <Youtube className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>Curated Video Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Get targeted YouTube search queries for each section to find the best video resources quickly.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="py-16 md:py-24 bg-muted">
              <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground text-center mb-12">Get Started in 3 Simple Steps</h2>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div className="p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold shadow-md">1</div>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Define Your Goal</h3>
                    <p className="text-muted-foreground">Tell us what you want to learn and your current understanding.</p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-center mb-4">
                       <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold shadow-md">2</div>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Generate Your Path</h3>
                    <p className="text-muted-foreground">Our AI instantly creates a structured learning plan with modules.</p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-center mb-4">
                       <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold shadow-md">3</div>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Start Learning</h3>
                    <p className="text-muted-foreground">Explore modules, generate content, and track your progress.</p>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Testimonial Section (Placeholder) */}
            <section className="py-16 md:py-24">
              <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-12">Loved by Learners Worldwide</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="bg-card p-6 shadow-lg">
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground mb-4">"PathAInder made learning web development so much less daunting. The structured path was a lifesaver!"</p>
                      <div className="flex items-center">
                        <Image src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="person avatar" width={40} height={40} className="rounded-full mr-3" />
                        <div>
                          <p className="font-semibold text-foreground">Alex P.</p>
                          <p className="text-sm text-muted-foreground">Aspiring Developer</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card p-6 shadow-lg">
                     <CardContent className="pt-6">
                      <p className="text-muted-foreground mb-4">"The AI-generated content and video suggestions helped me grasp complex topics much faster. Highly recommended!"</p>
                       <div className="flex items-center">
                        <Image src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="person avatar" width={40} height={40} className="rounded-full mr-3" />
                        <div>
                          <p className="font-semibold text-foreground">Sarah K.</p>
                          <p className="text-sm text-muted-foreground">Data Scientist</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* CTA/Form Section */}
            <section id="learning-form-section" className="py-16 md:py-24 bg-primary/5">
              <div className="container mx-auto px-4 md:px-6 max-w-2xl">
                 <h2 className="text-3xl md:text-4xl font-semibold text-foreground text-center mb-4">Ready to Start Your Learning Journey?</h2>
                 <p className="text-lg text-muted-foreground text-center mb-8">Fill out the form below to get your personalized AI-generated learning path.</p>
                <LearningInputForm onSubmit={handleGeneratePlan} isLoading={isLoading} />
              </div>
            </section>
          </>
        )}

        {/* Loading indicator for path generation */}
        {isLoading && (
          <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl">
            <div className="flex flex-col justify-center items-center mt-12 space-y-4">
              <Spinner className="h-12 w-12 text-primary" />
              <p className="text-lg text-muted-foreground">
                Crafting your personalized learning path...
              </p>
            </div>
          </div>
        )}

        {/* Error display for path generation */}
        {error && !isLoading && (
           <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl">
            <Alert variant="destructive" className="mt-8 shadow-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Oops! Something went wrong.</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <AlertDialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign In Required</AlertDialogTitle>
              <AlertDialogDescription>
                Please sign in with your Google account to generate and save your personalized learning path.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSignInFromDialog}>
                <LogIn className="mr-2 h-4 w-4" /> Sign In with Google
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </main>
      <footer className="text-center py-6 border-t bg-muted">
         <div className="container mx-auto px-4 md:px-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PathAInder. All rights reserved. Powered by AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
