
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
import {
  GenerateModuleContentInputSchema,
  type GenerateModuleContentInput,
  GenerateModuleContentOutputSchema,
  type GenerateModuleContentOutput
} from './content-types';

import { generateModuleContentFlowObject } from './content-types';

export async function generateModuleContent(
  input: GenerateModuleContentInput
): Promise<GenerateModuleContentOutput> {
  return generateModuleContentFlowObject(input);
}
