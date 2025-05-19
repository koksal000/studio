
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
  code: z.string().nullable().describe('The comprehensively refactored code. Must be a complete HTML document ending with </html>, or an HTML comment if explaining failure, or null if generation fails.'),
});
export type RefactorCodeOutput = z.infer<typeof RefactorCodeOutputSchema>;

export async function refactorCode(input: RefactorCodeInput): Promise<RefactorCodeOutput> {
  try {
    return await refactorCodeFlow(input);
  } catch (error: any) {
    console.error("[refactorCode export] Critical error in refactorCode flow export:", error);
    let errorMessage = "Unknown error in refactorCode export.";
     if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch (e) { /* ignore */ }
    }
    return { code: `<!-- Error refactoring code (export level): ${errorMessage.replace(/-->/g, '--&gt;')} -->\n${input.code}` };
  }
}

const refactorCodePrompt = ai.definePrompt({
  name: 'refactorCodePrompt',
  input: {
    schema: RefactorCodeInputSchema,
  },
  output: {
    schema: RefactorCodeOutputSchema, 
  },
  prompt: `You are an expert code refactoring agent.

You will be given code and a prompt describing how to refactor the code. Apply the requested changes comprehensively throughout the code, ensuring consistency and maintaining functionality unless the prompt specifies otherwise.

**IMPORTANT INSTRUCTIONS - FOLLOW STRICTLY:**
1.  **Output Format:** Your response MUST be a JSON object with a single key "code". The value of "code" MUST be *only* the fully refactored HTML code.
    The HTML code value MUST start *exactly* with \`<!DOCTYPE html>\` and end *exactly* with \`</html>\`.
    **DO NOT INCLUDE ANY EXPLANATORY TEXT, PREAMBLE, OR APOLOGIES WITHIN THE "code" VALUE, OTHER THAN THE HTML ITSELF.**

    If, for any reason (such as safety constraints or an overly complex/impossible request that you CANNOT FULFILL), you CANNOT generate the refactored HTML code as requested, then the "code" value in your JSON response MUST be a single HTML comment EXPLAINING THE REASON (e.g., \`<!-- Error: Cannot refactor due to X, Y, Z. -->\` or \`<!-- Error: Content refactoring blocked by safety. -->\`).
    Do NOT return an empty string for the "code" value if you are providing an explanatory comment. "code" CANNOT BE NULL OR EMPTY unless it's a genuine failure to generate any valid content.

2.  **Completeness:** Ensure the output is the *entire*, refactored code for the "code" value.

Original Code:
\`\`\`html
{{{code}}}
\`\`\`

Refactoring Prompt:
{{{prompt}}}

Refactored Code (JSON OBJECT WITH "code" KEY CONTAINING COMPLETE HTML ONLY, OR HTML COMMENT. "code" CANNOT BE NULL OR EMPTY):`,
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

      if (!output || output.code === undefined || output.code === null) {
        console.error("[refactorCodeFlow] Model response output or output.code is NULL or undefined for refactor.");
        return { code: `<!-- CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_UNDEFINED_CODE_FOR_REFACTOR. -->\n${input.code}` };
      }
       if (output.code.trim() === "" || output.code.startsWith("<!-- Error") || output.code.startsWith("<!-- CRITICAL_ERROR")) {
         console.warn("[refactorCodeFlow] Refactor resulted in an error comment or empty code:", output.code);
         // Return the error comment or a new one if it was empty
         return { code: output.code || "<!-- CRITICAL_ERROR: Refactor resulted in empty code. -->" };
       }
      console.log("[refactorCodeFlow] Received refactored code from AI (length):", output.code.length);
      return output;

    } catch (error: any) {
      let errorMessage = "Unknown error occurred during refactor code flow.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) { /* ignore stringify error */ }
      }
      console.error("[refactorCodeFlow] Critical error in flow's main try-catch:", errorMessage, error);
      if (errorMessage.includes("Candidate was blocked due to")) {
         return { code: `<!-- Error: Content refactoring blocked by safety settings. Details: ${errorMessage.replace(/-->/g, '--&gt;')} -->\n${input.code}` };
      }
      return { code: `<!-- ERROR_DURING_REFACTOR_CODE_FLOW_MAIN_CATCH: ${errorMessage.replace(/-->/g, '--&gt;')} -->\n${input.code}` };
    }
  }
);
