'use server';

/**
 * @fileOverview A code refactoring AI agent.
 *
 * - refactorCode - A function that handles the code refactoring process.
 * - RefactorCodeInput - The input type for the refactorCode function.
 * - RefactorCodeOutput - The return type for the refactorCode function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const RefactorCodeInputSchema = z.object({
  code: z.string().describe('The code to be refactored.'),
  prompt: z.string().describe('The prompt for refactoring the code.'),
});
export type RefactorCodeInput = z.infer<typeof RefactorCodeInputSchema>;

const RefactorCodeOutputSchema = z.object({
  refactoredCode: z.string().describe('The refactored code.'),
});
export type RefactorCodeOutput = z.infer<typeof RefactorCodeOutputSchema>;

export async function refactorCode(input: RefactorCodeInput): Promise<RefactorCodeOutput> {
  return refactorCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refactorCodePrompt',
  input: {
    schema: z.object({
      code: z.string().describe('The code to be refactored.'),
      prompt: z.string().describe('The prompt for refactoring the code.'),
    }),
  },
  output: {
    schema: z.object({
      refactoredCode: z.string().describe('The refactored code.'),
    }),
  },
  prompt: `You are an expert code refactoring agent.

You will be given code and a prompt to refactor the code.

Code:
{{{code}}}

Prompt:
{{{prompt}}}

Refactored Code:`, 
});

const refactorCodeFlow = ai.defineFlow<
  typeof RefactorCodeInputSchema,
  typeof RefactorCodeOutputSchema
>(
  {
    name: 'refactorCodeFlow',
    inputSchema: RefactorCodeInputSchema,
    outputSchema: RefactorCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
