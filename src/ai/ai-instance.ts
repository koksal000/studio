
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      apiVersion: 'v1beta', // Specify v1beta for preview models
      defaultGenerationOptions: {
        maxOutputTokens: 8192, // This might need adjustment based on the new model's limits
        temperature: 0.4, 
        topP: 0.95,
        // Add thinkingConfig as per your cURL example
        thinkingConfig: {
          thinkingBudget: 24576,
        },
      },
    }),
  ],
  // Update to the desired preview model
  model: 'googleai/gemini-2.5-flash-preview-05-20', 
});
