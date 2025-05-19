'use server';

import {
  GenerateModuleVideoInputSchema,
  type GenerateModuleVideoInput,
  type GenerateModuleVideoOutput,
  generateModuleVideoFlowObject
} from './content-types';

export async function generateModuleVideo(
  input: GenerateModuleVideoInput
): Promise<GenerateModuleVideoOutput> {
  try {
    // Validate input using the imported schema
    const validatedInput = GenerateModuleVideoInputSchema.parse(input);
    // Call the imported flow object
    return generateModuleVideoFlowObject(validatedInput);
  } catch (error) {
    console.error('Error in generateModuleVideo:', error);
    // Rethrow the error for the caller to handle
    throw error;
  }
}