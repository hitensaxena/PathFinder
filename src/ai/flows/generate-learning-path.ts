'use server';
/**
 * @fileOverview Generates a personalized learning path based on user inputs.
 *
 * - generateLearningPath - A function that generates a learning path.
 * - GenerateLearningPathInput - The input type for the generateLearningPath function.
 * - GenerateLearningPathOutput - The return type for the generateLearningPath function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLearningPathInputSchema = z.object({
  learningGoal: z.string().describe('The user\'s learning goal (e.g., \'Learn Python for data analysis\').'),
  currentKnowledgeLevel: z
    .enum(['Beginner', 'Intermediate', 'Advanced'])
    .describe('The user\'s current knowledge level (Beginner, Intermediate, or Advanced).'),
  preferredLearningStyle: z
    .enum(['Videos', 'Articles', 'Interactive Exercises'])
    .describe('The user\'s preferred learning style (Videos, Articles, or Interactive Exercises).'),
  weeklyTimeCommitment: z
    .number()
    .describe('The number of hours per week the user can dedicate to learning.'),
});
export type GenerateLearningPathInput = z.infer<typeof GenerateLearningPathInputSchema>;

const LearningModuleSchema = z.object({
  title: z.string().describe('The title of the learning module.'),
  description: z.string().describe('A brief description of the module.'),
  suggestedResources: z.string().describe('Suggested learning resource types or search queries.'),
  estimatedTime: z.string().describe('Estimated time to complete the module (e.g., \'5 hours\').'),
});

const GenerateLearningPathOutputSchema = z.object({
  modules: z.array(LearningModuleSchema).describe('An array of learning modules in the learning path.'),
});

export type GenerateLearningPathOutput = z.infer<typeof GenerateLearningPathOutputSchema>;

export async function generateLearningPath(input: GenerateLearningPathInput): Promise<GenerateLearningPathOutput> {
  return generateLearningPathFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLearningPathPrompt',
  input: {schema: GenerateLearningPathInputSchema},
  output: {schema: GenerateLearningPathOutputSchema},
  prompt: `You are an expert learning path generator. You will generate a personalized learning path based on the user's input.

  Learning Goal: {{{learningGoal}}}
  Current Knowledge Level: {{{currentKnowledgeLevel}}}
  Preferred Learning Style: {{{preferredLearningStyle}}}
  Weekly Time Commitment: {{{weeklyTimeCommitment}}} hours/week

  Break down the learning goal into a logical sequence of 3-5 high-level topics or modules suitable for the current knowledge level and weekly time commitment over an estimated 4-week timeframe.
  For each topic/module, suggest 1-2 types of learning resources or general search queries that align with the preferred learning style. For the MVP, do not attempt to find specific, live URLs.
  Provide a brief (1-2 sentence) description for each topic/module.
  Estimate the time to be spent on each topic/module based on the overall weekly commitment.

  Return the plan in a structured JSON format with "modules" as the main array. Each module should have the following fields:
  - title: The title of the learning module.
  - description: A brief description of the module.
  - suggestedResources: Suggested learning resource types or search queries.
  - estimatedTime: Estimated time to complete the module (e.g., \'5 hours\').
  `,
});

const generateLearningPathFlow = ai.defineFlow(
  {
    name: 'generateLearningPathFlow',
    inputSchema: GenerateLearningPathInputSchema,
    outputSchema: GenerateLearningPathOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
