
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

// Reverted to object schema
const RefactorCodeOutputSchema = z.object({
  code: z.string().describe('The comprehensively refactored code. Must be a complete HTML document ending with </html>, or an HTML comment if explaining failure.'),
});
export type RefactorCodeOutput = z.infer<typeof RefactorCodeOutputSchema>;

export async function refactorCode(input: RefactorCodeInput): Promise<RefactorCodeOutput> {
  try {
    return await refactorCodeFlow(input);
  } catch (error) {
    console.error("[refactorCode export] Critical error in refactorCode flow:", error);
    return { code: `<!-- Error refactoring code: ${error instanceof Error ? error.message : String(error)} -->\n${input.code}` };
  }
}

const refactorCodePrompt = ai.definePrompt({
  name: 'refactorCodePrompt',
  input: {
    schema: RefactorCodeInputSchema,
  },
  output: {
    schema: RefactorCodeOutputSchema, // Expecting object
  },
  prompt: `You are an expert code refactoring agent.

You will be given code and a prompt describing how to refactor the code. Apply the requested changes comprehensively throughout the code, ensuring consistency and maintaining functionality unless the prompt specifies otherwise.

**IMPORTANT INSTRUCTIONS - FOLLOW STRICTLY:**
1.  **Output Format:** Your response MUST be a JSON object with a single key "code". The value of "code" MUST be *only* the fully refactored HTML code.
    The HTML code value MUST start *exactly* with \`<!DOCTYPE html>\` and end *exactly* with \`</html>\`.
    **DO NOT INCLUDE ANY EXPLANATORY TEXT, PREAMBLE, OR APOLOGIES WITHIN THE "code" VALUE, OTHER THAN THE HTML ITSELF.**

    If, for any reason (such as safety constraints or an overly complex/impossible request that you cannot fulfill), you CANNOT generate the refactored HTML code as requested, then the "code" value in your JSON response MUST be a single HTML comment EXPLAINING THE REASON (e.g., \`<!-- Error: Cannot refactor due to X, Y, Z. -->\` or \`<!-- Error: Content refactoring blocked by safety. -->\`).
    Do NOT return an empty string or null for the "code" value if you are providing an explanatory comment.
    Otherwise, if you *can* fulfill the request, provide ONLY the complete refactored HTML code within the "code" value of the JSON object.

2.  **Completeness:** Ensure the output is the *entire*, refactored code for the "code" value.

Original Code:
\`\`\`html
{{{code}}}
\`\`\`

Refactoring Prompt:
{{{prompt}}}

Refactored Code (JSON OBJECT WITH "code" KEY CONTAINING COMPLETE HTML ONLY, OR HTML COMMENT):`,
  // Removed safety settings config
});

const refactorCodeFlow = ai.defineFlow(
  {
    name: 'refactorCodeFlow',
    inputSchema: RefactorCodeInputSchema,
    outputSchema: RefactorCodeOutputSchema,
  },
  async (input): Promise<RefactorCodeOutput> => {
    console.log("[refactorCodeFlow] Attempting code refactor. User prompt:", input.prompt);
    try {
      const {output} = await refactorCodePrompt(input);

      if (!output || !output.code) {
        console.error("[refactorCodeFlow] Model response output or output.code is NULL or empty for refactor.");
        return { code: `<!-- CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_EMPTY_CODE_FOR_REFACTOR. -->\n${input.code}` };
      }
      console.log("[refactorCodeFlow] Received refactored code from AI (length):", output.code.length);
      return output;

    } catch (initialError) {
      console.error("[refactorCodeFlow] Top-level error during initial code refactoring (or schema validation):", initialError);
      const message = initialError instanceof Error ? initialError.message : String(initialError);
      if (message.includes("Candidate was blocked due to")) {
        return { code: `<!-- Error: Content refactoring blocked by safety settings. Details: ${message} -->\n${input.code}` };
      }
       if (message.toLowerCase().includes("schema validation failed")) {
           return { code: `<!-- ERROR_GENKIT_SCHEMA_VALIDATION_REFACTOR: Model response mismatch. Details: ${message} -->\n${input.code}` };
      }
      return { code: `<!-- ERROR_DURING_INITIAL_REFACTOR_TRY_CATCH: ${message} -->\n${input.code}` };
    }
  }
);
