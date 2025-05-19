/**
 * @fileOverview Defines shared Zod schemas and TypeScript types for AI flow inputs and outputs,
 * particularly for module content generation. This file helps to decouple type definitions
 * from server-action-specific files, avoiding Next.js build errors related to non-async exports
 * from 'use server' modules.
 */

import { z } from 'genkit';

// Schema and type for individual sections within a module's detailed content
export const ModuleSectionSchema = z.object({
  sectionTitle: z.string().describe('A concise title for this content section.'),
  sectionContent: z.string().describe('Detailed textual content for this section, formatted in Markdown.'),
  recommendedYoutubeVideoQuery: z.string().describe('A single, highly specific YouTube search query for a video that best covers this specific section\'s content.'),
});
export type ModuleSection = z.infer<typeof ModuleSectionSchema>;

// Schema and type for the input of the module content generation flow
export const GenerateModuleContentInputSchema = z.object({
  moduleTitle: z.string().describe('The title of the learning module.'),
  moduleDescription: z.string().describe('The brief description of the learning module.'),
  learningGoal: z.string().describe('The overall learning goal for the entire learning path for context.'),
});
export type GenerateModuleContentInput = z.infer<typeof GenerateModuleContentInputSchema>;

// Schema and type for the output of the module content generation flow
export const GenerateModuleContentOutputSchema = z.object({
  sections: z.array(ModuleSectionSchema).describe('An array of content sections for the module.'),
});
export type GenerateModuleContentOutput = z.infer<typeof GenerateModuleContentOutputSchema>;

// Moved from generate-module-content.ts to avoid 'use server' issues with non-async top-level objects
import { ai } from '@/ai/genkit';

export const generateModuleContentPromptObject = ai.definePrompt({
  name: 'generateModuleContentPrompt',
  input: {schema: GenerateModuleContentInputSchema},
  output: {schema: GenerateModuleContentOutputSchema},
  prompt: `You are an expert instructional designer. Your task is to generate detailed learning content for a specific module within a larger learning path.

Overall Learning Goal: {{{learningGoal}}}

Module Title: {{{moduleTitle}}}
Module Description: {{{moduleDescription}}}

Based on the module title, description, and the overall learning goal, please generate comprehensive content for this module.
The content should be broken down into 2-4 logical sections. For each section:
1.  Provide a "sectionTitle".
2.  Provide "sectionContent": Explain key concepts clearly, provide illustrative examples where appropriate, outline important sub-topics, and structure the information logically for learning. This content should be formatted in Markdown. Imagine you are summarizing and synthesizing information typically found in high-quality educational videos, articles, and tutorials on this subject.
3.  Provide "recommendedYoutubeVideoQuery": Suggest one highly specific and effective YouTube video search query that a learner could use to find the single best video resource to understand the key concepts of *this specific section*. This query should be very targeted to the section's content.

Return the output as a JSON object with a single top-level key "sections", which is an array of these section objects.
  `,
});

export const generateModuleContentFlowObject = ai.defineFlow(
  {
    name: 'generateModuleContentFlow',
    inputSchema: GenerateModuleContentInputSchema,
    outputSchema: GenerateModuleContentOutputSchema,
  },
  async (input: GenerateModuleContentInput) => {
    const {output} = await generateModuleContentPromptObject(input);
    return output!;
  }
);

// Schemas, types, and Genkit objects for Module Video Generation
// Moved from generate-module-video.ts
import { z } from 'zod'; // Assuming zod is already imported or use genkit's z if preferred and available

export const GenerateModuleVideoInputSchema = z.object({
  moduleTitle: z.string(),
  moduleDescription: z.string(),
  learningGoal: z.string(),
  searchQuery: z.string().optional().describe('An optional, specific YouTube search query to use directly. If not provided, a query will be generated based on module title, description, and learning goal.'),
});
export type GenerateModuleVideoInput = z.infer<typeof GenerateModuleVideoInputSchema>;

export const GenerateModuleVideoOutputSchema = z.object({
  videoId: z.string(),
  videoTitle: z.string(),
  videoDescription: z.string(),
  videoUrl: z.string(),
});
export type GenerateModuleVideoOutput = z.infer<typeof GenerateModuleVideoOutputSchema>;

export const generateModuleVideoPromptObject = ai.definePrompt({
  name: 'generateModuleVideoPrompt',
  input: { schema: GenerateModuleVideoInputSchema },
  output: { schema: z.object({ searchQuery: z.string() }) },
  prompt: `Generate a specific and targeted YouTube educational video search query that teaches "{{{moduleTitle}}}".
Context:
- Learning Goal: {{{learningGoal}}}
- Module Description: {{{moduleDescription}}}

Focus on finding a comprehensive, well-explained video from reputable educational channels.
Return only the search query text, nothing else.`,
});

export const generateModuleVideoFlowObject = ai.defineFlow(
  {
    name: 'generateModuleVideoFlow',
    inputSchema: GenerateModuleVideoInputSchema,
    outputSchema: GenerateModuleVideoOutputSchema,
  },
  async (input: GenerateModuleVideoInput) => {
    let finalSearchQuery: string;
    if (input.searchQuery) {
      finalSearchQuery = input.searchQuery;
    } else {
      const promptInputForGeneration = {
        moduleTitle: input.moduleTitle,
        moduleDescription: input.moduleDescription,
        learningGoal: input.learningGoal,
        // searchQuery is not passed to the prompt that generates the query
      };
      const promptOutput = (await generateModuleVideoPromptObject(promptInputForGeneration)).output;
      if (!promptOutput || !promptOutput.searchQuery) {
        throw new Error('Failed to generate YouTube search query based on module details.');
      }
      finalSearchQuery = promptOutput.searchQuery;
    }

    // This part requires googleapis which is a server-side dependency.
    // If this flow is intended to run client-side, this needs rethinking.
    // Assuming this runs server-side as part of a server action context.
    const { google } = await import('googleapis');
    const youtube = google.youtube('v3');
    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      q: finalSearchQuery,
      type: ['video'],
      maxResults: 1,
      videoEmbeddable: 'true',
      relevanceLanguage: 'en',
      key: process.env.YOUTUBE_API_KEY,
    });

    if (!searchResponse.data.items?.length) {
      throw new Error('No suitable videos found on YouTube for the query: ' + finalSearchQuery);
    }

    const bestMatch = searchResponse.data.items[0];
    const videoId = bestMatch.id?.videoId;
    const videoTitle = bestMatch.snippet?.title;
    const videoDescription = bestMatch.snippet?.description;

    if (!videoId || !videoTitle || !videoDescription) {
      throw new Error('Invalid video data received from YouTube API');
    }

    return {
      videoId,
      videoTitle,
      videoDescription,
      videoUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }
);