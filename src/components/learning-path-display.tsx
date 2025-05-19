"use client";

import type { GenerateLearningPathOutput, GenerateLearningPathInput } from "@/ai/flows/generate-learning-path"; // Assuming LearningModule is part of GenerateLearningPathOutput
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookMarked, NotebookText, Lightbulb, TimerIcon, CheckCircle2 } from "lucide-react";

type LearningPathDisplayProps = {
  path: GenerateLearningPathOutput;
};

// Helper to extract type from GenerateLearningPathOutput['modules']
type LearningModule = GenerateLearningPathOutput['modules'][number];


export function LearningPathDisplay({ path }: LearningPathDisplayProps) {
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
        {path.modules.map((module: LearningModule, index: number) => (
          <AccordionItem value={`module-${index}`} key={index} className="border bg-card rounded-lg shadow-md">
            <AccordionTrigger className="p-6 hover:no-underline">
              <div className="flex items-center text-left">
                <BookMarked className="h-6 w-6 mr-3 text-accent" />
                <span className="text-xl font-semibold">{module.title}</span>
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
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
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
            Remember to adapt the plan to your pace and dive deeper into topics that interest you most. Happy learning!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
