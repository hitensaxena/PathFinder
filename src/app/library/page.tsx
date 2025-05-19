"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getUserLearningPaths, type SavedLearningPath } from "@/services/learningPathService";
import { Spinner } from "@/components/spinner";

export default function PathLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const [paths, setPaths] = useState<SavedLearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPaths([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getUserLearningPaths(user.uid)
      .then(setPaths)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to fetch paths");
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground text-lg">Please sign in to view your learning paths.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-destructive text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto max-w-5xl px-4">
        <h1 className="text-4xl font-bold mb-10 text-center">My Learning Paths</h1>
        {paths.length === 0 ? (
          <div className="text-center text-muted-foreground text-lg">No learning paths found. Start by generating a new path!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {paths.map((path) => (
              <Card key={path.id} className="h-full flex flex-col justify-between">
                <CardContent className="p-6 flex flex-col gap-4">
                  <h2 className="text-2xl font-semibold mb-1">{path.learningGoal || "Untitled Path"}</h2>
                  <div className="text-sm text-muted-foreground mb-2">Created on: {path.createdAt && path.createdAt.toDate ? path.createdAt.toDate().toLocaleDateString() : "-"}</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(path.modules || []).map((mod, i) => (
                      <span key={mod.title + i} className="px-2 py-1 bg-muted rounded text-xs font-medium text-foreground/80 border border-border">
                        {mod.title}
                      </span>
                    ))}
                  </div>
                  <Link href={`/library/${path.id}`} className="mt-auto">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition">
                      Open Full Path <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 