
"use client";

import type { GenerateLearningPathOutput as LearningPathData } from "@/ai/flows/generate-learning-path";
import type { ModuleSectionSchema } from "@/ai/flows/generate-module-content"; // Corrected import name
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
import { BookMarked, NotebookText, Lightbulb, CheckCircle2, Sparkles, AlertCircleIcon, Youtube, ExternalLink as ExternalLinkIcon, ChevronDown, ChevronUp, HelpCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import Link from 'next/link';
import type { SavedModuleQuizStatus, SavedLearningPath } from "@/services/learningPathService";

type LearningModule = LearningPathData['modules'][number];

// New type for module that includes optional quiz status
export type LearningModuleWithQuizStatus = LearningModule & {
  quizStatus?: SavedModuleQuizStatus;
};

// Updated: This is now an array of section objects
type SectionContent = ModuleSectionSchema; // This is the type for one section

type ModuleDetailedContentState = {
  isLoading: boolean;
  sections: SectionContent[] | null; // Array of sections
  error: string | null;
};

type LearningPathDisplayProps = {
  path: { modules: LearningModuleWithQuizStatus[] } & Omit<LearningPathData, 'modules'> & Partial<Pick<SavedLearningPath, 'id'>>;
  learningGoal: string;
  moduleContents?: { [moduleIndex: string]: ModuleDetailedContentState };
  onGenerateModuleContent?: (moduleIndex: number, moduleTitle: string, moduleDescription: string) => void;
};

export function LearningPathDisplay({ path, learningGoal, moduleContents = {}, onGenerateModuleContent }: LearningPathDisplayProps) {
  const [detailedSectionOpen, setDetailedSectionOpen] = useState<{ [key: string]: boolean }>({});

  if (!path || !path.modules || path.modules.length === 0) {
    return (
      <Card className="mt-8 shadow-lg">
        <CardHeader><CardTitle>Learning Path</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">No learning path generated or modules are empty.</p></CardContent>
      </Card>
    );
  }

  const handleToggleOrGenerateDetails = (index: number, module: LearningModuleWithQuizStatus) => {
    const moduleKey = String(index);
    const currentDetailedState = moduleContents?.[moduleKey];
    const isLoadingDetails = !!currentDetailedState?.isLoading;
    // Check if sections array exists and has items
    const hasSectionsData = !!currentDetailedState?.sections && currentDetailedState.sections.length > 0;
    const hasErrorDetails = !!currentDetailedState?.error;

    if (isLoadingDetails) return;

    if (hasSectionsData || hasErrorDetails) {
      setDetailedSectionOpen(prev => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
    } else if (onGenerateModuleContent) {
      onGenerateModuleContent(index, module.title, module.description);
      setDetailedSectionOpen(prev => ({ ...prev, [moduleKey]: true })); 
    }
  };
  
  return (
    <div className="mt-6">
      {/* Removed "Path Modules" title from here */}
      <Accordion type="single" collapsible defaultValue={`module-0`} className="w-full space-y-6">
        {path.modules.map((module: LearningModuleWithQuizStatus, index: number) => {
          const moduleKey = String(index);
          const currentDetailedContentState = moduleContents?.[moduleKey];
          const hasSectionsData = !!currentDetailedContentState?.sections && currentDetailedContentState.sections.length > 0;
          const isLoadingDetails = !!currentDetailedContentState?.isLoading;
          const hasErrorDetails = !!currentDetailedContentState?.error;
          const isDetailedViewOpen = !!detailedSectionOpen[moduleKey];

          let detailButtonIcon = <ChevronDown className="mr-2 h-5 w-5" />;
          let detailButtonText = "Detailed Content & Resources";
          let detailButtonDisabled = false;

          if (isLoadingDetails) {
            detailButtonIcon = <Spinner className="mr-2 h-5 w-5" />;
            detailButtonText = "Generating Details...";
            detailButtonDisabled = true;
          } else if (hasSectionsData) {
            detailButtonIcon = isDetailedViewOpen ? <ChevronUp className="mr-2 h-5 w-5" /> : <ChevronDown className="mr-2 h-5 w-5" />;
            detailButtonText = isDetailedViewOpen ? "Hide Details" : "Show Details";
          } else if (onGenerateModuleContent && !hasErrorDetails) { 
            detailButtonIcon = <Sparkles className="mr-2 h-5 w-5" />;
            detailButtonText = "Generate & Show Details";
          } else if (hasErrorDetails && onGenerateModuleContent) { 
             detailButtonIcon = <AlertCircleIcon className="mr-2 h-5 w-5 text-destructive" />;
             detailButtonText = "Retry Generating Details";
          } else if (!onGenerateModuleContent && !hasSectionsData && !hasErrorDetails) { 
             detailButtonIcon = <ChevronDown className="mr-2 h-5 w-5" />;
             detailButtonText = "Detailed Content Unavailable";
             detailButtonDisabled = true;
          }
          
          let quizButtonText = "Test Your Knowledge";
          let quizButtonIcon = <HelpCircle className="mr-2 h-5 w-5 text-primary" />;
          let quizButtonVariant: "outline" | "default" | "secondary" = "outline";

          if (module.quizStatus) {
            if (module.quizStatus.completed) {
              quizButtonText = `Quiz Passed! (${module.quizStatus.score.toFixed(0)}%)`;
              quizButtonIcon = <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />;
              quizButtonVariant = "default"; 
            } else {
              quizButtonText = `Retake Quiz (Last: ${module.quizStatus.score.toFixed(0)}%)`;
              quizButtonIcon = <RefreshCw className="mr-2 h-5 w-5 text-orange-600" />;
              quizButtonVariant = "secondary";
            }
          }

          const queryParams = new URLSearchParams({
            moduleTitle: encodeURIComponent(module.title),
            moduleDescription: encodeURIComponent(module.description),
            learningGoal: encodeURIComponent(learningGoal),
          });
          if (path.id) { 
            queryParams.set('pathId', path.id);
            queryParams.set('moduleIndex', String(index));
          }
          const quizLink = `/quiz?${queryParams.toString()}`;

          return (
            <AccordionItem value={`module-${index}`} key={index} className="border border-border bg-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <AccordionTrigger className="p-6 hover:no-underline data-[state=open]:bg-muted/50 transition-colors">
                <div className="flex items-center text-left w-full">
                  <BookMarked className="h-7 w-7 mr-4 text-primary flex-shrink-0" />
                  <div className="flex-grow">
                    <span className="text-xl font-semibold text-foreground">{module.title}</span>
                    <p className="text-sm text-muted-foreground mt-1">{module.estimatedTime}</p>
                  </div>
                  {module.quizStatus?.completed && (
                    <CheckCircle2 className="h-6 w-6 text-green-500 ml-3 flex-shrink-0" title="Module Completed!" />
                  )}
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
                  
                  {(onGenerateModuleContent || hasSectionsData || isLoadingDetails || hasErrorDetails) && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleToggleOrGenerateDetails(index, module)}
                        className="w-full justify-start text-md font-semibold mb-2 pl-0 hover:bg-transparent hover:text-primary text-left h-auto py-1"
                        disabled={detailButtonDisabled}
                      >
                        <div className="flex items-center">
                          {detailButtonIcon}
                          <span>{detailButtonText}</span>
                        </div>
                      </Button>
                      
                      {isDetailedViewOpen && (
                        <div className="pl-1 space-y-5">
                          {isLoadingDetails && (
                            <div className="flex items-center space-x-2 text-muted-foreground py-4">
                              <Spinner className="h-5 w-5" /><p>Generating detailed content...</p>
                            </div>
                          )}
                          {hasErrorDetails && !isLoadingDetails && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertCircleIcon className="h-4 w-4" />
                              <AlertTitle>Error Generating Content</AlertTitle>
                              <AlertDescription>{currentDetailedContentState?.error}</AlertDescription>
                            </Alert>
                          )}
                          {hasSectionsData && !isLoadingDetails && !hasErrorDetails && currentDetailedContentState?.sections && (
                            <div className="space-y-4 mt-1">
                              {currentDetailedContentState.sections.map((section, secIdx) => (
                                <Card key={secIdx} className="shadow-md bg-muted/30 border-border overflow-hidden">
                                  <CardHeader className="pb-3">
                                    {section.recommendedYoutubeVideoQuery && (
                                      <div className="mb-2">
                                        <h5 className="font-medium mb-1 flex items-center text-sm text-primary">
                                          <Youtube className="h-5 w-5 mr-2 text-red-600" />Watch & Learn:
                                        </h5>
                                        <a
                                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(section.recommendedYoutubeVideoQuery)}`}
                                          target="_blank" rel="noopener noreferrer"
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

                  <div className="mt-4 pt-4 border-t border-border">
                     <Button 
                        variant={quizButtonVariant}
                        asChild 
                        className="w-full justify-start text-md font-semibold mb-2 pl-0 hover:bg-accent/20 text-left h-auto py-2"
                      >
                        <Link href={quizLink}>
                          <div className="flex items-center">
                            {quizButtonIcon}
                            <span>{quizButtonText}</span>
                          </div>
                        </Link>
                      </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
       <Card className="mt-10 shadow-lg border-t-4 border-primary bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <CheckCircle2 className="h-7 w-7 mr-3 text-green-600" /> What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This AI-generated path is your launchpad! Use the suggested resources and time estimates to start. 
            {onGenerateModuleContent && " Generate detailed content and video suggestions for each module to dive deeper."}
            Test your knowledge with the quizzes for each module to solidify your understanding and mark modules as complete.
            <br/><br/>
            Remember, learning is a personal journey. Adapt this plan to your own pace, explore topics that capture your interest, and don't be afraid to go off-script. Happy learning!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

