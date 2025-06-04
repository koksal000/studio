'use server';
/**
 * @fileOverview A Genkit flow to complete potentially truncated HTML code.
 *
 * - completeCode - Function to attempt to complete a given piece of HTML.
 * - CompleteCodeInput - Input type for completeCode.
 * - CompleteCodeOutput - Output type for completeCode.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {HUNDRED_RULES, ADVANCED_UI_UX_GUIDELINES} from './promptSnippets';

const CompleteCodeInputSchema = z.object({
  incompleteCode: z.string().describe('The HTML code snippet that is incomplete and needs continuation.'),
  originalUserPrompt: z.string().describe('The original user prompt or instruction that led to the incompleteCode. This provides context for the completion.'),
  instructionContext: z.string().describe('The specific instruction context (e.g., "initial generation", "refactoring", "enhancement") for logging purposes.'),
});
export type CompleteCodeInput = z.infer<typeof CompleteCodeInputSchema>;

const CompleteCodeOutputSchema = z.object({
  completedCodePortion: z.string().describe('The generated portion of the code that should complete the incompleteCode. This should ONLY be the *additional* code, not the entire thing rewritten.'),
  isLikelyCompleteNow: z.boolean().describe('A flag indicating if the AI believes the code is now fully complete with this addition.'),
});
export type CompleteCodeOutput = z.infer<typeof CompleteCodeOutputSchema>;

const allBlockNoneSafetySettings = [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
];

export async function completeCode(input: CompleteCodeInput): Promise<CompleteCodeOutput> {
  return completeCodeFlow(input);
}

const completeCodePrompt = ai.definePrompt({
  name: 'completeCodePrompt',
  input: {schema: CompleteCodeInputSchema},
  output: {schema: CompleteCodeOutputSchema},
  config: {
    safetySettings: allBlockNoneSafetySettings,
  },
  prompt: `You are an AI assistant highly specialized in completing TRUNCATED HTML code.
You will be given an INCOMPLETE HTML code snippet and the original user prompt that led to its generation.
Your SOLE TASK is to provide ONLY the *MISSING PORTION* of the HTML code to make it complete and valid.
DO NOT re-generate the entire HTML. Only provide the text that should be appended to the incomplete code.
Ensure the final combined code will be a valid, self-contained HTML document, respecting all original user intentions and the 100 Rules and Advanced UI/UX guidelines provided.

Original User Prompt (for context):
{{{originalUserPrompt}}}

Incomplete HTML Code (DO NOT REPEAT THIS IN YOUR OUTPUT, ONLY PROVIDE THE CONTINUATION):
\`\`\`html
{{{incompleteCode}}}
\`\`\`

Your Task:
1.  Analyze the \`incompleteCode\` to understand where it was cut off.
2.  Based on the \`originalUserPrompt\` and the provided rules, determine what HTML, CSS, or JavaScript is missing.
3.  Generate ONLY the code that needs to be appended to \`incompleteCode\` to make it whole.
4.  Indicate if you believe this appended portion makes the entire HTML document complete.
5.  Strictly adhere to the 100 Rules & Advanced UI/UX Guidelines:
    ${HUNDRED_RULES}
    ${ADVANCED_UI_UX_GUIDELINES}

Your JSON Response (ONLY THE JSON OBJECT):
{
  "completedCodePortion": "THE_MISSING_CODE_BLOCK_TO_APPEND_HERE",
  "isLikelyCompleteNow": true_or_false
}

If you cannot determine how to complete it or believe the original was not actually truncated in a way you can fix, return an empty string for "completedCodePortion" and set "isLikelyCompleteNow" to true (assuming the original was complete or unfixable by appending).
`,
});

const completeCodeFlow = ai.defineFlow(
  {
    name: 'completeCodeFlow',
    inputSchema: CompleteCodeInputSchema,
    outputSchema: CompleteCodeOutputSchema,
  },
  async (input: CompleteCodeInput): Promise<CompleteCodeOutput> => {
    console.log(`[completeCodeFlow] Attempting to complete code for context: "${input.instructionContext}". Original prompt: "${input.originalUserPrompt.substring(0, 100)}...", Incomplete code length: ${input.incompleteCode.length}`);
    try {
      const {output} = await completeCodePrompt(input);

      if (!output || typeof output.completedCodePortion !== 'string' || typeof output.isLikelyCompleteNow !== 'boolean') {
        console.error('[completeCodeFlow] CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_INVALID_STRUCTURE_FOR_COMPLETION. Output was:', output);
        // If structure is wrong, assume no valid completion and original might be "complete" or unfixable by this flow
        return {completedCodePortion: `<!-- CRITICAL_ERROR: AI_MODEL_RETURNED_INVALID_STRUCTURE_FOR_COMPLETION_ATTEMPT for context ${input.instructionContext}. -->`, isLikelyCompleteNow: true };
      }
      
      console.log(`[completeCodeFlow] Completion attempt successful for context: "${input.instructionContext}". Portion length: ${output.completedCodePortion.length}, Likely complete: ${output.isLikelyCompleteNow}`);
      return output;

    } catch (error: any) {
      let errorMessage = `Unknown error occurred during code completion flow for context ${input.instructionContext}.`;
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.stack) {
          console.error(`[completeCodeFlow] Error stack for context ${input.instructionContext}:`, error.stack);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) { /* ignore stringify error */ }
      }
      console.error(`[completeCodeFlow] Critical error in flow for context ${input.instructionContext}:`, errorMessage);
      return {completedCodePortion: `<!-- ERROR_DURING_COMPLETION_FLOW for context ${input.instructionContext}: ${errorMessage.replace(/-->/g, '--&gt;')} -->`, isLikelyCompleteNow: true};
    }
  }
);
