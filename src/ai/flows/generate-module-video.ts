import { ai } from '@/ai/genkit';
import { google } from 'googleapis';
import { z } from 'zod';

// Input schema for the flow
export const GenerateModuleVideoInput = z.object({
  moduleTitle: z.string(),
  moduleDescription: z.string(),
  learningGoal: z.string(),
  searchQuery: z.string().optional().describe('An optional, specific YouTube search query to use directly. If not provided, a query will be generated based on module title, description, and learning goal.'),
});

export type GenerateModuleVideoInput = z.infer<typeof GenerateModuleVideoInput>;

// Output schema for the flow
export const GenerateModuleVideoOutput = z.object({
  videoId: z.string(),
  videoTitle: z.string(),
  videoDescription: z.string(),
  videoUrl: z.string(),
});

export type GenerateModuleVideoOutput = z.infer<typeof GenerateModuleVideoOutput>;



// Initialize YouTube API
const youtube = google.youtube('v3');

const generateModuleVideoPrompt = ai.definePrompt({
  name: 'generateModuleVideoPrompt',
  input: { schema: GenerateModuleVideoInput },
  output: { schema: z.object({ searchQuery: z.string() }) },
  prompt: `Generate a specific and targeted YouTube educational video search query that teaches "{{{moduleTitle}}}".
Context:
- Learning Goal: {{{learningGoal}}}
- Module Description: {{{moduleDescription}}}

Focus on finding a comprehensive, well-explained video from reputable educational channels.
Return only the search query text, nothing else.`,
});

const generateModuleVideoFlow = ai.defineFlow(
  {
    name: 'generateModuleVideoFlow',
    inputSchema: GenerateModuleVideoInput,
    outputSchema: GenerateModuleVideoOutput,
  },
  async (input: GenerateModuleVideoInput) => {
    let finalSearchQuery: string;

    if (input.searchQuery) {
      finalSearchQuery = input.searchQuery;
    } else {
      // If no direct searchQuery is provided, generate one using the prompt.
      const promptInputForGeneration = {
        moduleTitle: input.moduleTitle,
        moduleDescription: input.moduleDescription,
        learningGoal: input.learningGoal,
      };
      const promptOutput = (await generateModuleVideoPrompt(promptInputForGeneration)).output;

      if (!promptOutput || !promptOutput.searchQuery) {
        throw new Error('Failed to generate YouTube search query based on module details.');
      }
      finalSearchQuery = promptOutput.searchQuery;
    }

    // Search YouTube using the finalSearchQuery
    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      q: finalSearchQuery, // Use the determined finalSearchQuery
      type: ['video'],
      maxResults: 1, // Get only the top result
      videoEmbeddable: 'true',
      relevanceLanguage: 'en',
      key: process.env.YOUTUBE_API_KEY,
    });

    if (!searchResponse.data.items?.length) {
      throw new Error('No suitable videos found on YouTube for the query: ' + finalSearchQuery);
    }

    // Get the best match (first result)
    const bestMatch = searchResponse.data.items[0];
    const videoId = bestMatch.id?.videoId;
    const videoTitle = bestMatch.snippet?.title;
    const videoDescription = bestMatch.snippet?.description;

    if (!videoId || !videoTitle || !videoDescription) {
      throw new Error('Invalid video data received from YouTube API');
    }

    // Return the video information
    return {
      videoId,
      videoTitle,
      videoDescription,
      videoUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }
);

export async function generateModuleVideo(
  input: GenerateModuleVideoInput
): Promise<GenerateModuleVideoOutput> {
  try {
    // Validate input
    const validatedInput = GenerateModuleVideoInput.parse(input);
    return generateModuleVideoFlow(validatedInput);
  } catch (error) {
    console.error('Error in generateModuleVideo:', error);
    // It's generally better to let the caller handle the error or rethrow a more specific error.
    // For now, rethrowing the original error.
    throw error;
  }
}