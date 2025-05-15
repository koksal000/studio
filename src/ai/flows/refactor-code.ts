
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

// Output is now a direct string for the refactored HTML code, or null
const RefactorCodeOutputSchema = z.string().nullable().describe('The comprehensively refactored code. Must be a complete HTML document ending with </html>, or null if refactoring failed.');
export type RefactorCodeOutput = z.infer<typeof RefactorCodeOutputSchema>; // This will be `string | null`

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
    console.error("Critical error in refactorCode flow:", error);
    return `<!-- Error refactoring code: ${error instanceof Error ? error.message : String(error)} -->\n${input.code}`;
  }
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
    schema: RefactorCodeOutputSchema, // Use the string | null schema
  },
  prompt: `You are an expert code refactoring agent.

You will be given code and a prompt describing how to refactor the code. Apply the requested changes comprehensively throughout the code, ensuring consistency and maintaining functionality unless the prompt specifies otherwise.

**IMPORTANT INSTRUCTIONS - FOLLOW STRICTLY:**
1.  **Output Format:** Your response MUST consist of *only* the fully refactored HTML code, and NOTHING ELSE.
    Your output MUST start *exactly* with \`<!DOCTYPE html>\` and end *exactly* with \`</html>\`.
    **DO NOT WRAP THE HTML IN JSON, XML, MARKDOWN, OR ANY OTHER FORMATTING.**
    **DO NOT INCLUDE ANY EXPLANATORY TEXT, PREAMBLE, OR APOLOGIES BEFORE OR AFTER THE HTML CODE.**
    The very first character of your entire response must be '<' (from \`<!DOCTYPE html>\`) and the very last characters must be '</html>'.
    IF YOU CANNOT FULFILL THE REQUEST, return null.
2.  **Completeness:** Ensure the output is the *entire*, complete, and un-truncated refactored code. Partial output is not acceptable. IF THE CODE IS TRUNCATED, return null.

Original Code:
\`\`\`html
{{{code}}}
\`\`\`

Refactoring Prompt:
{{{prompt}}}

Refactored Code (COMPLETE HTML ONLY, starting with <!DOCTYPE html>, ending with </html>, OR null if unable to generate):`,
  config: {
    safetySettings: permissiveSafetySettings,
  },
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
    schema: z.string().nullable().describe('The rest of the refactored HTML code, starting exactly where the partial code left off, and completing the HTML file ending with </html>, or null.'),
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
2.  **Completeness:** Ensure the final combined code (partial code + your continuation) is a single, valid, and complete refactored HTML file ending with \`</html>\`, fully applying the refactoring prompt to the entire original code. IF YOU CANNOT COMPLETE IT, return null.

Continuation of Refactored Code (HTML ONLY, completes the HTML file ending with </html>, OR null if unable to complete):`,
  config: {
    safetySettings: permissiveSafetySettings,
  },
});


// Helper function to check if HTML seems complete
function isHtmlComplete(code: string): boolean {
    const trimmedCode = code.trim();
    return trimmedCode.endsWith('</html>');
}

// Helper function to clean up markdown backticks
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
    outputSchema: RefactorCodeOutputSchema, // Output is now z.string().nullable()
  },
  async (input): Promise<string | null> => { // Return type is string | null
    let fullRefactoredCode = '';
    let attempts = 0;

    try {
      // Initial refactor attempt
      let response = await refactorCodePrompt(input);
      if (response.output === null) {
        console.error("Initial refactor returned null from the model.");
        return `<!-- Error: AI model returned null during initial refactor. -->\n${input.code}`;
      }
      let generatedHtml = cleanupCode(response.output);
      fullRefactoredCode = generatedHtml;

      if (fullRefactoredCode.trim() === '' && response.output !== null) {
        console.warn("Initial refactor resulted in an empty string after cleanup.");
        return `<!-- Warning: AI returned an empty string during refactor. -->\n${input.code}`;
      }

      while (!isHtmlComplete(fullRefactoredCode) && attempts < MAX_CONTINUATION_ATTEMPTS) {
         attempts++;
         console.log(`Refactored code incomplete (attempt ${attempts}). Requesting continuation... Current length: ${fullRefactoredCode.length}, Ends with: "${fullRefactoredCode.slice(-20)}"`);

         try {
             const continuationResponse = await continueRefactorCodePrompt({
                 originalCode: input.code,
                 refactorPrompt: input.prompt,
                 partialRefactoredCode: fullRefactoredCode,
             });

             if (continuationResponse.output === null) {
                console.warn(`Refactor continuation attempt ${attempts} returned null.`);
                return `${fullRefactoredCode}\n<!-- Warning: AI returned null during refactor continuation attempt ${attempts}. Code may be incomplete. -->`;
             }

             const continuationHtml = cleanupCode(continuationResponse.output); 

             if (continuationHtml) {
                 fullRefactoredCode += '\n' + continuationHtml;
                 console.log(`Appended refactor continuation (length: ${continuationHtml.length}). Total length: ${fullRefactoredCode.length}`);
             } else {
                  console.warn(`Refactor continuation attempt ${attempts} returned empty code.`);
                  if (fullRefactoredCode.length < 100 && !fullRefactoredCode.toLowerCase().includes("<html")) {
                    console.error("Initial refactor and continuation are non-HTML or too short. Aborting.");
                    return `<!-- Error: AI model did not produce valid refactored HTML after ${attempts} attempts. Output was: ${fullRefactoredCode.substring(0,200)} -->\n${input.code}`;
                  }
                  break;
             }
         } catch (continuationError) {
             console.error(`Error during refactor continuation attempt ${attempts}:`, continuationError);
             return `${fullRefactoredCode}\n<!-- Error during refactor continuation: ${continuationError instanceof Error ? continuationError.message : String(continuationError)} -->`;
         }
      }

      if (!isHtmlComplete(fullRefactoredCode)) {
          console.warn(`Refactored code might still be incomplete after ${attempts} continuation attempts.`);
          if (fullRefactoredCode.length < 200 && !fullRefactoredCode.toLowerCase().includes("<html") && !fullRefactoredCode.startsWith("<!DOCTYPE html>")) {
            return `<!-- Error: AI model did not produce valid refactored HTML content. Received: ${fullRefactoredCode.substring(0,500)} -->\n${input.code}`;
          }
          return `${fullRefactoredCode}\n<!-- Warning: Refactored code might be incomplete after ${MAX_CONTINUATION_ATTEMPTS} attempts. -->`;
      } else {
          console.log("Refactored code generation appears complete.");
      }

      if (fullRefactoredCode.trim().length < 200 && !fullRefactoredCode.toLowerCase().includes("<html")) {
        console.warn("Refactored code is suspiciously short and might not be valid HTML:", fullRefactoredCode.substring(0,100));
        return `<!-- Error: Refactored code is too short or not valid HTML. Output: ${fullRefactoredCode.substring(0,500)} -->\n${input.code}`;
      }

      return fullRefactoredCode;
    } catch (initialError) {
      console.error("Error during initial code refactoring (or its schema validation):", initialError);
      const message = initialError instanceof Error ? initialError.message : String(initialError);
      if (message.includes("Candidate was blocked due to")) {
        return `<!-- Error: Content refactoring blocked by safety settings. Please revise your prompt or contact support. Details: ${message} -->\n${input.code}`;
      }
      return `<!-- Error during initial code refactoring: ${message} -->\n${input.code}`;
    }
  }
);
