import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      // Increase the maximum number of output tokens to reduce truncation.
      // Note: Higher values might increase latency and cost. Adjust as needed.
      // The exact maximum depends on the model version, but setting it high helps.
      // Gemini 1.5 Flash supports up to 8192 output tokens.
      // Gemini 2.0 Flash experimental might have different limits. Let's use 8192 as a target.
      defaultGenerationOptions: {
        maxOutputTokens: 8192,
        topP: 1, // Added topP based on cURL example
      },
    }),
  ],
  model: 'googleai/gemini-2.5-pro-preview-05-06', // Updated model
});
