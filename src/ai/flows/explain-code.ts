'use server';

/**
 * @fileOverview Explains the role of a given code snippet.
 *
 * - explainCode - A function that takes code as input and returns an explanation.
 * - ExplainCodeInput - The input type for the explainCode function.
 * - ExplainCodeOutput - The return type for the explainCode function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ExplainCodeInputSchema = z.object({
  code: z.string().describe('The code to be explained.'),
});
export type ExplainCodeInput = z.infer<typeof ExplainCodeInputSchema>;

const ExplainCodeOutputSchema = z.object({
  explanation: z.string().describe('The explanation of the code.'),
});
export type ExplainCodeOutput = z.infer<typeof ExplainCodeOutputSchema>;

export async function explainCode(input: ExplainCodeInput): Promise<ExplainCodeOutput> {
  return explainCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainCodePrompt',
  input: {
    schema: z.object({
      code: z.string().describe('The code to be explained.'),
    }),
  },
  output: {
    schema: z.object({
      explanation: z.string().describe('The explanation of the code.'),
    }),
  },
  prompt: `You are an expert code explainer. Explain the following code:

```
{{{code}}}
```

Explanation:`,
});

const explainCodeFlow = ai.defineFlow<
  typeof ExplainCodeInputSchema,
  typeof ExplainCodeOutputSchema
>(
  {
    name: 'explainCodeFlow',
    inputSchema: ExplainCodeInputSchema,
    outputSchema: ExplainCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
