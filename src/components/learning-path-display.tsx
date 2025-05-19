
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
  CardDescription, // Added for module sub-details
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
      <h2 className="text-2xl font-semibold mb-6 text-center text-primary">
        Path Modules
      </h2>
      <Accordion type="single" collapsible defaultValue={`module-0`} className="w-full space-y-6">
        {path.modules.map((module: LearningModule, index: number) => {
          const currentModuleDetailedContentState = moduleContents?.[index];
          const hasSections = !!currentModuleDetailedContentState?.sections && currentModuleDetailedContentState.sections.length > 0;
          const isLoadingDetails = !!currentModuleDetailedContentState?.isLoading;
          const hasErrorDetails = !!currentModuleDetailedContentState?.error;

          const [isDetailedSectionOpen, setIsDetailedSectionOpen] = useState(false);

          const handleToggleOrGenerateDetails = () => {
            if (isLoadingDetails) return;

            if (hasSections) {
              setIsDetailedSectionOpen(!isDetailedSectionOpen);
            } else if (onGenerateModuleContent && !hasErrorDetails) {
              onGenerateModuleContent(index, module.title, module.description);
              setIsDetailedSectionOpen(true); 
            } else if (hasErrorDetails && onGenerateModuleContent) { 
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
            buttonDisabled = !onGenerateModuleContent;
          } else {
             detailButtonIcon = <ChevronDown className="mr-2 h-5 w-5" />;
             buttonDisabled = true; 
          }


          return (
            <AccordionItem value={`module-${index}`} key={index} className="border border-border bg-card rounded-xl shadow-lg overflow-hidden">
              <AccordionTrigger className="p-6 hover:no-underline data-[state=open]:bg-muted/50 transition-colors">
                <div className="flex items-center text-left w-full">
                  <BookMarked className="h-7 w-7 mr-4 text-primary flex-shrink-0" />
                  <div className="flex-grow">
                    <span className="text-xl font-semibold text-foreground">{module.title}</span>
                    <p className="text-sm text-muted-foreground mt-1">{module.estimatedTime}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-2 bg-card">
                <div className="space-y-4">
                  <div className="flex items-start text-muted-foreground">
                    <NotebookText className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
                    <p>{module.description}</p>
                  </div>
                  <div className="flex items-start text-muted-foreground">
                    <Lightbulb className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Suggested Resources:</h4>
                      <p>{module.suggestedResources}</p>
                    </div>
                  </div>
                  
                  {(onGenerateModuleContent || hasSections || isLoadingDetails || hasErrorDetails) && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <Button 
                        variant="ghost" 
                        onClick={handleToggleOrGenerateDetails}
                        className="w-full justify-start text-lg font-semibold mb-3 pl-0 hover:bg-transparent hover:text-primary text-left h-auto py-2"
                        disabled={buttonDisabled}
                      >
                        <div className="flex items-center">
                          {detailButtonIcon}
                          <span>{detailButtonText}</span>
                        </div>
                      </Button>
                      
                      {isDetailedSectionOpen && (
                        <div className="pl-1 space-y-5">
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
                                <Card key={secIdx} className="shadow-md bg-muted/30 border-border overflow-hidden">
                                  <CardHeader className="pb-3">
                                    {section.recommendedYoutubeVideoQuery && (
                                        <div className="mb-2">
                                          <h5 className="font-medium mb-1 flex items-center text-sm text-primary">
                                            <Youtube className="h-5 w-5 mr-2 text-red-600" /> 
                                            Watch & Learn:
                                          </h5>
                                          <a
                                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(section.recommendedYoutubeVideoQuery)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline hover:text-accent-foreground text-sm transition-colors inline-flex items-center group"
                                          >
                                            {section.recommendedYoutubeVideoQuery}
                                            <ExternalLinkIcon className="ml-1.5 h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                                          </a>
                                        </div>
                                      )}
                                    <CardTitle className="text-lg text-foreground">{section.sectionTitle}</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div 
                                      className="prose prose-sm max-w-none text-foreground dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground prose-li:marker:text-primary"
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
       <Card className="mt-10 shadow-lg border-t-4 border-primary bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <CheckCircle2 className="h-7 w-7 mr-3 text-green-600" />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This AI-generated path is your launchpad! Use the suggested resources and time estimates to start. 
            {onGenerateModuleContent && " Generate detailed content and video suggestions for each module to dive deeper."}
            <br/><br/>
            Remember, learning is a personal journey. Adapt this plan to your own pace, explore topics that capture your interest, and don't be afraid to go off-script. Happy learning!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
