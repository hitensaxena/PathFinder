
"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useLearningPath } from "@/context/learning-path-context";
import { generateLearningPath, type GenerateLearningPathInput } from "@/ai/flows/generate-learning-path";
import { useAuth } from "@/context/auth-context";
import { LearningInputForm } from "@/components/learning-input-form";
import { AuthButtons } from "@/components/auth-buttons";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { AlertCircle, LogIn, Lightbulb, Sparkles, Youtube, ChevronRight, Target, Activity, BookOpen, CheckSquare } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function PathAInderPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { setGeneratedPath } = useLearningPath();

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
      setGeneratedPath(result, data);
      toast({
        title: "Learning Path Generated!",
        description: "Redirecting to view your personalized learning path...",
      });
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
  
  const scrollToForm = () => {
    document.getElementById('learning-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/50">
       <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="bg-primary text-primary-foreground p-2.5 rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-primary ml-3 tracking-tight">PathAInder</h1>
          </div>
          <AuthButtons />
        </div>
      </header>

      <main className="flex-grow">
        {!isLoading && (
          <>
            {/* Hero Section */}
            <section className="py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-background">
              <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
                <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-6 leading-tight">
                  Chart Your Course to Mastery with <span className="text-primary">AI-Powered</span> Learning
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
                  PathAInder intelligently crafts personalized learning roadmaps, guiding you step-by-step towards your goals. Say goodbye to confusion and hello to clarity.
                </p>
                <Button size="lg" onClick={scrollToForm} className="rounded-full px-10 py-7 text-lg font-semibold shadow-lg hover:shadow-primary/30 transition-all duration-300">
                  Design Your Learning Path <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
                <div className="mt-16 relative">
                   <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 rounded-lg"></div>
                  <Image 
                    src="https://placehold.co/1000x500.png" 
                    alt="Stylized dashboard showing a personalized learning path with progress indicators"
                    data-ai-hint="learning path dashboard"
                    width={1000} 
                    height={500} 
                    className="rounded-xl shadow-2xl object-cover mx-auto"
                    priority
                  />
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-20 md:py-28 bg-background">
              <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground text-center mb-6">Why PathAInder?</h2>
                <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">Unlock a smarter way to learn with features designed for focus and growth.</p>
                <div className="grid md:grid-cols-3 gap-8">
                  <Card className="shadow-xl hover:shadow-primary/20 transition-shadow duration-300 border-t-4 border-primary bg-card rounded-xl overflow-hidden">
                    <CardHeader className="items-center text-center">
                      <div className="p-4 bg-primary/10 rounded-full w-fit mb-4">
                        <Target className="h-10 w-10 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">Personalized Roadmaps</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground">Input your goal, knowledge, and style. Our AI crafts a unique path, just for you.</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-xl hover:shadow-primary/20 transition-shadow duration-300 border-t-4 border-primary bg-card rounded-xl overflow-hidden">
                    <CardHeader className="items-center text-center">
                       <div className="p-4 bg-primary/10 rounded-full w-fit mb-4">
                        <Sparkles className="h-10 w-10 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">AI-Generated Content</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground">Dive deep with detailed explanations for each module, generated by AI on demand.</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-xl hover:shadow-primary/20 transition-shadow duration-300 border-t-4 border-primary bg-card rounded-xl overflow-hidden">
                    <CardHeader className="items-center text-center">
                      <div className="p-4 bg-primary/10 rounded-full w-fit mb-4">
                        <CheckSquare className="h-10 w-10 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">Knowledge Quizzes</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground">Test your understanding with AI-generated quizzes and track your module completion.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 md:py-28 bg-muted/70">
              <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground text-center mb-16">Launch Your Learning in 3 Steps</h2>
                <div className="relative">
                  {/* Connecting line (for larger screens) */}
                  <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-primary/30 transform -translate-y-1/2 -z-10 mx-16"></div>
                  
                  <div className="grid md:grid-cols-3 gap-10 text-center relative">
                    {[
                      { num: 1, title: "Define Your Goal", desc: "Tell us what you want to learn and your current expertise.", icon: <Target className="h-8 w-8 text-primary" /> },
                      { num: 2, title: "Generate Your Path", desc: "Our AI instantly crafts a structured, step-by-step learning plan.", icon: <Activity className="h-8 w-8 text-primary" /> },
                      { num: 3, title: "Start Learning", desc: "Explore modules, generate content, take quizzes, and master new skills.", icon: <BookOpen className="h-8 w-8 text-primary" /> }
                    ].map((step, idx) => (
                      <div key={idx} className="bg-card p-8 rounded-xl shadow-lg flex flex-col items-center relative z-0">
                        <div className="bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold shadow-md mb-6 ring-4 ring-primary/20">
                          {step.num}
                        </div>
                         <div className="mb-4 text-primary">{step.icon}</div>
                        <h3 className="text-2xl font-semibold text-foreground mb-3">{step.title}</h3>
                        <p className="text-muted-foreground">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            
            {/* Testimonial Section (Placeholder) */}
            <section className="py-20 md:py-28 bg-background">
              <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-16">Loved by Learners Like You</h2>
                <div className="grid md:grid-cols-2 gap-10">
                  {[
                    { name: "Alex P.", role: "Aspiring Developer", quote: "PathAInder made learning web development so much less daunting. The structured path was a lifesaver!", hint: "person programmer" },
                    { name: "Sarah K.", role: "Data Scientist", quote: "The AI-generated content and video suggestions helped me grasp complex topics much faster. Highly recommended!", hint: "person data" }
                  ].map((testimonial, idx) => (
                  <Card key={idx} className="bg-card p-8 rounded-xl shadow-lg border-l-4 border-accent">
                    <CardContent className="pt-0 text-left">
                      <p className="text-lg text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                      <div className="flex items-center">
                        <Image src={`https://placehold.co/50x50.png`} alt="User Avatar" data-ai-hint={testimonial.hint} width={50} height={50} className="rounded-full mr-4 border-2 border-primary/50" />
                        <div>
                          <p className="font-semibold text-xl text-foreground">{testimonial.name}</p>
                          <p className="text-md text-accent">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA/Form Section */}
            <section id="learning-form-section" className="py-20 md:py-28 bg-gradient-to-b from-muted/70 to-primary/10">
              <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                 <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Ready to Forge Your Path?</h2>
                    <p className="text-xl text-muted-foreground max-w-xl mx-auto">Fill out the form below to get your personalized AI-generated learning roadmap.</p>
                 </div>
                <LearningInputForm onSubmit={handleGeneratePlan} isLoading={isLoading} />
              </div>
            </section>
          </>
        )}

        {isLoading && (
          <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl h-screen flex flex-col justify-center items-center">
            <div className="bg-card p-10 rounded-xl shadow-2xl flex flex-col items-center">
              <Spinner className="h-16 w-16 text-primary mb-6" />
              <p className="text-xl text-muted-foreground font-medium">
                Crafting your personalized learning path...
              </p>
              <p className="text-sm text-muted-foreground mt-2">This might take a moment, great things are on their way!</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
           <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl">
            <Alert variant="destructive" className="mt-8 shadow-md p-6">
              <AlertCircle className="h-6 w-6" />
              <AlertTitle className="text-xl">Oops! Something Went Wrong</AlertTitle>
              <AlertDescription className="text-base mt-1">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <AlertDialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl">Sign In Required</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Please sign in with your Google account to generate and save your personalized learning path.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-2">
              <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSignInFromDialog} className="rounded-lg">
                <LogIn className="mr-2 h-5 w-5" /> Sign In with Google
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </main>
      <footer className="text-center py-8 border-t border-border/60 bg-background">
         <div className="container mx-auto px-4 md:px-6">
          <p className="text-md text-muted-foreground">
            &copy; {new Date().getFullYear()} PathAInder. All rights reserved.
             Powered by <span className="font-semibold text-primary">AI</span> with <span className="text-accent">♥</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
