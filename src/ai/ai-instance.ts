
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      // Reverted to the generation options that were used with gemini-2.0-flash-exp
      defaultGenerationOptions: {
        maxOutputTokens: 8192,
        temperature: 0.4,
        topP: 0.95,
      },
    }),
  ],
  // Attempting to use the desired model with the simpler configuration
  model: 'googleai/gemini-2.5-flash-preview-05-20',
});

