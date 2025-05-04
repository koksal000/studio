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

const MAX_CONTINUATION_ATTEMPTS = 3; // Maximum number of times to ask for continuation

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

// Define the initial refactoring prompt
const refactorCodePrompt = ai.definePrompt({
  name: 'refactorCodePrompt',
  input: {
    schema: z.object({
      code: z.string().describe('The code to be refactored.'),
      prompt: z.string().describe('The prompt describing the desired refactoring changes.'),
    }),
  },
  output: {
    schema: z.object({
      refactoredCode: z.string().describe('The comprehensively refactored code, must be a complete HTML document ending with </html>.'),
    }),
  },
  prompt: `You are an expert code refactoring agent.

You will be given code and a prompt describing how to refactor the code. Apply the requested changes comprehensively throughout the code, ensuring consistency and maintaining functionality unless the prompt specifies otherwise.

**IMPORTANT:** Output *only* the fully refactored code. The output MUST contain the entire, complete, and un-truncated refactored code, starting with \`<!DOCTYPE html>\` and ending with \`</html>\`. Partial output is not acceptable.

Original Code:
\`\`\`html
{{{code}}}
\`\`\`

Refactoring Prompt:
{{{prompt}}}

Refactored Code (Complete HTML, must end with </html>):
\`\`\`html
{{refactoredCode}}
\`\`\``,
});

// Define the continuation prompt for refactoring
const continueRefactorCodePrompt = ai.definePrompt({
  name: 'continueRefactorCodePrompt',
  input: {
    schema: z.object({
        originalCode: z.string().describe('The original code before refactoring.'),
        refactorPrompt: z.string().describe('The original refactoring prompt.'),
        partialRefactoredCode: z.string().describe('The incomplete refactored code generated so far.'),
    }),
  },
  output: {
    schema: z.object({
      continuation: z.string().describe('The rest of the refactored HTML code, starting exactly where the partial code left off.'),
    }),
  },
  prompt: `You are an expert code refactoring agent continuing the refactoring of a large HTML file. You were given the original code and a refactoring prompt. You started generating the refactored code, but it was incomplete (it did not end with \`</html>\`).

Original Code:
\`\`\`html
{{{originalCode}}}
\`\`\`

Refactoring Prompt:
{{{refactorPrompt}}}

Partially Refactored Code Generated So Far:
\`\`\`html
{{{partialRefactoredCode}}}
\`\`\`

**Your Task:** Continue generating the rest of the refactored HTML code EXACTLY from where the partial code stopped. Do NOT repeat any part of the partial code. Ensure the final combined code (partial code + your continuation) is a single, valid, and complete refactored HTML file ending with \`</html>\`, fully applying the refactoring prompt to the entire original code.

Continuation of Refactored Code (Starts immediately after the end of partial code, completes the HTML file ending with </html>):
\`\`\`html
{{continuation}}
\`\`\``,
});


// Helper function to check if HTML seems complete
function isHtmlComplete(code: string): boolean {
    const trimmedCode = code.trim();
    // Simple check: does it end with </html>? More robust checks could be added.
    return trimmedCode.endsWith('</html>');
}

// Helper function to clean up markdown backticks
function cleanupCode(code: string): string {
    let cleaned = code.trim();
    // Handle potential markdown code blocks
    if (cleaned.startsWith('```html')) {
      cleaned = cleaned.substring(7);
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
    }
     // Ensure final trim
    return cleaned.trim();
}


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
    let fullRefactoredCode = '';
    let attempts = 0;

    // Initial refactor attempt
    let response = await refactorCodePrompt(input);
    let generatedHtml = cleanupCode(response.output?.refactoredCode || '');
    fullRefactoredCode = generatedHtml;

    // Check for completion and attempt continuation if needed
    while (!isHtmlComplete(fullRefactoredCode) && attempts < MAX_CONTINUATION_ATTEMPTS) {
       attempts++;
       console.log(`Refactored code incomplete (attempt ${attempts}). Requesting continuation...`);

       try {
           const continuationResponse = await continueRefactorCodePrompt({
               originalCode: input.code,
               refactorPrompt: input.prompt,
               partialRefactoredCode: fullRefactoredCode, // Pass the code generated so far
           });
           const continuationHtml = cleanupCode(continuationResponse.output?.continuation || '');

           if (continuationHtml) {
               fullRefactoredCode += '\n' + continuationHtml; // Append the continuation with a newline
               console.log(`Appended refactor continuation (length: ${continuationHtml.length}). Total length: ${fullRefactoredCode.length}`);
           } else {
                console.warn(`Refactor continuation attempt ${attempts} returned empty code.`);
                break; // Avoid infinite loop
           }
       } catch (continuationError) {
           console.error(`Error during refactor continuation attempt ${attempts}:`, continuationError);
           break; // Stop on error
       }
    }

    if (!isHtmlComplete(fullRefactoredCode)) {
        console.warn(`Refactored code might still be incomplete after ${attempts} continuation attempts.`);
        // Optionally throw an error
        // throw new Error(`Failed to generate complete refactored code after ${MAX_CONTINUATION_ATTEMPTS} attempts.`);
    } else {
        console.log("Refactored code generation appears complete.");
    }

    return { refactoredCode: fullRefactoredCode };
  }
);
