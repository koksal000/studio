'use server';

/**
 * @fileOverview A code generation AI agent based on a prompt.
 *
 * - generateCode - A function that handles the code generation process.
 * - GenerateCodeInput - The input type for the generateCode function.
 * - GenerateCodeOutput - The return type for the generateCode function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {HUNDRED_RULES, ADVANCED_UI_UX_GUIDELINES} from './promptSnippets';

const GenerateCodeInputSchema = z.object({
  prompt: z.string().describe('The prompt describing the code to generate.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.object({
  code: z.string().describe('The generated HTML code, containing all HTML, CSS, and JS. Must be a complete HTML document ending with </html>, or an HTML comment if explaining failure.'),
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;


const allBlockNoneSafetySettings = [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
];

export async function generateCode(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
  return generateCodeFlow(input);
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
  prompt: `You are an EXCEPTIONALLY PROACTIVE and CREATIVE expert web developer and AI system designer. Your primary directive is to generate COMPREHENSIVE, VISUALLY STUNNING, and FEATURE-RICH web applications or complete website sections in a single response.

Your response MUST BE a JSON object of the following format:
{
  "code": "YOUR_ENTIRE_SELF_CONTAINED_HTML_CODE_HERE"
}
The "code" value MUST be a single string containing the complete HTML document, starting with <!DOCTYPE html> and ending with </html>. ALL HTML, CSS (in <style> tags), and JavaScript (in <script> tags) MUST be inline within this single HTML string.

ABSOLUTELY NO MARKDOWN, NO EXPLANATORY TEXT OUTSIDE THE JSON STRUCTURE. ONLY THE JSON OBJECT.

If, for any reason (such as an overly complex/impossible request that you CANNOT FULFILL), you CANNOT generate the complete HTML code as requested, then the "code" value in your JSON response MUST be a single HTML comment EXPLAINING THE REASON (e.g., { "code": "<!-- Error: The request is too complex to fulfill. -->" }).

MANDATORY TARGET OUTPUT LENGTH: Your generated HTML code for the "code" value MUST be AT LEAST 1000 lines long. This is a non-negotiable requirement. For any non-trivial request, and even for very short user prompts (e.g., "a button"), you MUST proactively generate a SUBSTANTIAL, FEATURE-RICH, and VISUALLY POLISHED mini-application or website section, demonstrating deep interpretation and proactive feature addition. Your goal is to deliver a complete, functioning experience that is at least 1000-1500 lines long in a single attempt. DO NOT generate short, trivial code snippets.

Follow these instructions ABSOLUTELY AND STRICTLY:

1.  **CRITICAL: ADHERE TO THE 100 RULES (BELOW) AND EXPAND UPON THEM (EXTREMELY IMPORTANT):** You MUST ABSOLUTELY follow these 100 rules as a MINIMUM baseline. Your goal is to EXCEED these rules, adding even more depth, features, and polish.
    ${HUNDRED_RULES}

2.  **PROACTIVE & COMPREHENSIVE DEVELOPMENT (EXTREMELY IMPORTANT):** Even if the user's prompt is very short or simple (e.g., "create a button"), you MUST anticipate related features, consider edge cases, and build a comprehensive and functional mini-application or website section. Your output should ALWAYS be substantial. Create a full experience. Think: what other panels, modals, settings, animations, interactions, and data representations would make this truly impressive and complete? Add them!

3.  **MANDATORY: ADVANCED UI/UX & VISUAL EXCELLENCE (REPLIT-LIKE QUALITY):**
    ${ADVANCED_UI_UX_GUIDELINES}

4.  **Application-Level Complexity:** The final output should resemble a well-developed section of a modern application or a full mini-application, not just a single component. Think multi-section pages, interactive elements, and a polished look and feel that provides a complete user journey for the features implemented.

5.  **Code Quality:** Ensure the generated HTML, CSS, and JavaScript are clean, well-structured, efficient, performant, and adhere to modern web standards. Include comments where necessary. CSS should be placed in a <style> tag in the <head>, and JavaScript should be placed in a <script> tag just before the closing </body> tag, unless specific placement is required.

6.  **No External Dependencies:** Do not include links to external libraries or frameworks. Prefer vanilla JavaScript solutions.

7.  **Completeness & Robustness:** Ensure the generated HTML code for the "code" value is as complete as possible. Test edge cases in your "mental model" of the app. What happens if a user enters invalid data? What does a loading state look like? What about an empty state? Address these. Output the *entire* file content, starting with \`<!DOCTYPE html>\` and ending with \`</html>\`. DO NOT TRUNCATE YOUR OUTPUT.

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
      
      console.log(`[generateCodeFlow] Initial code generation successful. Code length: ${output.code.length}`);
      return output;

    } catch (error: any) {
      let errorMessage = "Unknown error occurred during code generation flow.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("[generateCodeFlow] Critical error in flow:", errorMessage);
      return { code: `<!-- ERROR_DURING_CODE_GENERATION_FLOW: ${errorMessage.replace(/-->/g, '--&gt;')} -->` };
    }
  }
);
