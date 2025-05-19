
'use server';
/**
 * @fileOverview A simple flow to test API connectivity.
 *
 * - testApiConnection - A function that sends a simple message and expects a reply.
 * - TestApiInput - The input type for the testApiConnection function.
 * - TestApiOutput - The return type for the testApiConnection function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const TestApiInputSchema = z.object({
  message: z.string().describe('The message to send to the AI.'),
});
export type TestApiInput = z.infer<typeof TestApiInputSchema>;

const TestApiOutputSchema = z.object({
  reply: z.string().describe('The AI model\'s reply.'),
});
export type TestApiOutput = z.infer<typeof TestApiOutputSchema>;

export async function testApiConnection(input: TestApiInput): Promise<TestApiOutput> {
  return testApiConnectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'testApiPrompt',
  input: {schema: TestApiInputSchema},
  output: {schema: TestApiOutputSchema},
  prompt: `You are a helpful assistant. Respond to the following message very briefly:
Message: {{{message}}}

Reply:`,
});

const testApiConnectionFlow = ai.defineFlow(
  {
    name: 'testApiConnectionFlow',
    inputSchema: TestApiInputSchema,
    outputSchema: TestApiOutputSchema,
  },
  async (input) => {
    console.log('[testApiConnectionFlow] Sending test message:', input.message);
    const {output} = await prompt(input);
    if (!output || !output.reply) { // Check if output or output.reply is null/undefined/empty
      console.error('[testApiConnectionFlow] Model returned null, undefined, or empty reply.');
      // Return a specific error structure or throw, consistent with how other flows handle this
      return { reply: "<!-- ERROR: AI_MODEL_RETURNED_NULL_OR_EMPTY_FOR_TEST -->" };
    }
    console.log('[testApiConnectionFlow] Received reply:', output.reply);
    return output;
  }
);
