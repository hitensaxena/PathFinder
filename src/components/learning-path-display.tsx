
"use client";

import type { GenerateLearningPathOutput as LearningPathData } from "@/ai/flows/generate-learning-path";
import type { ModuleSection } from "@/ai/flows/content-types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookMarked, NotebookText, Lightbulb, CheckCircle2, Sparkles, AlertCircleIcon, Youtube, ExternalLink as ExternalLinkIcon, ChevronDown, ChevronUp, HelpCircle, RefreshCw, LayoutList } from "lucide-react";
import { useState } from "react";
import Link from 'next/link';
import type { SavedModuleQuizStatus, SavedLearningPath } from "@/services/learningPathService";

type LearningModule = LearningPathData['modules'][number];

export type LearningModuleWithQuizStatus = LearningModule & {
  quizStatus?: SavedModuleQuizStatus;
};

type SectionContent = ModuleSection;

type ModuleDetailedContentState = {
  isLoading: boolean;
  sections: SectionContent[] | null;
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
      <Card className="mt-8 shadow-xl rounded-xl border-t-4 border-primary">
        <CardHeader><CardTitle className="text-2xl">Learning Path</CardTitle></CardHeader>
        <CardContent><p className="text-lg text-muted-foreground">No learning path generated or modules are empty.</p></CardContent>
      </Card>
    );
  }

  const handleToggleOrGenerateDetails = (index: number, module: LearningModuleWithQuizStatus) => {
    const moduleKey = String(index);
    const currentDetailedState = moduleContents?.[moduleKey];
    const isLoadingDetails = !!currentDetailedState?.isLoading;
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
      <Accordion type="single" collapsible defaultValue={`module-0`} className="w-full space-y-6">
        {path.modules.map((module: LearningModuleWithQuizStatus, index: number) => {
          const moduleKey = String(index);
          const currentDetailedContentState = moduleContents?.[moduleKey];
          const hasSectionsData = !!currentDetailedContentState?.sections && currentDetailedContentState.sections.length > 0;
          const isLoadingDetails = !!currentDetailedContentState?.isLoading;
          const hasErrorDetails = !!currentDetailedContentState?.error;
          const isDetailedViewOpen = !!detailedSectionOpen[moduleKey];

          let detailButtonIcon = <LayoutList className="mr-2 h-5 w-5" />;
          let detailButtonText = "View Detailed Content & Resources";
          let detailButtonDisabled = false;
          let detailButtonVariant: "ghost" | "outline" = "ghost";


          if (isLoadingDetails) {
            detailButtonIcon = <Spinner className="mr-2 h-5 w-5" />;
            detailButtonText = "Generating Details...";
            detailButtonDisabled = true;
          } else if (hasSectionsData) {
            detailButtonIcon = isDetailedViewOpen ? <ChevronUp className="mr-2 h-5 w-5" /> : <ChevronDown className="mr-2 h-5 w-5" />;
            detailButtonText = isDetailedViewOpen ? "Hide Details" : "Show Details";
          } else if (onGenerateModuleContent && !hasErrorDetails) { 
            detailButtonIcon = <Sparkles className="mr-2 h-5 w-5" />;
            detailButtonText = "Generate Detailed Content";
            detailButtonVariant = "outline";
          } else if (hasErrorDetails && onGenerateModuleContent) { 
             detailButtonIcon = <AlertCircleIcon className="mr-2 h-5 w-5 text-destructive" />;
             detailButtonText = "Retry Generating Details";
             detailButtonVariant = "outline";
          } else if (!onGenerateModuleContent && !hasSectionsData && !hasErrorDetails) { 
             detailButtonIcon = <LayoutList className="mr-2 h-5 w-5" />;
             detailButtonText = "Detailed Content Unavailable";
             detailButtonDisabled = true;
          }
          
          let quizButtonText = "Test Your Knowledge";
          let quizButtonIcon = <HelpCircle className="mr-2 h-5 w-5" />;
          let quizButtonVariant: "outline" | "default" | "secondary" = "secondary";

          if (module.quizStatus) {
            if (module.quizStatus.completed) {
              quizButtonText = `Quiz Passed! (${module.quizStatus.score.toFixed(0)}%)`;
              quizButtonIcon = <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />;
              quizButtonVariant = "default"; 
            } else {
              quizButtonText = `Retake Quiz (Last: ${module.quizStatus.score.toFixed(0)}%)`;
              quizButtonIcon = <RefreshCw className="mr-2 h-5 w-5 text-orange-500" />;
              quizButtonVariant = "outline";
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
            <AccordionItem value={`module-${index}`} key={index} className="border-2 border-border bg-card rounded-xl shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-hidden">
              <AccordionTrigger className="p-6 hover:no-underline data-[state=open]:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t-lg">
                <div className="flex items-center text-left w-full gap-4">
                  <BookMarked className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-foreground leading-tight">{module.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{module.estimatedTime}</p>
                  </div>
                  {module.quizStatus?.completed && (
                    <div className="flex items-center gap-1 text-green-600 font-medium text-sm ml-auto p-2 bg-green-500/10 rounded-md">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-4 bg-card border-t border-border">
                <div className="space-y-6">
                  <div className="flex items-start text-muted-foreground text-base">
                    <NotebookText className="h-5 w-5 mr-3 mt-1 flex-shrink-0 text-primary/80" />
                    <p>{module.description}</p>
                  </div>
                  <div className="flex items-start text-muted-foreground text-base">
                    <Lightbulb className="h-5 w-5 mr-3 mt-1 flex-shrink-0 text-primary/80" />
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Suggested Resources:</h4>
                      <p>{module.suggestedResources}</p>
                    </div>
                  </div>
                  
                  {(onGenerateModuleContent || hasSectionsData || isLoadingDetails || hasErrorDetails) && (
                    <div className="mt-6 pt-6 border-t border-border/70">
                      <Button 
                        variant={detailButtonVariant} 
                        onClick={() => handleToggleOrGenerateDetails(index, module)}
                        className={`w-full justify-start text-md font-semibold mb-3 pl-1 hover:bg-accent/10 text-left h-auto py-2.5 rounded-md ${detailButtonVariant === 'ghost' ? 'hover:text-primary' : ''}`}
                        disabled={detailButtonDisabled}
                      >
                        <div className="flex items-center">
                          {detailButtonIcon}
                          <span>{detailButtonText}</span>
                        </div>
                      </Button>
                      
                      {isDetailedViewOpen && (
                        <div className="pl-1 space-y-6 mt-4">
                          {isLoadingDetails && (
                            <div className="flex items-center space-x-3 text-muted-foreground py-4 text-base">
                              <Spinner className="h-6 w-6" /><p>Generating detailed content...</p>
                            </div>
                          )}
                          {hasErrorDetails && !isLoadingDetails && (
                            <Alert variant="destructive" className="mt-2 shadow rounded-lg">
                              <AlertCircleIcon className="h-5 w-5" />
                              <AlertTitle className="text-lg">Error Generating Content</AlertTitle>
                              <AlertDescription className="text-base mt-0.5">{currentDetailedContentState?.error}</AlertDescription>
                            </Alert>
                          )}
                          {hasSectionsData && !isLoadingDetails && !hasErrorDetails && currentDetailedContentState?.sections && (
                            <div className="space-y-5 mt-1">
                              {currentDetailedContentState.sections.map((section, secIdx) => (
                                <Card key={secIdx} className="shadow-lg bg-muted/40 border-border rounded-xl overflow-hidden transition-shadow hover:shadow-md">
                                  <CardHeader className="pb-3 pt-5 px-5 bg-muted/60 border-b border-border">
                                    <CardTitle className="text-xl font-semibold text-foreground leading-tight">{section.sectionTitle}</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-5 space-y-3">
                                    {section.recommendedYoutubeVideoQuery && (
                                      <div className="mb-4 p-3 bg-background rounded-lg border border-border shadow-sm">
                                        <h5 className="font-medium mb-1.5 flex items-center text-md text-primary">
                                          <Youtube className="h-6 w-6 mr-2.5 text-red-600" />Watch & Learn:
                                        </h5>
                                        <a
                                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(section.recommendedYoutubeVideoQuery)}`}
                                          target="_blank" rel="noopener noreferrer"
                                          className="text-accent-foreground hover:text-primary hover:underline text-base transition-colors inline-flex items-center group"
                                        >
                                          {section.recommendedYoutubeVideoQuery}
                                          <ExternalLinkIcon className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                      </div>
                                    )}
                                    <div 
                                      className="prose prose-base max-w-none text-foreground dark:prose-invert 
                                                 prose-headings:text-foreground prose-headings:font-semibold prose-h2:text-xl prose-h3:text-lg
                                                 prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-accent-foreground
                                                 prose-ul:text-muted-foreground prose-li:marker:text-primary prose-blockquote:border-primary prose-blockquote:text-muted-foreground
                                                 prose-code:bg-muted/50 prose-code:text-foreground prose-code:p-1 prose-code:rounded-md prose-code:font-mono prose-code:text-sm"
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

                  <div className="mt-6 pt-6 border-t border-border/70">
                     <Button 
                        variant={quizButtonVariant}
                        asChild 
                        className={`w-full justify-start text-md font-semibold pl-1 h-auto py-2.5 rounded-md 
                                    ${quizButtonVariant === 'default' ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20' 
                                    : quizButtonVariant === 'outline' ? 'border-orange-500/50 text-orange-600 hover:bg-orange-500/10 hover:border-orange-500' 
                                    : 'hover:bg-primary/10'}`}
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
       <Card className="mt-12 shadow-xl rounded-xl border-t-4 border-accent bg-gradient-to-br from-card to-accent/5">
        <CardHeader className="items-center text-center">
          <CardTitle className="flex items-center text-2xl md:text-3xl font-bold">
            <Sparkles className="h-8 w-8 mr-3 text-accent" /> Keep Learning & Growing!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-lg text-muted-foreground px-6 md:px-10 pb-8">
          <p>
            This AI-generated path is your launchpad! Use the suggested resources and time estimates to start. 
            {onGenerateModuleContent && " Generate detailed content and video suggestions for each module to dive deeper."}
            Test your knowledge with quizzes to solidify understanding and mark modules complete.
            <br/><br/>
            Remember, learning is a personal journey. Adapt this plan to your pace, explore topics that capture your interest, and don't be afraid to go off-script. Your potential is limitless!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
