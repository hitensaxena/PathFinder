
"use client";

import type { GenerateLearningPathOutput } from "@/ai/flows/generate-learning-path";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter, // Added for potential future use
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookMarked, NotebookText, Lightbulb, TimerIcon, CheckCircle2, Sparkles, AlertCircleIcon, Youtube } from "lucide-react";

type LearningModule = GenerateLearningPathOutput['modules'][number];

type ModuleContentState = {
  isLoading: boolean;
  content: string | null;
  recommendedYoutubeVideoQuery: string | null;
  error: string | null;
};

type LearningPathDisplayProps = {
  path: GenerateLearningPathOutput;
  moduleContents?: { [moduleIndex: number]: ModuleContentState };
  onGenerateModuleContent?: (moduleIndex: number, moduleTitle: string, moduleDescription: string) => void;
};

// Helper function to parse Markdown content into sections based on H2 headings
function parseMarkdownToSections(markdownContent: string | null): Array<{ title: string; bodyHtml: string }> {
  if (!markdownContent?.trim()) return [];

  const sections: Array<{ title: string; bodyHtml: string }> = [];
  // Split by lines that start with "## " (H2 heading)
  // The lookahead `(?=\n## )` ensures the delimiter `\n## ` is not consumed by the split
  // and can be used to identify the start of the next section correctly.
  // We first handle content that might appear before the first H2.
  const contentParts = markdownContent.split(/\n(?=## )/);

  for (let i = 0; i < contentParts.length; i++) {
    let part = contentParts[i].trim();
    if (!part) continue;

    if (part.startsWith("## ")) {
      // This part starts with an H2 heading
      const newlineIndex = part.indexOf('\n');
      let title: string;
      let body: string;

      if (newlineIndex !== -1) {
        title = part.substring(3, newlineIndex).trim(); // Extract text after "## " up to newline
        body = part.substring(newlineIndex + 1).trim(); // Content after the H2 heading line
      } else {
        // The H2 heading is the only line in this part
        title = part.substring(3).trim();
        body = "";
      }
      sections.push({ title, bodyHtml: body });
    } else {
      // This part does not start with an H2.
      // It's either content before the first H2, or the entire content if no H2s exist.
      sections.push({ title: "Overview", bodyHtml: part });
    }
  }
  
  return sections.filter(s => s.title || s.bodyHtml); // Remove any truly empty sections
}


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
          const currentModuleContent = moduleContents?.[index];
          const hasDetailedTextContent = !!currentModuleContent?.content;
          const hasYoutubeQuery = !!currentModuleContent?.recommendedYoutubeVideoQuery;
          const sections = hasDetailedTextContent ? parseMarkdownToSections(currentModuleContent.content) : [];

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
                  {(onGenerateModuleContent || hasDetailedTextContent || hasYoutubeQuery || currentModuleContent?.isLoading || currentModuleContent?.error) && (
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
                      
                      {/* YouTube Video Suggestion - Displayed First */}
                      {hasYoutubeQuery && !currentModuleContent?.isLoading && (
                        <div className="mb-4 p-4 border rounded-lg bg-secondary/30">
                          <h5 className="font-medium mb-2 flex items-center text-md">
                            <Youtube className="h-5 w-5 mr-2 text-red-600" />
                            Recommended Video Search:
                          </h5>
                          <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentModuleContent.recommendedYoutubeVideoQuery!)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline hover:text-accent transition-colors inline-flex items-center group"
                          >
                            {currentModuleContent.recommendedYoutubeVideoQuery}
                            <ExternalLink className="ml-1 h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                          </a>
                        </div>
                      )}

                      {/* Detailed Textual Content as Sections in Cards */}
                      {hasDetailedTextContent && sections.length > 0 && !currentModuleContent?.isLoading && (
                        <div className="space-y-4 mt-4">
                          {sections.map((section, secIdx) => (
                            <Card key={secIdx} className="shadow-sm">
                              <CardHeader>
                                <CardTitle className="text-lg">{section.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div 
                                  className="prose prose-sm max-w-none text-foreground dark:prose-invert" 
                                  dangerouslySetInnerHTML={{ __html: section.bodyHtml }} 
                                />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                      
                      {/* Button to generate content */}
                      {onGenerateModuleContent && !currentModuleContent?.isLoading && !hasDetailedTextContent && !hasYoutubeQuery && !currentModuleContent?.error && (
                        <Button 
                          onClick={() => onGenerateModuleContent(index, module.title, module.description)}
                          variant="outline"
                          size="sm"
                          className="mt-3"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Detailed Content & Video Suggestion
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
            {onGenerateModuleContent && " Generate detailed content and a video suggestion for each module to get a deeper understanding."}
            Remember to adapt the plan to your pace and dive deeper into topics that interest you most. Happy learning!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

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

    