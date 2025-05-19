
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
    schema: z.string().nullable(), // Model will return string or null
  },
  config: { // Added safety settings
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an expert code refactoring agent.

You will be given code and a prompt describing how to refactor the code. Apply the requested changes comprehensively throughout the code, ensuring consistency and maintaining functionality unless the prompt specifies otherwise.

**IMPORTANT INSTRUCTIONS - FOLLOW STRICTLY:**
1.  **Output Format:** Your response MUST be the HTML code itself as a PLAIN STRING.
    **ABSOLUTELY NO JSON WRAPPING, NO MARKDOWN, NO EXPLANATORY TEXT, PREAMBLE, OR APOLOGIES. ONLY THE RAW HTML CODE.**
    The HTML code value MUST start *exactly* with \`<!DOCTYPE html>\` and end *exactly* with \`</html>\`.

    If, for any reason (such as safety constraints or an overly complex/impossible request that you CANNOT FULFILL), you CANNOT generate the refactored HTML code as requested, then your response MUST be a single HTML comment EXPLAINING THE REASON (e.g., \`<!-- Error: Cannot refactor due to X, Y, Z. -->\` or \`<!-- Error: Content refactoring blocked by safety. -->\`).
    Do NOT return an empty string if you are providing an explanatory comment. Your response CANNOT BE NULL OR EMPTY unless it's a genuine failure to generate any valid content.

2.  **Completeness:** Ensure the output is the *entire*, refactored code.

Original Code:
\`\`\`html
{{{code}}}
\`\`\`

Refactoring Prompt:
{{{prompt}}}

Refactored HTML (PLAIN STRING - COMPLETE HTML CODE ONLY, OR HTML COMMENT. RESPONSE CANNOT BE NULL OR EMPTY):`,
});

const refactorCodeFlow = ai.defineFlow(
  {
    name: 'refactorCodeFlow',
    inputSchema: RefactorCodeInputSchema,
    outputSchema: RefactorCodeOutputSchema, // Expects { code: string | null }
  },
  async (input): Promise<RefactorCodeOutput> => {
    console.log("[refactorCodeFlow] Attempting code refactor. User prompt:", input.prompt);
    try {
      const refactoredHtml = await refactorCodePrompt(input); // Returns string | null

      if (refactoredHtml === null) {
        console.error("[refactorCodeFlow] CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_FOR_REFACTOR.");
        // Return original code wrapped in an error comment for context if model fails completely
        return { code: `<!-- CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_CODE_FOR_REFACTOR. Original code preserved below. -->\n${input.code}` };
      }
      
      if (refactoredHtml.trim() === "") {
        console.warn("[refactorCodeFlow] AI returned an empty string for refactor. Returning original code with warning.");
         return { code: `<!-- WARNING: AI_MODEL_RETURNED_EMPTY_STRING_FOR_REFACTOR. Original code preserved below. -->\n${input.code}` };
      }

      if (refactoredHtml.startsWith("<!-- Error:") || refactoredHtml.startsWith("<!-- CRITICAL_ERROR:") || refactoredHtml.startsWith("<!-- WARNING:")) {
         console.warn("[refactorCodeFlow] Refactor resulted in an error/warning comment:", refactoredHtml);
         // If AI returns an error comment, pass it through.
         // If it's just a warning, maybe still return original + warning.
         // For now, pass through if AI explicitly states an error.
         if (refactoredHtml.startsWith("<!-- Error:") || refactoredHtml.startsWith("<!-- CRITICAL_ERROR:")) {
            return { code: refactoredHtml };
         }
         // If it's a warning, might be better to return original code + warning.
         // For simplicity now, just pass it.
         return { code: refactoredHtml };
       }
      
      console.log("[refactorCodeFlow] Received refactored code from AI (length):", refactoredHtml.length);
      return { code: refactoredHtml };

    } catch (error: any) {
      let errorMessage = "Unknown error occurred during refactor code flow's main try-catch.";
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.stack) {
            console.error("[refactorCodeFlow] Error stack:", error.stack);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) { /* ignore stringify error */ }
      }
      console.error("[refactorCodeFlow] Critical error in flow's main try-catch:", errorMessage);
      // Preserve original code in case of flow error
      if (errorMessage.includes("Candidate was blocked due to")) {
         return { code: `<!-- Error: Content refactoring blocked by safety settings. Details: ${errorMessage.replace(/-->/g, '--&gt;')} -->\n${input.code}` };
      }
      return { code: `<!-- ERROR_DURING_REFACTOR_CODE_FLOW_MAIN_CATCH: ${errorMessage.replace(/-->/g, '--&gt;')} -->\n${input.code}` };
    }
  }
);

    