
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      // Increase the maximum number of output tokens to reduce truncation.
      // Note: Higher values might increase latency and cost. Adjust as needed.
      // The exact maximum depends on the model version.
      // Gemini 1.5 Flash supports up to 8192 output tokens.
      // Gemini 2.0 Flash might have different limits, but 8192 is a good target.
      defaultGenerationOptions: {
        maxOutputTokens: 8192,
        topP: 1,
      },
    }),
  ],
  model: 'googleai/gemini-2.0-flash', // Updated to gemini-2.0-flash
});
