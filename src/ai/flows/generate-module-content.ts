
'use server';
/**
 * @fileOverview Generates detailed content for a specific learning module, including a recommended YouTube search query.
 *
 * - generateModuleContent - A function that generates detailed content for a module.
 * - GenerateModuleContentInput - The input type for the generateModuleContent function.
 * - GenerateModuleContentOutput - The return type for the generateModuleContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateModuleContentInputSchema = z.object({
  moduleTitle: z.string().describe('The title of the learning module.'),
  moduleDescription: z.string().describe('The brief description of the learning module.'),
  learningGoal: z.string().describe('The overall learning goal for the entire learning path for context.'),
});
export type GenerateModuleContentInput = z.infer<typeof GenerateModuleContentInputSchema>;

const GenerateModuleContentOutputSchema = z.object({
  detailedContent: z.string().describe('Detailed content for the module, including key concepts, explanations, examples, and potentially relevant topics. This content should be formatted in markdown.'),
  recommendedYoutubeVideoQuery: z.string().describe('A single, highly specific YouTube search query that would best lead to a comprehensive video covering the module content.'),
});
export type GenerateModuleContentOutput = z.infer<typeof GenerateModuleContentOutputSchema>;

export async function generateModuleContent(input: GenerateModuleContentInput): Promise<GenerateModuleContentOutput> {
  return generateModuleContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateModuleContentPrompt',
  input: {schema: GenerateModuleContentInputSchema},
  output: {schema: GenerateModuleContentOutputSchema},
  prompt: `You are an expert instructional designer. Your task is to generate detailed learning content for a specific module within a larger learning path.

Overall Learning Goal: {{{learningGoal}}}

Module Title: {{{moduleTitle}}}
Module Description: {{{moduleDescription}}}

Based on the module title, description, and the overall learning goal, please generate comprehensive content for this module.
The content should:
1.  Explain key concepts clearly.
2.  Provide illustrative examples where appropriate.
3.  Outline important sub-topics or areas to focus on.
4.  Structure the information logically for learning.
5.  Imagine you are summarizing and synthesizing information typically found in high-quality educational videos, articles, and tutorials on this subject.
6.  The output should be formatted in Markdown.

Additionally, suggest one highly specific and effective YouTube video search query that a learner could use to find the single best video resource to understand the key concepts of this module. This query should be very targeted.

Generate the detailed content for the "detailedContent" field.
Return the single YouTube search query in the "recommendedYoutubeVideoQuery" field as a string.
  `,
});

const generateModuleContentFlow = ai.defineFlow(
  {
    name: 'generateModuleContentFlow',
    inputSchema: GenerateModuleContentInputSchema,
    outputSchema: GenerateModuleContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

