"use client";

import { notFound, useRouter } from "next/navigation";
import { useEffect, useState, use, useCallback } from "react";
import { BookOpen, Pencil, Trash2, Sparkles, ListChecks, Play, Lock, CheckCircle2, Clock, Youtube, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { getUserLearningPaths, deleteLearningPath, updateLearningPathGoal, type SavedLearningPath, type SavedModuleDetailedContent } from "@/services/learningPathService";
import { Spinner } from "@/components/spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Simulated sub-module data structure (replace with real data if available)
const simulatedSubModules = [
  { title: "Introduction", completed: true, icon: <CheckCircle2 className="h-4 w-4 text-primary" /> },
  { title: "Core Concepts", completed: false, icon: <Lock className="h-4 w-4 text-muted-foreground" /> },
  { title: "Advanced Topics", completed: false, icon: <Lock className="h-4 w-4 text-muted-foreground" /> },
];

// Helper to simulate getting a YouTube embed URL from a query (replace with actual YouTube API call)
const getSimulatedYoutubeEmbedUrl = (query: string | undefined): string | null => {
  if (!query) return null;
  // In a real app, you would perform a YouTube search here
  // For simulation, let's just use a placeholder or derive from the query
  const baseEmbedUrl = "https://www.youtube.com/embed/";
  // This is a placeholder video ID (Rick Astley). Replace with actual search logic.
  const placeholderVideoId = "dQw4w9WgXcQ"; 
  // A slightly more dynamic placeholder based on query might look like:
  // const simpleHash = query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0); 
  // const simulatedVideoId = `sim${simpleHash}`; // Not a real YouTube ID
  
  return `${baseEmbedUrl}${placeholderVideoId}?rel=0`;
};


export default function PathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [path, setPath] = useState<SavedLearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [selectedSubModuleIndex, setSelectedSubModuleIndex] = useState(0);


  useEffect(() => {
    if (!user) {
      setPath(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getUserLearningPaths(user.uid)
      .then((paths) => {
        const found = paths.find((p) => p.id === id);
        setPath(found || null);
        // Select the first module and first sub-module by default if path is found and has modules
        if (found && found.modules && found.modules.length > 0) {
          setSelectedModuleIndex(0);
          setSelectedSubModuleIndex(0);
        } else {
           // If no path or modules, reset selection
           setSelectedModuleIndex(0);
           setSelectedSubModuleIndex(0);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to fetch path"))
      .finally(() => {
        setLoading(false);
      });
  }, [user, id]);

  // Handlers for actions on the selected module (displayed in main content)
  // These would ideally interact with backend to generate/update content
  const handleGenerateContentForModule = (moduleIndex: number) => {
     // In a real app, trigger AI content generation for this module and save it
    alert(`Simulating Generate Content for module: ${path?.modules?.[moduleIndex]?.title || 'N/A'}`);
    // You would likely call an AI service here and then update the path in the database and state
  };

  const handleTestKnowledgeForModule = (moduleIndex: number) => {
    // In a real app, navigate to a quiz page covering the entire module
    if (!path || !path.id) {
      toast({ // Assuming toast is available in this component, if not, need to import useToast
        title: "Error",
        description: "Path data not fully loaded. Please try again.",
        variant: "destructive",
      });
      return;
    }
    router.push(`/quiz?pathId=${path.id}&moduleIndex=${moduleIndex}&scope=module`);
  };

  // Handler for selecting a module and optionally a sub-module from the sidebar
  const handleItemSelect = (moduleIndex: number, subModuleIndex: number) => {
    setSelectedModuleIndex(moduleIndex);
    setSelectedSubModuleIndex(subModuleIndex);
  };

  // Handler for simulated sub-module quiz button click
  const handleSubModuleTestKnowledge = (moduleIndex: number, subModuleIndex: number) => {
     // In a real app, navigate to a quiz page for this specific sub-module
     const moduleTitle = path?.modules?.[moduleIndex]?.title || 'N/A';
     const subModuleTitle = simulatedSubModules[subModuleIndex]?.title || 'N/A';
     alert(`Initiate Quiz for sub-module: ${moduleTitle} - ${subModuleTitle}`);
     // router.push(`/quiz?pathId=${path?.id}&moduleIndex=${moduleIndex}&subModuleIndex=${subModuleIndex}&scope=submodule`);
  };

  // Action handlers for the entire path
  const handleRename = async () => {
    if (!newTitle.trim()) return;
    setActionLoading(true);
    try {
      await updateLearningPathGoal(path!.id, newTitle); // Use non-null assertion as path is checked before
      setPath({ ...path!, learningGoal: newTitle });
      setRenaming(false);
      setNewTitle("");
    } catch (e) {
      alert("Failed to rename path");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this path?")) return;
    setActionLoading(true);
    try {
      await deleteLearningPath(path!.id); // Use non-null assertion as path is checked before
      router.push("/library");
    } catch (e) {
      alert("Failed to delete path");
    } finally {
      setActionLoading(false);
    }
  };

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
        <div className="text-center text-muted-foreground text-lg">Please sign in to view this path.</div>
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-destructive text-lg">{error || "Path not found."}</div>
      </div>
    );
  }

  const selectedModule = path.modules?.[selectedModuleIndex];
  // Get the actual saved detailed content for the selected module, if it exists
  const selectedModuleDetails = path.modulesDetails?.[String(selectedModuleIndex)];
  // Get the specific section for the selected sub-module within the selected module's details
  // Assuming sub-module index corresponds to section index
  const selectedSection = selectedModuleDetails?.sections?.[selectedSubModuleIndex];

  // Determine the YouTube URL to embed (simulated)
  const youtubeEmbedUrl = getSimulatedYoutubeEmbedUrl(selectedSection?.recommendedYoutubeVideoQuery);


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <BookOpen className="h-12 w-12 text-primary mb-4" />
          {renaming ? (
            <div className="flex flex-col items-center w-full mb-4">
              <input
                className="border rounded px-3 py-2 text-lg w-full mb-2"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Enter new path name"
                disabled={actionLoading}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleRename} disabled={actionLoading || !newTitle.trim()}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setRenaming(false)} disabled={actionLoading}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <h1 className="text-4xl font-bold mb-2">{path.learningGoal || "Untitled Path"}</h1>
          )}
          <div className="text-sm text-muted-foreground mb-2">Created on: {path.createdAt && path.createdAt.toDate ? path.createdAt.toDate().toLocaleDateString() : "-"}</div>
        </div>

        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Module Content (Left Side) */}
          <div className="lg:col-span-2 order-last lg:order-first">
            {selectedModule ? (
              <Card className="rounded-lg p-6 shadow-sm">
                 {/* YouTube Video Embed */}
                <div className="aspect-video bg-muted rounded-md overflow-hidden mb-6">
                   {youtubeEmbedUrl ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={youtubeEmbedUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No video available for this section.
                     </div>
                   )}
                </div>

                <h2 className="text-2xl font-semibold mb-4">{selectedSection?.sectionTitle || selectedModule.title + (simulatedSubModules[selectedSubModuleIndex]?.title ? ' - ' + simulatedSubModules[selectedSubModuleIndex].title : '')}</h2>
                
                {selectedSection ? (
                  <div className="space-y-6">
                    {/* Display generated content from saved details */}
                    <div className="border-b border-border pb-6 last:border-0">
                       <div className="text-muted-foreground mb-4" dangerouslySetInnerHTML={{ __html: selectedSection.sectionContent || '<p>No content available for this section.</p>' }}></div>
                      
                      {/* You might display other relevant info from the section here if available */}
                      {/* For now, keeping the placeholder time/resources for structure */}
                      <div className="flex flex-wrap gap-4">
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                           <Clock className="h-4 w-4" />
                           <span>5 min Video</span> 
                         </div>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                           <FileText className="h-4 w-4" /> 
                           <span>Lecture Notes</span>
                         </div>
                       </div>
                    </div>
                  </div>
                ) : (selectedModuleDetails ? (
                   <div className="text-muted-foreground text-center">
                     No detailed content found for this specific sub-module/section.
                   </div>
                ) : (
                   <div className="text-muted-foreground text-center">
                     Detailed content has not been generated for this module.
                     {/* Optionally, add a button to trigger generation here */}
                      {/* <Button variant="outline" size="sm" onClick={() => handleGenerateContentForModule(selectedModuleIndex)} className="mt-4"><Sparkles className="h-4 w-4 mr-2" /> Generate Detailed Content</Button> */}
                   </div>
                )
                )}

                 {/* Module-wide quiz and generate content buttons (as per image, associated with the main module topic) */}
                 {/* These buttons are always shown if a module is selected, regardless of sub-module content availability */}
                <div className="flex gap-2 mt-4 border-t border-border pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={() => handleGenerateContentForModule(selectedModuleIndex)}
                    disabled={actionLoading}
                  >
                    <Sparkles className="h-4 w-4" /> Generate Content
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={() => handleTestKnowledgeForModule(selectedModuleIndex)}
                    disabled={actionLoading}
                  >
                    <ListChecks className="h-4 w-4" /> Test Module Knowledge
                  </Button>
                </div>

              </Card>
            ) : ( // Case when no module is selected (e.g., path is empty or error) - though default select handles this
               <div className="bg-card rounded-lg p-6 shadow-sm text-center text-muted-foreground">
                 Select a module from the sidebar to view its overview.
               </div>
            )
            }
          </div>

          {/* Course Modules Sidebar (Right Side) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Course Content</h2>
              <Accordion type="single" collapsible className="w-full" defaultValue={`item-${selectedModuleIndex}`}> 
                {(path.modules || []).map((mod, i) => (
                  <AccordionItem key={mod.title + i} value={`item-${i}`}>
                    {/* Module Trigger - can be clicked to open/close and also selects the module and its *first* sub-module */}
                    <AccordionTrigger 
                       className={cn(
                         "text-left hover:no-underline data-[state=open]:border-b-0 pr-4 relative", 
                         selectedModuleIndex === i && "bg-muted/50"
                       )}
                       onClick={() => handleItemSelect(i, 0)} // Clicking trigger selects the module and its FIRST sub-module
                    >
                      <div className="flex items-center gap-2 w-full">
                         {/* Visual indicator for selected module */}
                        {selectedModuleIndex === i && <span className="absolute left-0 top-0 h-full w-1 bg-primary rounded-full" aria-hidden="true"></span>} 
                        <span className="font-medium pl-4 pr-4">{mod.title}</span> 
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border-t border-border rounded-b-md">
                      <div className="flex flex-col gap-1 px-2 py-2 bg-muted/50">
                        {/* Simulated Sub-modules */}
                        {simulatedSubModules.map((subMod, subModIndex) => (
                          <div 
                            key={subModIndex}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded text-sm w-full text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                              selectedModuleIndex === i && selectedSubModuleIndex === subModIndex ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-muted/80",
                            )}
                             onClick={() => handleItemSelect(i, subModIndex)} // Clicking sub-module selects it
                          >
                             <Play className="h-4 w-4 text-primary flex-shrink-0" /> 
                             <span className="flex-grow truncate">{subMod.title}</span> 
                             {/* Sub-module specific quiz button */}
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="flex items-center gap-1 h-6 px-2 flex-shrink-0"
                               onClick={(e) => { e.stopPropagation(); handleSubModuleTestKnowledge(i, subModIndex); }} 
                               disabled={actionLoading}
                             >
                               <ListChecks className="h-3 w-3" /> Quiz
                             </Button>
                             {/* Status indicator */}
                             {subMod.icon}
                          </div>
                        ))}
                         {/* Optional: Add Module-wide quiz/generate buttons in the footer of AccordionContent */}
                           {/* <div className="flex gap-2 px-2 pt-2">
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="flex items-center gap-2 w-full justify-center"
                               onClick={() => handleGenerateContentForModule(i)}
                               disabled={actionLoading}
                             >
                               <Sparkles className="h-4 w-4" /> Gen Content
                             </Button>
                             <Button 
                               variant="secondary" 
                               size="sm" 
                               className="flex items-center gap-2 w-full justify-center"
                               onClick={() => handleTestKnowledgeForModule(i)}
                               disabled={actionLoading}
                             >
                               <ListChecks className="h-4 w-4" /> Test Module Knowledge
                             </Button>
                           </div> */}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>

        {/* Course Actions */}
        <div className="flex flex-wrap gap-4 justify-center w-full mt-8">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => { setRenaming(true); setNewTitle(path.learningGoal || ""); }} disabled={actionLoading}>
            <Pencil className="h-4 w-4" /> Rename Course
          </Button>
          <Button variant="destructive" className="flex items-center gap-2" onClick={handleDelete} disabled={actionLoading}>
            <Trash2 className="h-4 w-4" /> Delete Course
          </Button>
        </div>
      </div>
    </div>
  );
} 