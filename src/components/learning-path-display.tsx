
"use client";

import type { GenerateLearningPathOutput as LearningPathData } from "@/ai/flows/generate-learning-path";
import type { GenerateModuleContentOutput, ModuleSectionSchema } from "@/ai/flows/generate-module-content";
import { generateQuiz, type GenerateQuizInput, type GenerateQuizOutput, type QuizQuestion } from "@/ai/flows/generate-quiz-flow"; // Added
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
import { BookMarked, NotebookText, Lightbulb, CheckCircle2, Sparkles, AlertCircleIcon, Youtube, ExternalLink as ExternalLinkIcon, ChevronDown, ChevronUp, HelpCircle, ListChecks } from "lucide-react"; // Added HelpCircle
import { useState } from "react";
import { useToast } from "@/hooks/use-toast"; // Added

type LearningModule = LearningPathData['modules'][number];

type SectionContent = ModuleSectionSchema;

type ModuleDetailedContentState = {
  isLoading: boolean;
  sections: SectionContent[] | null;
  error: string | null;
};

// State for a module's quiz
type ModuleQuizState = {
  isLoading: boolean;
  questions: QuizQuestion[] | null;
  error: string | null;
  isQuizVisible: boolean; // To toggle quiz display
};

type LearningPathDisplayProps = {
  path: LearningPathData;
  moduleContents?: { [moduleIndex: number]: ModuleDetailedContentState };
  onGenerateModuleContent?: (moduleIndex: number, moduleTitle: string, moduleDescription: string) => void;
  // Add props for quiz state if managed by parent, or manage internally
};

export function LearningPathDisplay({ path, moduleContents = {}, onGenerateModuleContent }: LearningPathDisplayProps) {
  const { toast } = useToast(); // Added
  const [detailedSectionOpen, setDetailedSectionOpen] = useState<{ [key: number]: boolean }>({});
  const [moduleQuizzes, setModuleQuizzes] = useState<{ [moduleIndex: number]: ModuleQuizState }>({});

  if (!path || !path.modules || path.modules.length === 0) {
    return (
      <Card className="mt-8 shadow-lg">
        <CardHeader><CardTitle>Learning Path</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">No learning path generated or modules are empty.</p></CardContent>
      </Card>
    );
  }

  const handleToggleOrGenerateDetails = (index: number, module: LearningModule) => {
    const currentDetailedState = moduleContents?.[index];
    const isLoadingDetails = !!currentDetailedState?.isLoading;
    const hasSections = !!currentDetailedState?.sections && currentDetailedState.sections.length > 0;
    const hasErrorDetails = !!currentDetailedState?.error;

    if (isLoadingDetails) return;

    if (hasSections || hasErrorDetails) {
      setDetailedSectionOpen(prev => ({ ...prev, [index]: !prev[index] }));
    } else if (onGenerateModuleContent) {
      onGenerateModuleContent(index, module.title, module.description);
      setDetailedSectionOpen(prev => ({ ...prev, [index]: true }));
    }
  };

  const handleTakeQuiz = async (moduleIndex: number, moduleTitle: string, moduleDescription: string) => {
    setModuleQuizzes(prev => ({
      ...prev,
      [moduleIndex]: { isLoading: true, questions: null, error: null, isQuizVisible: false }
    }));

    try {
      const quizInput: GenerateQuizInput = { moduleTitle, moduleDescription };
      const result = await generateQuiz(quizInput);
      setModuleQuizzes(prev => ({
        ...prev,
        [moduleIndex]: { isLoading: false, questions: result.questions, error: null, isQuizVisible: true }
      }));
      toast({ title: `Quiz for "${moduleTitle}"`, description: "Quiz questions loaded. Ready to test your knowledge!" });
    } catch (e) {
      console.error(`Error generating quiz for module ${moduleIndex}:`, e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while generating the quiz.";
      setModuleQuizzes(prev => ({
        ...prev,
        [moduleIndex]: { isLoading: false, questions: null, error: errorMessage, isQuizVisible: false }
      }));
      toast({
        title: `Error Generating Quiz for "${moduleTitle}"`,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };


  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-6 text-center text-primary">
        Path Modules
      </h2>
      <Accordion type="single" collapsible defaultValue={`module-0`} className="w-full space-y-6">
        {path.modules.map((module: LearningModule, index: number) => {
          const currentDetailedContentState = moduleContents?.[index];
          const hasSections = !!currentDetailedContentState?.sections && currentDetailedContentState.sections.length > 0;
          const isLoadingDetails = !!currentDetailedContentState?.isLoading;
          const hasErrorDetails = !!currentDetailedContentState?.error;
          const isDetailedViewOpen = !!detailedSectionOpen[index];

          const currentQuizState = moduleQuizzes[index];

          let detailButtonIcon = <ChevronDown className="mr-2 h-5 w-5" />;
          let detailButtonText = "Detailed Content & Resources";
          let detailButtonDisabled = false;

          if (isLoadingDetails) {
            detailButtonIcon = <Spinner className="mr-2 h-5 w-5" />;
            detailButtonText = "Generating Details...";
            detailButtonDisabled = true;
          } else if (hasSections) {
            detailButtonIcon = isDetailedViewOpen ? <ChevronUp className="mr-2 h-5 w-5" /> : <ChevronDown className="mr-2 h-5 w-5" />;
            detailButtonText = isDetailedViewOpen ? "Hide Details" : "Show Details";
          } else if (onGenerateModuleContent && !hasErrorDetails) {
            detailButtonIcon = <Sparkles className="mr-2 h-5 w-5" />;
            detailButtonText = "Generate & Show Details";
          } else if (hasErrorDetails && onGenerateModuleContent) {
            detailButtonIcon = <AlertCircleIcon className="mr-2 h-5 w-5 text-destructive" />;
            detailButtonText = "Retry Generating Details";
          } else if (!onGenerateModuleContent && !hasSections && !hasErrorDetails) { // No handler and no content
            detailButtonIcon = <ChevronDown className="mr-2 h-5 w-5" />;
            detailButtonText = "Detailed Content Unavailable";
            detailButtonDisabled = true;
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
                  
                  {/* Detailed Content Section Toggle/Button */}
                  {(onGenerateModuleContent || hasSections || isLoadingDetails || hasErrorDetails) && (
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
                          {hasSections && !isLoadingDetails && !hasErrorDetails && currentDetailedContentState?.sections && (
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

                  {/* Quiz Section */}
                  <div className="mt-4 pt-4 border-t border-border">
                     <Button 
                        variant="outline" 
                        onClick={() => handleTakeQuiz(index, module.title, module.description)}
                        className="w-full justify-start text-md font-semibold mb-2 pl-0 hover:bg-accent/20 text-left h-auto py-2"
                        disabled={currentQuizState?.isLoading}
                      >
                        <div className="flex items-center">
                          {currentQuizState?.isLoading ? <Spinner className="mr-2 h-5 w-5" /> : <HelpCircle className="mr-2 h-5 w-5 text-primary" />}
                          <span>{currentQuizState?.isLoading ? 'Loading Quiz...' : 'Test Your Knowledge'}</span>
                        </div>
                      </Button>

                    {currentQuizState?.error && !currentQuizState.isLoading && (
                      <Alert variant="destructive" className="my-2">
                        <AlertCircleIcon className="h-4 w-4" />
                        <AlertTitle>Quiz Error</AlertTitle>
                        <AlertDescription>{currentQuizState.error}</AlertDescription>
                      </Alert>
                    )}

                    {currentQuizState?.isQuizVisible && currentQuizState.questions && !currentQuizState.isLoading && (
                      <Card className="mt-2 shadow-inner bg-primary/5">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <ListChecks className="mr-2 h-5 w-5"/> Quiz: {module.title}
                          </CardTitle>
                          <CardDescription>Answer the following questions. (Interactive quiz coming soon!)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {currentQuizState.questions.map((q, qIdx) => (
                            <div key={qIdx} className="text-sm p-3 border rounded-md bg-background">
                              <p className="font-medium mb-1">Question {qIdx + 1}: {q.questionText}</p>
                              <ul className="list-disc list-inside pl-2 space-y-0.5 text-muted-foreground">
                                {q.options.map((opt, oIdx) => (
                                  <li key={oIdx} className={oIdx === q.correctAnswerIndex ? 'font-semibold text-primary' : ''}>
                                    {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === q.correctAnswerIndex ? '(Correct)' : ''}
                                  </li>
                                ))}
                              </ul>
                              {q.explanation && <p className="text-xs mt-1 text-muted-foreground/80"><em>Explanation: {q.explanation}</em></p>}
                            </div>
                          ))}
                           <Button variant="outline" size="sm" onClick={() => setModuleQuizzes(prev => ({...prev, [index]: {...prev[index], isQuizVisible: false}}))} className="mt-3">
                            Close Quiz
                          </Button>
                        </CardContent>
                      </Card>
                    )}
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
            Test your knowledge with the quizzes for each module.
            <br/><br/>
            Remember, learning is a personal journey. Adapt this plan to your own pace, explore topics that capture your interest, and don't be afraid to go off-script. Happy learning!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
