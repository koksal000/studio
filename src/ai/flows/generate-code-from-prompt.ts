'use server';

/**
 * @fileOverview A code generation AI agent based on a prompt.
 * It now includes logic to attempt completion if the initial output is truncated.
 *
 * - generateCode - A function that handles the code generation process.
 * - GenerateCodeInput - The input type for the generateCode function.
 * - GenerateCodeOutput - The return type for the generateCode function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {HUNDRED_RULES, ADVANCED_UI_UX_GUIDELINES} from './promptSnippets';
import {completeCode} from './complete-code-flow';

// Helper function to count lines
const countLines = (text: string | null | undefined): number => {
  return text ? text.split('\n').length : 0;
};

const GenerateCodeInputSchema = z.object({
  prompt: z.string().describe('The prompt describing the code to generate.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.object({
  code: z.string().describe('The generated HTML code, containing all HTML, CSS, and JS. Must be a complete HTML document ending with </html>, or an HTML comment if explaining failure.'),
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;

// Function to check if HTML code seems incomplete (very basic check)
function isHtmlIncomplete(htmlString: string): boolean {
  if (!htmlString || typeof htmlString !== 'string') return true;
  const trimmedHtml = htmlString.trim().toLowerCase();
  // Basic check: Does it end with </html>? More sophisticated checks could be added.
  return !trimmedHtml.endsWith('</html>');
}

const MAX_COMPLETION_ATTEMPTS = 2; // Max attempts to complete the code
const allBlockNoneSafetySettings = [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
];

export async function generateCode(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
  try {
    let result = await generateCodeFlow(input);
    
    if (!result || typeof result.code !== 'string') {
      console.error("[generateCode export] AI model returned null or invalid structure for code. Result was:", result);
      return { code: "<!-- Error: AI model returned null or invalid structure for code property. -->" };
    }

    let currentCode = result.code;
    let completionAttempts = 0;

    while (isHtmlIncomplete(currentCode) && completionAttempts < MAX_COMPLETION_ATTEMPTS && !currentCode.startsWith('<!-- Error:')) {
      completionAttempts++;
      console.log(`[generateCode export] Code from attempt ${completionAttempts-1} seems incomplete (length: ${currentCode.length}, ends with </html>: ${currentCode.trim().toLowerCase().endsWith('</html>')}). Attempting completion ${completionAttempts}/${MAX_COMPLETION_ATTEMPTS}.`);
      
      try {
        const completionResult = await completeCode({
          incompleteCode: currentCode,
          originalUserPrompt: input.prompt,
          instructionContext: `initial generation - completion attempt ${completionAttempts}`,
        });

        if (completionResult && typeof completionResult.completedCodePortion === 'string') {
          if (completionResult.completedCodePortion.startsWith('<!-- CRITICAL_ERROR:') || completionResult.completedCodePortion.startsWith('<!-- ERROR_DURING_COMPLETION_FLOW:')) {
             console.warn(`[generateCode export] Completion attempt ${completionAttempts} resulted in an error comment: ${completionResult.completedCodePortion}`);
             currentCode += `\n${completionResult.completedCodePortion}`; // Append error to main code for visibility
             break; // Stop trying to complete if completion itself errors
          }
          currentCode += completionResult.completedCodePortion;
          console.log(`[generateCode export] Appended completion portion. New code length: ${currentCode.length}. AI believes complete: ${completionResult.isLikelyCompleteNow}`);
          if (completionResult.isLikelyCompleteNow && !isHtmlIncomplete(currentCode)) {
            console.log(`[generateCode export] Code is now likely complete after ${completionAttempts} attempts.`);
            break;
          }
        } else {
          console.warn(`[generateCode export] Completion attempt ${completionAttempts} returned invalid structure or null portion. Stopping completion.`);
          currentCode += "\n<!-- WARNING: Code completion attempt returned invalid data. -->";
          break;
        }
      } catch (completionError: any) {
        console.error(`[generateCode export] Error during completion attempt ${completionAttempts}:`, completionError);
        const errorMessage = completionError instanceof Error ? completionError.message : JSON.stringify(completionError);
        currentCode += `\n<!-- ERROR_DURING_CODE_COMPLETION_EXPORT_LEVEL (Attempt ${completionAttempts}): ${errorMessage.replace(/-->/g, '--&gt;')} -->`;
        break; // Stop trying if completion call itself fails critically
      }
    }

    if (completionAttempts >= MAX_COMPLETION_ATTEMPTS && isHtmlIncomplete(currentCode)) {
        console.warn(`[generateCode export] Max completion attempts (${MAX_COMPLETION_ATTEMPTS}) reached, but code still seems incomplete.`);
        currentCode += "\n<!-- WARNING: Max completion attempts reached, code might still be incomplete. -->";
    }
    
    // Final check if the final code is an error/warning comment itself
     if (currentCode.trim() === '' || currentCode.startsWith('<!-- Error:') || currentCode.startsWith('<!-- WARNING:') || currentCode.startsWith('<!-- CRITICAL_ERROR:')) {
       console.warn(`[generateCode export] Final generated code is an error/warning: ${currentCode.substring(0,100)}`);
     } else {
       console.log(`[generateCode export] Final generated code length: ${currentCode.length}, Lines: ${countLines(currentCode)}`);
     }

    return { code: currentCode };

  } catch (error: any) {
    console.error("[generateCode export] Critical error in generateCode flow export:", error);
    let errorMessage = "Unknown error in generateCode export.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch (e) { /* ignore */ }
    }
    return { code: `<!-- Error in generateCode export: ${errorMessage.replace(/-->/g, '--&gt;')} -->` };
  }
}

const generateCodePrompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: {
    schema: GenerateCodeInputSchema,
  },
  output: { 
    schema: GenerateCodeOutputSchema,
  },
  config: {
    safetySettings: allBlockNoneSafetySettings,
  },
  prompt: `You are an EXCEPTIONALLY PROACTIVE and CREATIVE expert web developer and AI system designer. Your primary directive is to generate COMPREHENSIVE, VISUALLY STUNNING, and FEATURE-RICH web applications or complete website sections.

Your response MUST BE a JSON object of the following format:
{
  "code": "YOUR_ENTIRE_SELF_CONTAINED_HTML_CODE_HERE"
}
The "code" value MUST be a single string containing the complete HTML document, starting with <!DOCTYPE html> and ending with </html>. ALL HTML, CSS (in <style> tags), and JavaScript (in <script> tags) MUST be inline within this single HTML string.

ABSOLUTELY NO MARKDOWN, NO EXPLANATORY TEXT OUTSIDE THE JSON STRUCTURE. ONLY THE JSON OBJECT.

If, for any reason (such as an overly complex/impossible request that you CANNOT FULFILL), you CANNOT generate the complete HTML code as requested, then the "code" value in your JSON response MUST be a single HTML comment EXPLAINING THE REASON (e.g., { "code": "<!-- Error: The request is too complex to fulfill. -->" }).

TARGET OUTPUT LENGTH for the HTML code string: AIM FOR A MINIMUM OF 1500-2000 LINES OF CODE. For any non-trivial request, and even for very short user prompts (e.g., "a button"), you MUST proactively generate a SUBSTANTIAL, FEATURE-RICH, and VISUALLY POLISHED mini-application or website section (potentially 2000-5000+ lines, aiming for an average of 3000 lines for typical requests), demonstrating deep interpretation and proactive feature addition. Output should be a complete, functioning experience.

Follow these instructions ABSOLUTELY AND STRICTLY:

1.  **CRITICAL: ADHERE TO THE 100 RULES (BELOW) AND EXPAND UPON THEM (EXTREMELY IMPORTANT):** You MUST ABSOLUTELY follow these 100 rules as a MINIMUM baseline. Your goal is to EXCEED these rules, adding even more depth, features, and polish.
    ${HUNDRED_RULES}

2.  **PROACTIVE & COMPREHENSIVE DEVELOPMENT (EXTREMELY IMPORTANT):** Even if the user's prompt is very short or simple (e.g., "create a button"), you MUST anticipate related features, consider edge cases, and build a comprehensive and functional mini-application or website section. Your output should ALWAYS be substantial. Create a full experience. DO NOT generate short, trivial code snippets. Think: what other panels, modals, settings, animations, interactions, and data representations would make this truly impressive and complete? Add them!

3.  **MANDATORY: ADVANCED UI/UX & VISUAL EXCELLENCE (REPLIT-LIKE QUALITY):**
    ${ADVANCED_UI_UX_GUIDELINES}

4.  **Application-Level Complexity:** The final output should resemble a well-developed section of a modern application or a full mini-application, not just a single component. Think multi-section pages, interactive elements, and a polished look and feel that provides a complete user journey for the features implemented.

5.  **Advanced In-Browser Technologies (Pyodide/WebContainers):** If the user prompt suggests a backend, a data science task, or a non-JavaScript environment (e.g., 'Python app', 'Flask server', 'data analysis dashboard'), you MUST generate the necessary HTML, CSS, and JavaScript to set up a front-end that uses **Pyodide** (for Python) or a similar in-browser WebAssembly technology to run the requested code. The final HTML MUST be self-contained and include the setup for loading Pyodide, the Python/backend code within \`<script>\` tags (e.g., as a string or a dedicated script type), and the JavaScript glue to execute it and display the output. The front-end should be a complete UI for interacting with the in-browser backend.

6.  **Code Quality:** Ensure the generated HTML, CSS, and JavaScript are clean, well-structured, efficient, performant, and adhere to modern web standards. Include comments where necessary. CSS should be placed in a <style> tag in the <head>, and JavaScript should be placed in a <script> tag just before the closing </body> tag, unless specific placement is required.

7.  **No External Dependencies (Unless Critical and Inlined):** Do not include links to external libraries or frameworks. Prefer vanilla JavaScript solutions. The only exception is for technologies like Pyodide, which should be loaded from its official CDN.

8.  **Completeness & Robustness:** Ensure the generated HTML code for the "code" value is as complete as possible. Test edge cases in your "mental model" of the app. What happens if a user enters invalid data? What does a loading state look like? What about an empty state? Address these. Output the *entire* file content, starting with \`<!DOCTYPE html>\` and ending with \`</html>\`. DO NOT TRUNCATE YOUR OUTPUT. If the response would be too long, make it shorter but complete.

User Prompt:
{{{prompt}}}

JSON Response (ONLY THE JSON OBJECT):`,
});


const generateCodeFlow = ai.defineFlow(
  {
    name: 'generateCodeFlow',
    inputSchema: GenerateCodeInputSchema,
    outputSchema: GenerateCodeOutputSchema, 
  },
  async (input): Promise<GenerateCodeOutput> => {
    console.log("[generateCodeFlow] Starting code generation. User prompt:", input.prompt);
    
    try {
      const { output } = await generateCodePrompt(input); 
      
      if (!output || typeof output.code !== 'string') {
        console.error("[generateCodeFlow] CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_INVALID_STRUCTURE_FOR_CODE_PROPERTY. Output was:", output);
        return { code: "<!-- CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_INVALID_STRUCTURE_FOR_CODE_PROPERTY in JSON response. -->" };
      }

      if (output.code.trim() === "") {
        console.warn("[generateCodeFlow] AI returned an empty string for the 'code' property. Treating as an error.");
        return { code: "<!-- WARNING: AI_MODEL_RETURNED_EMPTY_STRING_FOR_CODE_PROPERTY. -->" };
      }
      
      console.log(`[generateCodeFlow] Initial code generation successful. Code length: ${output.code.length}, Lines: ${countLines(output.code)}`);
      return output;

    } catch (error: any) {
      let errorMessage = "Unknown error occurred during code generation flow.";
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.stack) {
            console.error("[generateCodeFlow] Error stack:", error.stack);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) { /* ignore stringify error */ }
      }
      console.error("[generateCodeFlow] Critical error in flow:", errorMessage);
      return { code: `<!-- ERROR_DURING_CODE_GENERATION_FLOW: ${errorMessage.replace(/-->/g, '--&gt;')} -->` };
    }
  }
);
