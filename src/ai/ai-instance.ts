
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      defaultGenerationOptions: {
        maxOutputTokens: 8192, 
        topP: 0.95, 
      },
    }),
  ],
  model: 'googleai/gemini-2.0-flash-exp',
});
