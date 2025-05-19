
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      defaultGenerationOptions: {
        maxOutputTokens: 8192, // Kept high for potentially long outputs
        topP: 0.95, // Standard Top P
      },
    }),
  ],
  model: 'googleai/gemini-2.0-flash-exp', // Reverted to gemini-2.0-flash-exp
});
