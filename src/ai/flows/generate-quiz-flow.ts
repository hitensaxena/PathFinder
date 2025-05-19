
'use server';
/**
 * @fileOverview Generates a 10-question MCQ quiz for a learning module.
 *
 * - generateQuiz - A function that generates a quiz.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 * - QuizQuestion - The type for a single quiz question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Removed export from schema definition
const QuizQuestionSchema = z.object({
  questionText: z.string().describe('The text of the multiple-choice question.'),
  options: z.array(z.string()).length(4).describe('An array of 4 answer options.'),
  correctAnswerIndex: z.number().min(0).max(3).describe('The 0-based index of the correct answer in the options array.'),
  explanation: z.string().optional().describe('A brief explanation for why the correct answer is right, or context for the question.'),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// Removed export from schema definition
const GenerateQuizInputSchema = z.object({
  moduleTitle: z.string().describe('The title of the learning module for which to generate a quiz.'),
  moduleDescription: z.string().describe('The description of the learning module, providing context for quiz questions.'),
  // We could also pass detailed section content here if available and preferred for quiz context
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// Removed export from schema definition
const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).length(10).describe('An array of 10 multiple-choice questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an expert quiz creator. Based on the provided module title and description, generate a challenging 10-question multiple-choice quiz to test understanding of the key concepts.

Module Title: {{{moduleTitle}}}
Module Description: {{{moduleDescription}}}

For each question:
1.  Provide "questionText": The clear and concise question.
2.  Provide "options": An array of 4 plausible answer options. Ensure one is clearly correct and others are distractors.
3.  Provide "correctAnswerIndex": The 0-based index of the correct option.
4.  Provide "explanation" (optional but recommended): A brief explanation for the correct answer or context about the question.

Ensure all 10 questions are unique and cover different aspects of the module content.
Return the output as a JSON object with a single top-level key "questions", which is an array of these 10 question objects.
The options array must contain exactly 4 string elements.
The correctAnswerIndex must be between 0 and 3 inclusive.
  `,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate quiz: No output from AI model.');
    }
    // Additional validation if needed, though Zod handles schema.
    if (output.questions.length !== 10) {
        throw new Error(`Quiz generation failed: Expected 10 questions, got ${output.questions.length}`);
    }
    output.questions.forEach((q, index) => {
        if (q.options.length !== 4) {
            throw new Error(`Quiz generation failed for question ${index + 1}: Expected 4 options, got ${q.options.length}`);
        }
        if (q.correctAnswerIndex < 0 || q.correctAnswerIndex > 3) {
            throw new Error(`Quiz generation failed for question ${index + 1}: correctAnswerIndex ${q.correctAnswerIndex} is out of bounds.`);
        }
    });
    return output;
  }
);

