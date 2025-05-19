
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
import { BookMarked, NotebookText, Lightbulb, TimerIcon, CheckCircle2, Sparkles, AlertCircleIcon } from "lucide-react";

type LearningModule = GenerateLearningPathOutput['modules'][number];

type ModuleContentState = {
  isLoading: boolean;
  content: string | null;
  error: string | null;
};

type LearningPathDisplayProps = {
  path: GenerateLearningPathOutput;
  moduleContents?: { [moduleIndex: number]: ModuleContentState }; // Optional
  onGenerateModuleContent?: (moduleIndex: number, moduleTitle: string, moduleDescription: string) => void; // Optional
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
    <div className="mt-12">
      <h2 className="text-3xl font-semibold mb-6 text-center text-primary">
        Your Personalized Learning Path
      </h2>
      <Accordion type="single" collapsible defaultValue={`module-0`} className="w-full space-y-4">
        {path.modules.map((module: LearningModule, index: number) => {
          const currentModuleContent = moduleContents[index]; // Safe due to default prop value
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

                  {/* Conditionally render detailed content section if onGenerateModuleContent is provided */}
                  {onGenerateModuleContent && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2 text-lg">Detailed Content:</h4>
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
                      {currentModuleContent?.content && !currentModuleContent.isLoading && (
                        <div 
                          className="prose prose-sm max-w-none text-foreground dark:prose-invert" 
                          dangerouslySetInnerHTML={{ __html: currentModuleContent.content.replace(/\n/g, '<br />') }} // Basic markdown newline handling
                        />
                      )}
                      {!currentModuleContent?.content && !currentModuleContent?.isLoading && !currentModuleContent?.error && (
                        <Button 
                          onClick={() => onGenerateModuleContent(index, module.title, module.description)}
                          variant="outline"
                          size="sm"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Detailed Content
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
            {onGenerateModuleContent && " Generate detailed content for each module to get a deeper understanding."}
            Remember to adapt the plan to your pace and dive deeper into topics that interest you most. Happy learning!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
