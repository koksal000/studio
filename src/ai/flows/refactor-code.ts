
'use server';

/**
 * @fileOverview A code refactoring AI agent.
 *
 * - refactorCode - A function that handles the code refactoring process.
 * - RefactorCodeInput - The input type for the refactorCode function.
 * - RefactorCodeOutput - The return type for the refactorCode function (now string | null).
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const MAX_CONTINUATION_ATTEMPTS = 3; // Maximum number of times to ask for continuation

const RefactorCodeInputSchema = z.object({
  code: z.string().describe('The code to be refactored.'),
  prompt: z.string().describe('The prompt describing the desired refactoring changes.'),
});
export type RefactorCodeInput = z.infer<typeof RefactorCodeInputSchema>;

const RefactorCodeOutputSchema = z.string().nullable().describe('The comprehensively refactored code. Must be a complete HTML document ending with </html>, or null if refactoring failed, or an HTML comment if explaining failure.');
export type RefactorCodeOutput = z.infer<typeof RefactorCodeOutputSchema>;

const permissiveSafetySettings = [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
];

export async function refactorCode(input: RefactorCodeInput): Promise<RefactorCodeOutput> {
  try {
    return await refactorCodeFlow(input);
  } catch (error) {
    console.error("[refactorCode export] Critical error in refactorCode flow:", error);
    return `<!-- Error refactoring code: ${error instanceof Error ? error.message : String(error)} -->\n${input.code}`;
  }
}

const refactorCodePrompt = ai.definePrompt({
  name: 'refactorCodePrompt',
  input: {
    schema: z.object({
      code: z.string().describe('The code to be refactored.'),
      prompt: z.string().describe('The prompt describing the desired refactoring changes.'),
    }),
  },
  output: {
    schema: RefactorCodeOutputSchema,
  },
  prompt: `You are an expert code refactoring agent.

You will be given code and a prompt describing how to refactor the code. Apply the requested changes comprehensively throughout the code, ensuring consistency and maintaining functionality unless the prompt specifies otherwise.

**IMPORTANT INSTRUCTIONS - FOLLOW STRICTLY:**
1.  **Output Format:** Your response MUST consist of *only* the fully refactored HTML code.
    Your output MUST start *exactly* with \`<!DOCTYPE html>\` and end *exactly* with \`</html>\`.
    **DO NOT WRAP THE HTML IN JSON, XML, MARKDOWN, OR ANY OTHER FORMATTING.**
    **DO NOT INCLUDE ANY EXPLANATORY TEXT, PREAMBLE, OR APOLOGIES BEFORE OR AFTER THE HTML CODE.**
    The very first character of your entire response must be '<' (from \`<!DOCTYPE html>\`) and the very last characters must be '</html>'.

    If, for any reason (such as safety constraints or an overly complex/impossible request that you cannot fulfill), you CANNOT generate the refactored HTML code as requested, then your entire response MUST be a single HTML comment EXPLAINING THE REASON (e.g., \`<!-- Error: Cannot refactor due to X, Y, Z. -->\` or \`<!-- Error: Content refactoring blocked by safety. -->\`).
    Do NOT return null or an empty string if you are providing an explanatory comment.
    Otherwise, if you *can* fulfill the request, provide ONLY the complete refactored HTML code.

2.  **Completeness:** Ensure the output is the *entire*, refactored code. If the full content cannot be generated in one response, provide as much as possible. The system will attempt to complete it.

Original Code:
\`\`\`html
{{{code}}}
\`\`\`

Refactoring Prompt:
{{{prompt}}}

Refactored Code (COMPLETE HTML ONLY, starting with <!DOCTYPE html>, ending with </html>, OR a single HTML comment explaining failure):`,
  config: {
    safetySettings: permissiveSafetySettings,
  },
});

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
    schema: z.string().nullable().describe('The rest of the refactored HTML code, starting exactly where the partial code left off, and completing the HTML file ending with </html>, or null, or an HTML comment explaining failure to complete.'),
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

**Your Task - FOLLOW STRICTLY:**
1.  **Output Format:** Continue generating the rest of the refactored HTML code EXACTLY from where the partial code stopped. Your response MUST be *only* the continuation of the HTML code.
    **DO NOT REPEAT ANY PART OF THE PARTIAL CODE.**
    **DO NOT WRAP THE HTML IN JSON, XML, MARKDOWN, OR ANY OTHER FORMATTING.**
    **DO NOT INCLUDE ANY EXPLANATORY TEXT, PREAMBLE, OR APOLOGIES BEFORE OR AFTER THE HTML CODE.**
2.  **Completeness:** Ensure the final combined code (partial code + your continuation) is a single, valid, and complete refactored HTML file ending with \`</html>\`, fully applying the refactoring prompt to the entire original code.
    IF YOU CANNOT COMPLETE IT, your entire response must be a single HTML comment explaining why (e.g., \`<!-- Error: Could not complete refactor due to X. -->\`).

Continuation of Refactored Code (HTML ONLY, completes the HTML file ending with </html>, OR an HTML comment explaining failure):`,
  config: {
    safetySettings: permissiveSafetySettings,
  },
});


function isHtmlComplete(code: string): boolean {
    const trimmedCode = code.trim();
    return trimmedCode.endsWith('</html>');
}

function cleanupCode(code: string | undefined | null): string {
    if (code === undefined || code === null) {
        return '';
    }
    let cleaned = String(code).trim();
    if (cleaned.startsWith('```html')) {
      cleaned = cleaned.substring(7);
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trimStart();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trimStart();
    }
    return cleaned.trim();
}


const refactorCodeFlow = ai.defineFlow(
  {
    name: 'refactorCodeFlow',
    inputSchema: RefactorCodeInputSchema,
    outputSchema: RefactorCodeOutputSchema,
  },
  async (input): Promise<string | null> => {
    let fullRefactoredCode = '';
    let attempts = 0;

    try {
      console.log("[refactorCodeFlow] Attempting initial code refactor. User prompt:", input.prompt);
      const promptResponse = await refactorCodePrompt(input);

      if (promptResponse.output === null) {
        console.error("[refactorCodeFlow] Model response output is NULL. This means the AI model did not return any string content for refactoring.");
        // Return original code with an error comment prepended
        return `<!-- CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_FOR_REFACTOR. The AI model provided no content. -->\n${input.code}`;
      }
      
      let generatedHtml = cleanupCode(promptResponse.output);
      fullRefactoredCode = generatedHtml;
      console.log("[refactorCodeFlow] Initial refactored HTML (cleaned, length):", fullRefactoredCode.length);


      if (fullRefactoredCode.trim() === '' && promptResponse.output !== null) {
        console.warn("[refactorCodeFlow] Initial refactor resulted in an empty string after cleanup. Original model output:", promptResponse.output);
        return `<!-- WARNING: AI_REFACTOR_EMPTY_AFTER_CLEANUP. Model might have attempted an HTML comment that was removed. -->\n${input.code}`;
      }

      if (fullRefactoredCode.startsWith('<!-- Error:') || fullRefactoredCode.startsWith('<!-- Warning:') || fullRefactoredCode.startsWith('<!-- CRITICAL_ERROR:')) {
         console.warn("[refactorCodeFlow] AI model returned an error/warning comment directly during refactor:", fullRefactoredCode);
         // If the model intentionally returned an error comment, we should return it as is,
         // potentially appended with original code if it's not a critical model failure message.
         if (fullRefactoredCode.startsWith('<!-- CRITICAL_ERROR: AI_MODEL_RETURNED_NULL')) {
            return `${fullRefactoredCode}\n${input.code}`; // Append original if model returned null
         }
         return fullRefactoredCode; // Otherwise, just the model's comment
      }

      while (!isHtmlComplete(fullRefactoredCode) && attempts < MAX_CONTINUATION_ATTEMPTS) {
         attempts++;
         console.log(`[refactorCodeFlow] Refactored code incomplete (attempt ${attempts}). Requesting continuation... Current length: ${fullRefactoredCode.length}, Ends with: "${fullRefactoredCode.slice(-50)}"`);

         try {
             const continuationResponse = await continueRefactorCodePrompt({
                 originalCode: input.code, // Pass original code for context
                 refactorPrompt: input.prompt,
                 partialRefactoredCode: fullRefactoredCode,
             });

             if (continuationResponse.output === null) {
                console.warn(`[refactorCodeFlow] Refactor continuation attempt ${attempts} returned null from the model.`);
                return `${fullRefactoredCode}\n<!-- WARNING: AI_REFACTOR_CONTINUATION_NULL. Code may be incomplete. -->`;
             }

             const continuationHtml = cleanupCode(continuationResponse.output);
             console.log(`[refactorCodeFlow] Refactor continuation attempt ${attempts} HTML (cleaned, length): ${continuationHtml.length}`);

             if (continuationHtml) {
                 if (continuationHtml.startsWith('<!-- Error:') || continuationHtml.startsWith('<!-- Warning:') || continuationHtml.startsWith('<!-- CRITICAL_ERROR:')) {
                      console.warn(`[refactorCodeFlow] Refactor continuation attempt ${attempts} returned an error/warning comment:`, continuationHtml);
                      return `${fullRefactoredCode}\n${continuationHtml}`;
                  }
                 fullRefactoredCode += '\n' + continuationHtml;
                 console.log(`[refactorCodeFlow] Appended refactor continuation. Total length: ${fullRefactoredCode.length}`);
             } else { // Continuation cleanup resulted in empty string
                  console.warn(`[refactorCodeFlow] Refactor continuation attempt ${attempts} returned empty code after cleanup. Original output:`, continuationResponse.output);
                  if (fullRefactoredCode.length < 100 && !fullRefactoredCode.toLowerCase().includes("<html")) {
                    console.error("[refactorCodeFlow] Initial refactor and continuation are non-HTML or too short. Aborting.");
                    return `<!-- CRITICAL_ERROR: AI_REFACTOR_INVALID_HTML_AFTER_ATTEMPTS. Output: ${fullRefactoredCode.substring(0,200)} -->\n${input.code}`;
                  }
                  break; 
             }
         } catch (continuationError) {
             console.error(`[refactorCodeFlow] Error during refactor continuation attempt ${attempts}:`, continuationError);
             return `${fullRefactoredCode}\n<!-- ERROR_DURING_REFACTOR_CONTINUATION: ${continuationError instanceof Error ? continuationError.message : String(continuationError)} -->`;
         }
      }

      if (!isHtmlComplete(fullRefactoredCode) && !(fullRefactoredCode.startsWith('<!-- Error:') || fullRefactoredCode.startsWith('<!-- Warning:') || fullRefactoredCode.startsWith('<!-- CRITICAL_ERROR:'))) {
          console.warn(`[refactorCodeFlow] Refactored code might still be incomplete after ${attempts} continuation attempts.`);
          if (fullRefactoredCode.length < 200 && !fullRefactoredCode.toLowerCase().includes("<html") && !fullRefactoredCode.startsWith("<!DOCTYPE html>")) {
            return `<!-- CRITICAL_ERROR: AI_REFACTOR_SHORT_INVALID_HTML. Received: ${fullRefactoredCode.substring(0,500)} -->\n${input.code}`;
          }
          return `${fullRefactoredCode}\n<!-- WARNING: REFACTOR_MAY_BE_INCOMPLETE. Max attempts reached. -->`;
      } else {
          console.log("[refactorCodeFlow] Refactored code generation appears complete or ended with an AI-provided error/warning.");
      }

      if (!(fullRefactoredCode.startsWith('<!-- Error:') || fullRefactoredCode.startsWith('<!-- Warning:') || fullRefactoredCode.startsWith('<!-- CRITICAL_ERROR:')) && 
          fullRefactoredCode.trim().length > 0 &&
          fullRefactoredCode.trim().length < 200 && 
          !fullRefactoredCode.toLowerCase().includes("<html")) {
        console.warn("[refactorCodeFlow] Refactored code is suspiciously short and might not be valid HTML:", fullRefactoredCode.substring(0,100));
        return `<!-- WARNING: AI_REFACTOR_VERY_SHORT_CONTENT. Output: ${fullRefactoredCode.substring(0,500)} -->\n${input.code}`;
      }

      return fullRefactoredCode;
    } catch (initialError) {
      console.error("[refactorCodeFlow] Top-level error during initial code refactoring (or schema validation):", initialError);
      const message = initialError instanceof Error ? initialError.message : String(initialError);
      if (message.includes("Candidate was blocked due to")) {
        return `<!-- Error: Content refactoring blocked by safety settings. Details: ${message} -->\n${input.code}`;
      }
       if (message.toLowerCase().includes("schema validation failed")) {
           return `<!-- ERROR_GENKIT_SCHEMA_VALIDATION_REFACTOR: Model response mismatch. Details: ${message} -->\n${input.code}`;
      }
      return `<!-- ERROR_DURING_INITIAL_REFACTOR_TRY_CATCH: ${message} -->\n${input.code}`;
    }
  }
);

