
'use server';

/**
 * @fileOverview A code refactoring AI agent.
 * It now includes logic to attempt completion if the output is truncated.
 *
 * - refactorCode - A function that handles the code refactoring process.
 * - RefactorCodeInput - The input type for the refactorCode function.
 * - RefactorCodeOutput - The return type for the refactorCode function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {completeCode} from './complete-code-flow';
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

// Function to check if HTML code seems incomplete (very basic check)
function isHtmlIncomplete(htmlString: string): boolean {
  if (!htmlString || typeof htmlString !== 'string') return true;
  const trimmedHtml = htmlString.trim().toLowerCase();
  return !trimmedHtml.endsWith('</html>');
}

const MAX_COMPLETION_ATTEMPTS = 2;

export async function refactorCode(input: RefactorCodeInput): Promise<RefactorCodeOutput> {
  try {
    let result = await refactorCodeFlow(input);
    
    if (!result || typeof result.code !== 'string') {
      console.error("[refactorCode export] AI model returned null or invalid structure for refactored code.");
      return { code: `<!-- Error: AI model returned null or invalid structure for refactored code. Original code preserved below. -->\n${input.code}` };
    }

    let currentCode = result.code;
    let completionAttempts = 0;

    while (isHtmlIncomplete(currentCode) && completionAttempts < MAX_COMPLETION_ATTEMPTS && !currentCode.startsWith('<!-- Error:')) {
      completionAttempts++;
      console.log(`[refactorCode export] Refactored code from attempt ${completionAttempts-1} seems incomplete. Attempting completion ${completionAttempts}/${MAX_COMPLETION_ATTEMPTS}.`);
      
      try {
        const completionResult = await completeCode({
          incompleteCode: currentCode,
          originalUserPrompt: `Refactor the code based on: ${input.prompt}. Original code to refactor was: ${input.code.substring(0,200)}...`, // Provide context
          instructionContext: `refactoring - completion attempt ${completionAttempts}`,
        });

        if (completionResult && typeof completionResult.completedCodePortion === 'string') {
           if (completionResult.completedCodePortion.startsWith('<!-- CRITICAL_ERROR:') || completionResult.completedCodePortion.startsWith('<!-- ERROR_DURING_COMPLETION_FLOW:')) {
             console.warn(`[refactorCode export] Completion attempt ${completionAttempts} resulted in an error comment: ${completionResult.completedCodePortion}`);
             currentCode += `\n${completionResult.completedCodePortion}`;
             break; 
          }
          currentCode += completionResult.completedCodePortion;
          if (completionResult.isLikelyCompleteNow && !isHtmlIncomplete(currentCode)) {
            console.log(`[refactorCode export] Code is now likely complete after ${completionAttempts} refactor completion attempts.`);
            break;
          }
        } else {
          console.warn(`[refactorCode export] Refactor completion attempt ${completionAttempts} returned invalid structure. Stopping.`);
          currentCode += "\n<!-- WARNING: Refactor code completion attempt returned invalid data. -->";
          break;
        }
      } catch (completionError: any) {
        console.error(`[refactorCode export] Error during refactor completion attempt ${completionAttempts}:`, completionError);
        const errorMessage = completionError instanceof Error ? completionError.message : JSON.stringify(completionError);
        currentCode += `\n<!-- ERROR_DURING_REFACTOR_CODE_COMPLETION_EXPORT_LEVEL (Attempt ${completionAttempts}): ${errorMessage.replace(/-->/g, '--&gt;')} -->`;
        break;
      }
    }
     if (completionAttempts >= MAX_COMPLETION_ATTEMPTS && isHtmlIncomplete(currentCode)) {
        console.warn(`[refactorCode export] Max refactor completion attempts (${MAX_COMPLETION_ATTEMPTS}) reached, but code still seems incomplete.`);
        currentCode += "\n<!-- WARNING: Max refactor completion attempts reached, code might still be incomplete. -->";
    }


    if (currentCode.trim() === '' || currentCode.startsWith('<!-- Error:') || currentCode.startsWith('<!-- WARNING:') || currentCode.startsWith('<!-- CRITICAL_ERROR:')) {
       console.warn(`[refactorCode export] Final refactored code is an error/warning: ${currentCode.substring(0,100)}`);
       // If the AI returns an error comment, we should preserve the original code as a fallback.
       if (currentCode.startsWith('<!-- Error:') || currentCode.startsWith('<!-- CRITICAL_ERROR:') || currentCode.startsWith('<!-- WARNING:')) {
           return { code: `${currentCode}\n<!-- Original code was:\n${input.code}\n-->`};
       }
     } else {
       console.log(`[refactorCode export] Final refactored code length: ${currentCode.length}`);
     }
    return { code: currentCode };

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
  config: {
    safetySettings: [ 
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an EXCEPTIONALLY SKILLED expert code refactoring and enhancement agent.
Your primary directive is to take the provided HTML/CSS/JS code and apply the user's refactoring instructions comprehensively, while also proactively enhancing the code to meet the highest standards of quality, functionality, and visual appeal.

Your response MUST BE a JSON object of the following format:
{
  "code": "YOUR_ENTIRE_REFACRTORD_AND_ENHANCED_SELF_CONTAINED_HTML_CODE_HERE"
}
The "code" value MUST be a single string containing the complete refactored HTML document, starting with <!DOCTYPE html> and ending with </html>. ALL HTML, CSS (in <style> tags), and JavaScript (in <script> tags) MUST be inline within this single HTML string.

ABSOLUTELY NO MARKDOWN, NO EXPLANATORY TEXT OUTSIDE THE JSON STRUCTURE. ONLY THE JSON OBJECT.

If, for any reason (such as an overly complex/impossible request that you CANNOT FULFILL, or a safety/content policy violation), you CANNOT generate the refactored HTML code as requested, then the "code" value in your JSON response MUST be a single HTML comment EXPLAINING THE REASON (e.g., { "code": "<!-- Error: Cannot refactor due to X, Y, Z. -->" }). Do NOT mention safety or content blocking in the error message unless it is the absolute only reason, or if you are specifically instructed by a safety policy to do so.

TARGET OUTPUT LENGTH for the HTML code string: AIM FOR A MINIMUM OF 1000-1500 LINES OF CODE, or significantly expand upon the original if it's already long. Even if the refactor request is simple, proactively enhance the code.

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
