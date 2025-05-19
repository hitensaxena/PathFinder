
"use client";

import type { GenerateLearningPathOutput as LearningPathData } from "@/ai/flows/generate-learning-path";
import type { GenerateModuleContentOutput } from "@/ai/flows/generate-module-content";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookMarked, NotebookText, Lightbulb, TimerIcon, CheckCircle2, Sparkles, AlertCircleIcon, Youtube, ExternalLink as ExternalLinkIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

type LearningModule = LearningPathData['modules'][number];

// Represents the state for a single module's detailed content, now section-based
type ModuleContentState = {
  isLoading: boolean;
  sections: GenerateModuleContentOutput['sections'] | null; // Array of sections
  error: string | null;
};

type LearningPathDisplayProps = {
  path: LearningPathData; // This can be from AI generation or SavedLearningPath
  moduleContents?: { [moduleIndex: number]: ModuleContentState };
  onGenerateModuleContent?: (moduleIndex: number, moduleTitle: string, moduleDescription: string) => void;
};

export function LearningPathDisplay({ path, moduleContents = {}, onGenerateModuleContent }: LearningPathDisplayProps) {
  if (!path || !path.modules || path.modules.length === 0) {
    return (
      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle>Learning Path</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No learning path generated or modules are empty.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-4 text-center text-primary">
        Path Modules
      </h2>
      <Accordion type="single" collapsible defaultValue={`module-0`} className="w-full space-y-4">
        {path.modules.map((module: LearningModule, index: number) => {
          const currentModuleDetailedContentState = moduleContents?.[index];
          const hasSections = !!currentModuleDetailedContentState?.sections && currentModuleDetailedContentState.sections.length > 0;
          const isLoadingDetails = !!currentModuleDetailedContentState?.isLoading;
          const hasErrorDetails = !!currentModuleDetailedContentState?.error;

          // State for toggling visibility of the detailed content section
          const [isDetailedSectionOpen, setIsDetailedSectionOpen] = useState(false);

          const handleToggleOrGenerateDetails = () => {
            if (isLoadingDetails) return;

            if (hasSections) {
              setIsDetailedSectionOpen(!isDetailedSectionOpen);
            } else if (onGenerateModuleContent && !hasErrorDetails) {
              onGenerateModuleContent(index, module.title, module.description);
              setIsDetailedSectionOpen(true); // Open section to show loading/content
            } else if (hasErrorDetails && onGenerateModuleContent) { // Allow retry on error
              onGenerateModuleContent(index, module.title, module.description);
              setIsDetailedSectionOpen(true);
            }
          };

          let detailButtonIcon = <ChevronDown className="mr-2 h-5 w-5" />;
          let detailButtonText = "Detailed Content & Resources";
          let buttonDisabled = false;

          if(isLoadingDetails) {
            detailButtonIcon = <Spinner className="mr-2 h-5 w-5" />;
            detailButtonText = "Generating Details...";
            buttonDisabled = true;
          } else if (hasSections) {
            detailButtonIcon = isDetailedSectionOpen ? <ChevronUp className="mr-2 h-5 w-5" /> : <ChevronDown className="mr-2 h-5 w-5" />;
            detailButtonText = isDetailedSectionOpen ? "Hide Details" : "Show Details";
          } else if (onGenerateModuleContent && !hasErrorDetails) {
            detailButtonIcon = <Sparkles className="mr-2 h-5 w-5" />;
            detailButtonText = "Generate & Show Details";
          } else if (hasErrorDetails) {
            detailButtonIcon = <AlertCircleIcon className="mr-2 h-5 w-5 text-destructive" />;
            detailButtonText = onGenerateModuleContent ? "Retry Generating Details" : "Error Loading Details";
            buttonDisabled = !onGenerateModuleContent; // Disable only if no retry mechanism
          } else {
            // Case where there's no content, no error, and no onGenerateModuleContent prop
             detailButtonIcon = <ChevronDown className="mr-2 h-5 w-5" />; // Default icon
             buttonDisabled = true; // Can't do anything
          }


          return (
            <AccordionItem value={`module-${index}`} key={index} className="border bg-card rounded-lg shadow-md">
              <AccordionTrigger className="p-6 hover:no-underline">
                <div className="flex items-center text-left w-full">
                  <BookMarked className="h-6 w-6 mr-3 text-accent flex-shrink-0" />
                  <span className="text-xl font-semibold flex-grow">{module.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-0">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <NotebookText className="h-5 w-5 mr-3 mt-1 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground">{module.description}</p>
                  </div>
                  <div className="flex items-start">
                    <Lightbulb className="h-5 w-5 mr-3 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Suggested Resources:</h4>
                      <p className="text-muted-foreground">{module.suggestedResources}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <TimerIcon className="h-5 w-5 mr-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm font-medium">
                      Estimated Time: <span className="font-normal text-muted-foreground">{module.estimatedTime}</span>
                    </p>
                  </div>

                  {/* Collapsible Detailed Content Section */}
                  {(onGenerateModuleContent || hasSections || isLoadingDetails || hasErrorDetails) && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="ghost" 
                        onClick={handleToggleOrGenerateDetails}
                        className="w-full justify-start text-lg font-medium mb-3 pl-0 hover:bg-transparent text-left h-auto py-2"
                        disabled={buttonDisabled}
                      >
                        <div className="flex items-center">
                          {detailButtonIcon}
                          <span>{detailButtonText}</span>
                        </div>
                      </Button>
                      
                      {isDetailedSectionOpen && (
                        <div className="pl-2 space-y-3">
                          {isLoadingDetails && (
                            <div className="flex items-center space-x-2 text-muted-foreground py-4">
                              <Spinner className="h-5 w-5" />
                              <span>Generating detailed content...</span>
                            </div>
                          )}

                          {hasErrorDetails && !isLoadingDetails && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertCircleIcon className="h-4 w-4" />
                              <AlertTitle>Error Generating Content</AlertTitle>
                              <AlertDescription>{currentModuleDetailedContentState?.error}</AlertDescription>
                            </Alert>
                          )}
                          
                          {hasSections && !isLoadingDetails && !hasErrorDetails && currentModuleDetailedContentState?.sections && (
                            <div className="space-y-4 mt-2">
                              {currentModuleDetailedContentState.sections.map((section, secIdx) => (
                                <Card key={secIdx} className="shadow-sm bg-background"> {/* Changed background for better contrast */}
                                  <CardHeader>
                                    {section.recommendedYoutubeVideoQuery && (
                                        <div className="mb-3">
                                          <h5 className="font-medium mb-1 flex items-center text-sm text-muted-foreground">
                                            <Youtube className="h-4 w-4 mr-2 text-red-600" /> {/* Adjusted color for visibility */}
                                            Suggested Video for this Section:
                                          </h5>
                                          <a
                                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(section.recommendedYoutubeVideoQuery)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline hover:text-accent text-sm transition-colors inline-flex items-center group"
                                          >
                                            {section.recommendedYoutubeVideoQuery}
                                            <ExternalLinkIcon className="ml-1 h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                                          </a>
                                        </div>
                                      )}
                                    <CardTitle className="text-lg text-foreground">{section.sectionTitle}</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div 
                                      className="prose prose-sm max-w-none text-foreground dark:prose-invert" 
                                      dangerouslySetInnerHTML={{ __html: section.sectionContent }}
                                    />
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
       <Card className="mt-8 shadow-lg border-t-4 border-accent">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle2 className="h-6 w-6 mr-2 text-green-500" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is your starting point! Use the suggested resources and time estimates to begin your learning journey.
            {onGenerateModuleContent && " Generate detailed content, broken into sections with video suggestions, for each module to get a deeper understanding."}
            Remember to adapt the plan to your pace and dive deeper into topics that interest you most. Happy learning!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Re-add ExternalLink if it was removed or ensure it's imported from lucide-react
// For now, defining it locally to ensure it exists.
// const ExternalLink = (props: React.SVGProps<SVGSVGElement>) => ( // Already imported as ExternalLinkIcon
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       {...props}
//     >
//       <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
//       <polyline points="15 3 21 3 21 9" />
//       <line x1="10" y1="14" x2="21" y2="3" />
//     </svg>
//   );

    