
'use server';
/**
 * @fileOverview Generates detailed content for a specific learning module,
 * broken down into sections, each with a recommended YouTube search query.
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

const ModuleSectionSchema = z.object({
  sectionTitle: z.string().describe('A concise title for this content section.'),
  sectionContent: z.string().describe('Detailed textual content for this section, formatted in Markdown.'),
  recommendedYoutubeVideoQuery: z.string().describe('A single, highly specific YouTube search query for a video that best covers this specific section\'s content.'),
});

const GenerateModuleContentOutputSchema = z.object({
  sections: z.array(ModuleSectionSchema).describe('An array of content sections for the module.'),
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
The content should be broken down into 2-4 logical sections. For each section:
1.  Provide a "sectionTitle".
2.  Provide "sectionContent": Explain key concepts clearly, provide illustrative examples where appropriate, outline important sub-topics, and structure the information logically for learning. This content should be formatted in Markdown. Imagine you are summarizing and synthesizing information typically found in high-quality educational videos, articles, and tutorials on this subject.
3.  Provide "recommendedYoutubeVideoQuery": Suggest one highly specific and effective YouTube video search query that a learner could use to find the single best video resource to understand the key concepts of *this specific section*. This query should be very targeted to the section's content.

Return the output as a JSON object with a single top-level key "sections", which is an array of these section objects.
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
