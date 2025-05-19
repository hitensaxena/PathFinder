
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { getUserLearningPaths, type SavedLearningPath } from "@/services/learningPathService";
import { LearningPathDisplay } from "@/components/learning-path-display";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/spinner";
import { AlertCircle, BookCopy, LogIn, ListChecks, LayoutDashboard } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export default function SavedPathsPage() {
  const { user, loading: authLoading } = useAuth();
  const [savedPaths, setSavedPaths] = useState<SavedLearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setIsLoading(false);
      setSavedPaths([]); // Clear paths if user logs out
      return;
    }

    async function fetchPaths() {
      setIsLoading(true);
      setError(null);
      try {
        const paths = await getUserLearningPaths(user.uid);
        setSavedPaths(paths);
      } catch (e) {
        console.error("Error fetching saved learning paths:", e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while fetching your saved paths.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPaths();
  }, [user, authLoading]);

  if (authLoading || isLoading) {
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
            Revisit your personalized learning journeys.
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

        {!isLoading && !error && savedPaths.length > 0 && (
          <div className="space-y-12">
            {savedPaths.map((path) => (
              <Card key={path.id} className="shadow-xl overflow-hidden border-t-4 border-primary">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Learning Path
                  </CardTitle>
                   {path.createdAt && (
                     <CardDescription>
                       Saved {formatDistanceToNow(path.createdAt.toDate(), { addSuffix: true })}
                     </CardDescription>
                   )}
                </CardHeader>
                <CardContent>
                  <LearningPathDisplay path={path} />
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

// Simple Header and Footer components for this page, can be extracted later if needed
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
        {/* AuthButtons could be imported here if complex auth logic is needed, or kept separate */}
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

