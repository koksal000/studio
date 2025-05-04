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
  prompt: z.string().describe('The prompt describing the desired refactoring changes.'),
});
export type RefactorCodeInput = z.infer<typeof RefactorCodeInputSchema>;

const RefactorCodeOutputSchema = z.object({
  refactoredCode: z.string().describe('The comprehensively refactored code.'),
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
      prompt: z.string().describe('The prompt describing the desired refactoring changes.'),
    }),
  },
  output: {
    schema: z.object({
      refactoredCode: z.string().describe('The comprehensively refactored code.'),
    }),
  },
  prompt: `You are an expert code refactoring agent.

You will be given code and a prompt describing how to refactor the code. Apply the requested changes comprehensively throughout the code, ensuring consistency and maintaining functionality unless the prompt specifies otherwise.

**IMPORTANT:** Output *only* the fully refactored code. The output MUST contain the entire, complete, and un-truncated refactored code. Partial output is not acceptable.

Original Code:
\`\`\`html
{{{code}}}
\`\`\`

Refactoring Prompt:
{{{prompt}}}

Refactored Code:
\`\`\`html
{{refactoredCode}}
\`\`\``,
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

     // Clean up potential markdown backticks from the output
     let refactoredHtml = output?.refactoredCode || '';
     if (refactoredHtml.startsWith('```html')) {
       refactoredHtml = refactoredHtml.substring(7);
     }
     if (refactoredHtml.endsWith('```')) {
       refactoredHtml = refactoredHtml.substring(0, refactoredHtml.length - 3);
     }

    return { refactoredCode: refactoredHtml.trim() };
  }
);
