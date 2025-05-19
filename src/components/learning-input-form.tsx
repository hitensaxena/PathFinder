"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { GenerateLearningPathInput } from "@/ai/flows/generate-learning-path";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, GraduationCap, ListChecks, Hourglass, Send } from "lucide-react";

const formSchema = z.object({
  learningGoal: z.string().min(10, {
    message: "Learning goal must be at least 10 characters.",
  }),
  currentKnowledgeLevel: z.enum(["Beginner", "Intermediate", "Advanced"], {
    required_error: "Please select your current knowledge level.",
  }),
  preferredLearningStyle: z.enum(["Videos", "Articles", "Interactive Exercises"], {
    required_error: "Please select your preferred learning style.",
  }),
  weeklyTimeCommitment: z.coerce
    .number()
    .min(1, { message: "Weekly time commitment must be at least 1 hour." })
    .max(100, { message: "Weekly time commitment cannot exceed 100 hours." }),
});

type LearningInputFormProps = {
  onSubmit: (data: GenerateLearningPathInput) => void;
  isLoading: boolean;
};

export function LearningInputForm({ onSubmit, isLoading }: LearningInputFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      learningGoal: "",
      weeklyTimeCommitment: 5,
    },
  });

  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values);
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Brain className="mr-2 h-6 w-6 text-primary" />
          Tell Us About Your Learning Needs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="learningGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Brain className="mr-2 h-4 w-4 text-muted-foreground" />
                    Learning Goal
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Learn Python for data analysis" {...field} />
                  </FormControl>
                  <FormDescription>
                    What do you want to learn? Be specific for better results.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentKnowledgeLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground" />
                    Current Knowledge Level
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your knowledge level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner (little to no prior knowledge)</SelectItem>
                      <SelectItem value="Intermediate">Intermediate (some foundational knowledge)</SelectItem>
                      <SelectItem value="Advanced">Advanced (significant experience, looking to fill gaps)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredLearningStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <ListChecks className="mr-2 h-4 w-4 text-muted-foreground" />
                    Preferred Learning Style
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your preferred learning style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Videos">Mainly Videos</SelectItem>
                      <SelectItem value="Articles">Mainly Articles</SelectItem>
                      <SelectItem value="Interactive Exercises">Mainly Interactive Exercises</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weeklyTimeCommitment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Hourglass className="mr-2 h-4 w-4 text-muted-foreground" />
                    Weekly Time Commitment (hours)
                  </FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5" {...field} />
                  </FormControl>
                  <FormDescription>
                    How many hours per week can you dedicate?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                "Generating Plan..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Generate Plan
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
