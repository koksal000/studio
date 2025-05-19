
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
  code: z.string().describe('The comprehensively refactored code. Must be a complete HTML document ending with </html>, or an HTML comment if explaining failure.'),
});
export type RefactorCodeOutput = z.infer<typeof RefactorCodeOutputSchema>;

export async function refactorCode(input: RefactorCodeInput): Promise<RefactorCodeOutput> {
  try {
    const result = await refactorCodeFlow(input);
    if (!result || typeof result.code !== 'string') {
      console.error("[refactorCode export] AI model returned null or invalid structure for refactored code.");
      return { code: `<!-- Error: AI model returned null or invalid structure for refactored code. Original code preserved below. -->\n${input.code}` };
    }
    return result;
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
  output: { // Expects a JSON object with a "code" property
    schema: RefactorCodeOutputSchema,
  },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an expert code refactoring agent.

You will be given code and a prompt describing how to refactor the code. Apply the requested changes comprehensively throughout the code, ensuring consistency and maintaining functionality unless the prompt specifies otherwise.

Your response MUST BE a JSON object of the following format:
{
  "code": "YOUR_ENTIRE_REFACRTORD_SELF_CONTAINED_HTML_CODE_HERE"
}
The "code" value MUST be a single string containing the complete refactored HTML document, starting with <!DOCTYPE html> and ending with </html>.

ABSOLUTELY NO MARKDOWN, NO EXPLANATORY TEXT OUTSIDE THE JSON STRUCTURE. ONLY THE JSON OBJECT.

If, for any reason (such as an overly complex/impossible request that you CANNOT FULFILL), you CANNOT generate the refactored HTML code as requested, then the "code" value in your JSON response MUST be a single HTML comment EXPLAINING THE REASON (e.g., { "code": "<!-- Error: Cannot refactor due to X, Y, Z. -->" }). Ensure the original code is NOT included in the error comment itself if you must return an error.

Original Code:
\`\`\`html
{{{code}}}
\`\`\`

Refactoring Prompt:
{{{prompt}}}

JSON Response (ONLY THE JSON OBJECT containing the refactored HTML or an error comment):`,
});

const refactorCodeFlow = ai.defineFlow(
  {
    name: 'refactorCodeFlow',
    inputSchema: RefactorCodeInputSchema,
    outputSchema: RefactorCodeOutputSchema, // Expects { code: string }
  },
  async (input): Promise<RefactorCodeOutput> => {
    console.log("[refactorCodeFlow] Attempting code refactor. User prompt:", input.prompt);
    try {
      const { output } = await refactorCodePrompt(input); 

      if (!output || typeof output.code !== 'string') {
        console.error("[refactorCodeFlow] CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_INVALID_STRUCTURE_FOR_REFACTORED_CODE_PROPERTY. Output was:", output);
        return { code: `<!-- CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_CODE_FOR_REFACTOR. Original code preserved below. -->\n${input.code}` };
      }
      
      if (output.code.trim() === "") {
        console.warn("[refactorCodeFlow] AI returned an empty string for refactored 'code' property. Returning original code with warning.");
         return { code: `<!-- WARNING: AI_MODEL_RETURNED_EMPTY_STRING_FOR_REFACTOR. Original code preserved below. -->\n${input.code}` };
      }

      if (output.code.startsWith("<!-- Error:") || output.code.startsWith("<!-- CRITICAL_ERROR:") || output.code.startsWith("<!-- WARNING:")) {
         console.warn("[refactorCodeFlow] Refactor resulted in an AI-generated error/warning comment in JSON:", output.code);
         // Return the error comment directly as it's already in the expected {code: "<!-- ... -->"} format
         return output; 
      }
      
      console.log(`[refactorCodeFlow] Received refactored code from AI (length): ${output.code.length}`);
      return output;

    } catch (error: any)
     {
      let errorMessage = "Unknown error occurred during refactor code flow.";
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
      console.error("[refactorCodeFlow] Critical error in flow:", errorMessage);
      return { code: `<!-- ERROR_DURING_REFACTOR_CODE_FLOW: ${errorMessage.replace(/-->/g, '--&gt;')} -->\n${input.code}` };
    }
  }
);
