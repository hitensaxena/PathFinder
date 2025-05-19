
"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, FilePenLine } from "lucide-react";
import { Spinner } from "@/components/spinner";

type SavedPathCardActionsProps = {
  pathId: string;
  currentLearningGoal: string;
  onDelete: (pathId: string) => Promise<void>;
  onRename: (pathId: string, newGoal: string) => Promise<void>;
};

export function SavedPathCardActions({
  pathId,
  currentLearningGoal,
  onDelete,
  onRename,
}: SavedPathCardActionsProps) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState(currentLearningGoal);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(pathId);
      // Toast is handled by the parent page for consistency
      setIsDeleteDialogOpen(false); 
    } catch (error) {
      console.error("Error deleting path from actions component:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Error Deleting Path",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) {
      toast({ title: "Validation Error", description: "Learning goal cannot be empty.", variant: "destructive" });
      return;
    }
    setIsRenaming(true);
    try {
      await onRename(pathId, newGoalName.trim());
      // Toast is handled by the parent page
      setIsRenameDialogOpen(false); 
    } catch (error) {
      console.error("Error renaming path from actions component:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Error Renaming Path",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRenaming(false);
    }
  };

  // Update input field when currentLearningGoal prop changes (e.g., after a rename)
  React.useEffect(() => {
    setNewGoalName(currentLearningGoal);
  }, [currentLearningGoal]);

  return (
    <div className="flex space-x-2">
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={() => setNewGoalName(currentLearningGoal)}>
            <FilePenLine className="mr-2 h-4 w-4" />
            Rename
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleRenameSubmit}>
            <DialogHeader>
              <DialogTitle>Rename Learning Path</DialogTitle>
              <DialogDescription>
                Change the title of your learning path. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goalName" className="text-right">
                  Title
                </Label>
                <Input
                  id="goalName"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="col-span-3"
                  required
                  disabled={isRenaming}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline" disabled={isRenaming}>
                   Cancel
                 </Button>
              </DialogClose>
              <Button type="submit" disabled={isRenaming}>
                {isRenaming ? <Spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your learning path
              and all its associated generated content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isDeleting ? <Spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
