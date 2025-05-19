
"use client";

import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { LogIn, LogOut, BookCopy } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

export function AuthButtons() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Signed In",
        description: "Successfully signed in with Google.",
      });
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Sign In Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Signed Out",
        description: "Successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
       toast({
        title: "Sign Out Failed",
        description: "Could not sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <Spinner className="h-6 w-6 text-primary" />;
  }

  return (
    <div className="flex items-center space-x-2">
      {user ? (
        <>
          {user.displayName && <span className="mr-2 text-sm text-muted-foreground hidden sm:inline">Welcome, {user.displayName.split(" ")[0]}!</span>}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/saved-paths">
              <BookCopy className="mr-2 h-4 w-4" /> My Paths
            </Link>
          </Button>
          <Button variant="outline" onClick={handleSignOut} size="sm">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </>
      ) : (
        <Button onClick={handleSignIn} size="sm">
          <LogIn className="mr-2 h-4 w-4" /> Sign In with Google
        </Button>
      )}
    </div>
  );
}
