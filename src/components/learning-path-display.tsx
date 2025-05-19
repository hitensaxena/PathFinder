
"use client";

import type { GenerateLearningPathOutput } from "@/ai/flows/generate-learning-path";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookMarked, NotebookText, Lightbulb, TimerIcon, CheckCircle2, Sparkles, AlertCircleIcon, Youtube } from "lucide-react";

type LearningModule = GenerateLearningPathOutput['modules'][number];

type ModuleContentState = {
  isLoading: boolean;
  content: string | null;
  youtubeSearchQueries: string[] | null;
  error: string | null;
};

type LearningPathDisplayProps = {
  path: GenerateLearningPathOutput;
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
    <div className="mt-6"> {/* Reduced top margin from mt-12 to mt-6 */}
      <h2 className="text-2xl font-semibold mb-4 text-center text-primary"> {/* Reduced font size and margin */}
        Path Modules
      </h2>
      <Accordion type="single" collapsible defaultValue={`module-0`} className="w-full space-y-4">
        {path.modules.map((module: LearningModule, index: number) => {
          const currentModuleContent = moduleContents[index];
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

                  {/* Detailed Content Section */}
                  {(onGenerateModuleContent || (currentModuleContent && (currentModuleContent.content || currentModuleContent.error || currentModuleContent.youtubeSearchQueries))) && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2 text-lg">Detailed Content & Resources:</h4>
                      
                      {currentModuleContent?.isLoading && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Spinner className="h-5 w-5" />
                          <span>Generating content...</span>
                        </div>
                      )}

                      {currentModuleContent?.error && !currentModuleContent.isLoading && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircleIcon className="h-4 w-4" />
                          <AlertTitle>Error Generating Content</AlertTitle>
                          <AlertDescription>{currentModuleContent.error}</AlertDescription>
                        </Alert>
                      )}
                      
                      {/* YouTube Video Suggestions - Displayed First */}
                      {currentModuleContent?.youtubeSearchQueries && currentModuleContent.youtubeSearchQueries.length > 0 && !currentModuleContent.isLoading && (
                        <div className="mb-4"> {/* Added margin-bottom */}
                          <h5 className="font-medium mb-2 flex items-center text-md"> {/* Adjusted margin and text size */}
                            <Youtube className="h-5 w-5 mr-2 text-red-600" />
                            Suggested Video Searches:
                          </h5>
                          <ul className="list-disc list-inside space-y-1 pl-1">
                            {currentModuleContent.youtubeSearchQueries.map((query, qIndex) => (
                              <li key={qIndex} className="text-sm">
                                <a
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline hover:text-accent transition-colors inline-flex items-center group"
                                >
                                  {query}
                                  <ExternalLink className="ml-1 h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Detailed Textual Content - Displayed Second */}
                      {currentModuleContent?.content && !currentModuleContent.isLoading && (
                        <div 
                          className="prose prose-sm max-w-none text-foreground dark:prose-invert" 
                          dangerouslySetInnerHTML={{ __html: currentModuleContent.content }} // Render raw HTML/Markdown
                        />
                      )}

                      {/* Button to generate content */}
                      {onGenerateModuleContent && !currentModuleContent?.isLoading && (!currentModuleContent?.content && !currentModuleContent?.youtubeSearchQueries) && !currentModuleContent?.error && (
                        <Button 
                          onClick={() => onGenerateModuleContent(index, module.title, module.description)}
                          variant="outline"
                          size="sm"
                          className="mt-3" // Adjusted margin
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Detailed Content & Video Suggestions
                        </Button>
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
            {onGenerateModuleContent && " Generate detailed content and video suggestions for each module to get a deeper understanding."}
            Remember to adapt the plan to your pace and dive deeper into topics that interest you most. Happy learning!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple ExternalLink icon component
function ExternalLink(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

