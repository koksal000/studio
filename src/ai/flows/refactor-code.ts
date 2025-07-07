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
import {HUNDRED_RULES, ADVANCED_UI_UX_GUIDELINES} from './promptSnippets';

const RefactorCodeInputSchema = z.object({
  code: z.string().describe('The code to be refactored.'),
  prompt: z.string().describe('The prompt describing the desired refactoring changes.'),
});
export type RefactorCodeInput = z.infer<typeof RefactorCodeInputSchema>;

const RefactorCodeOutputSchema = z.object({
  code: z.string().describe('The comprehensively refactored code. Must be a complete HTML document ending with </html>, or an HTML comment if explaining failure.'),
});
export type RefactorCodeOutput = z.infer<typeof RefactorCodeOutputSchema>;


const allBlockNoneSafetySettings = [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
];

export async function refactorCode(input: RefactorCodeInput): Promise<RefactorCodeOutput> {
  return refactorCodeFlow(input);
}

const refactorCodePrompt = ai.definePrompt({
  name: 'refactorCodePrompt',
  input: {
    schema: RefactorCodeInputSchema,
  },
  output: { 
    schema: RefactorCodeOutputSchema,
  },
  config: {
    safetySettings: allBlockNoneSafetySettings,
  },
  prompt: `You are an EXCEPTIONALLY SKILLED expert code refactoring and enhancement agent.
Your primary directive is to take the provided HTML/CSS/JS code and apply the user's refactoring instructions comprehensively, while also proactively enhancing the code to meet the highest standards of quality, functionality, and visual appeal.

Your response MUST BE a JSON object of the following format:
{
  "code": "YOUR_ENTIRE_REFACRTORD_AND_ENHANCED_SELF_CONTAINED_HTML_CODE_HERE"
}
The "code" value MUST be a single string containing the complete refactored HTML document, starting with <!DOCTYPE html> and ending with </html>. ALL HTML, CSS (in <style> tags), and JavaScript (in <script> tags) MUST be inline within this single HTML string.

ABSOLUTELY NO MARKDOWN, NO EXPLANATORY TEXT OUTSIDE THE JSON STRUCTURE. ONLY THE JSON OBJECT.

If, for any reason you CANNOT generate the refactored HTML code as requested, then the "code" value in your JSON response MUST be a single HTML comment EXPLAINING THE REASON (e.g., { "code": "<!-- Error: Cannot refactor due to X, Y, Z. -->" }).

Original Code to Refactor:
\`\`\`html
{{{code}}}
\`\`\`

User's Refactoring/Enhancement Prompt:
{{{prompt}}}

Follow these instructions ABSOLUTELY AND STRICTLY:
1.  **Apply User's Prompt:** Meticulously apply all changes requested in the "User's Refactoring/Enhancement Prompt".
2.  **CRITICAL: ADHERE TO THE 100 RULES & ADVANCED UI/UX GUIDELINES (BELOW):** Even if not explicitly asked, ensure the *entire* refactored code (not just the changed parts) meticulously follows these principles as a MINIMUM baseline. Your goal is to EXCEED these rules.
    ${HUNDRED_RULES}
    ${ADVANCED_UI_UX_GUIDELINES}
3.  **PROACTIVE & COMPREHENSIVE ENHANCEMENT:** Go beyond simple refactoring. Anticipate related features, consider edge cases, and build a more comprehensive and functional mini-application or website section. If the user asks to change a color, also improve related UI, add an animation, or enhance a nearby feature.
4.  **Completeness & Robustness:** Ensure the generated HTML code for the "code" value is as complete as possible. Test edge cases in your "mental model" of the app. Output the *entire* file content, starting with \`<!DOCTYPE html>\` and ending with \`</html>\`. DO NOT TRUNCATE YOUR OUTPUT.

JSON Response (ONLY THE JSON OBJECT containing the refactored HTML or an error comment):`,
});

const refactorCodeFlow = ai.defineFlow(
  {
    name: 'refactorCodeFlow',
    inputSchema: RefactorCodeInputSchema,
    outputSchema: RefactorCodeOutputSchema, 
  },
  async (input): Promise<RefactorCodeOutput> => {
    console.log("[refactorCodeFlow] Attempting code refactor. User prompt:", input.prompt, "Original code length:", input.code.length);
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
      
      console.log(`[refactorCodeFlow] Received refactored code from AI. Length: ${output.code.length}`);
      return output;

    } catch (error: any)
     {
      let errorMessage = "Unknown error occurred during refactor code flow.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("[refactorCodeFlow] Critical error in flow:", errorMessage);
      return { code: `<!-- ERROR_DURING_REFACTOR_CODE_FLOW: ${errorMessage.replace(/-->/g, '--&gt;')} -->\n${input.code}` };
    }
  }
);
