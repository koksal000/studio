
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      defaultGenerationOptions: {
        maxOutputTokens: 8192,
        temperature: 0.4, // Restored from a previous stable configuration
        topP: 0.95,
      },
    }),
  ],
  model: 'googleai/gemini-1.5-flash-latest', // Reverted to a known stable model
});
