'use server';
/**
 * @fileOverview A Genkit flow to enhance a user's input prompt to be more detailed and effective for code generation.
 *
 * - enhanceUserPrompt - Function to take a user prompt and return an enhanced version.
 * - EnhancePromptInput - Input type for enhanceUserPrompt.
 * - EnhancePromptOutput - Output type for enhanceUserPrompt.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {HUNDRED_RULES, ADVANCED_UI_UX_GUIDELINES} from './promptSnippets';

const EnhancePromptInputSchema = z.object({
  userInputPrompt: z.string().describe('The initial prompt provided by the user that needs enhancement.'),
});
export type EnhancePromptInput = z.infer<typeof EnhancePromptInputSchema>;

const EnhancePromptOutputSchema = z.object({
  enhancedPrompt: z.string().describe('The enhanced, more detailed prompt suitable for high-quality code generation.'),
});
export type EnhancePromptOutput = z.infer<typeof EnhancePromptOutputSchema>;

export async function enhanceUserPrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput> {
  return enhanceUserPromptFlow(input);
}

const allBlockNoneSafetySettings = [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
];

const enhanceUserPromptPrompt = ai.definePrompt({
  name: 'enhanceUserPromptPrompt',
  input: {schema: EnhancePromptInputSchema},
  output: {schema: EnhancePromptOutputSchema},
  config: {
    safetySettings: allBlockNoneSafetySettings,
  },
  prompt: `You are an AI assistant specialized in crafting EXCEPTIONALLY DETAILED and EFFECTIVE prompts for code generation.
Your task is to take the user's initial, potentially vague prompt and transform it into a comprehensive, specific, and actionable prompt that, when given to another AI code generator, will result in a feature-rich, visually stunning, and robust web application or component, adhering strictly to the provided 100 Rules and Advanced UI/UX Guidelines.

User's Initial Prompt:
\`\`\`
{{{userInputPrompt}}}
\`\`\`

Your Goal:
Rewrite and expand the user's initial prompt. The ENHANCED prompt you generate MUST:
1.  **Preserve Core Intent:** Understand and maintain the fundamental goal of the user's original request.
2.  **Massively Expand Detail:** Add significant detail. Think about:
    *   Specific UI elements, their appearance, and behavior.
    *   Interactions, animations, and transitions.
    *   Layout, responsiveness, and a11y considerations.
    *   Edge cases, loading states, empty states, error handling.
    *   Potential features the user might not have thought of but would enhance the application.
    *   Data structures (if applicable, even if conceptual).
    *   Specific technologies or libraries if implied or beneficial (though prioritize self-contained HTML/CSS/JS).
3.  **Incorporate 100 Rules & UI/UX Guidelines:** Explicitly or implicitly guide the code generation AI to follow ALL of the 100 Rules and Advanced UI/UX Guidelines provided below. The enhanced prompt should make adherence to these rules almost unavoidable for the code generator.
4.  **Actionable & Clear:** The enhanced prompt must be clear, unambiguous, and directly usable by a code generation AI.
5.  **Length & Scope:** The enhanced prompt should be significantly longer and more detailed than the original. It should describe a complete, polished piece of functionality.
6.  **Output Format:** Your response MUST be ONLY the enhanced prompt string. Do not include any other text, greetings, or explanations.

The 100 Rules:
${HUNDRED_RULES}

Advanced UI/UX Guidelines:
${ADVANCED_UI_UX_GUIDELINES}

Based on the user's input ("{{{userInputPrompt}}}"), generate the enhanced prompt.

Enhanced Prompt (ONLY the prompt string):
`,
});

const enhanceUserPromptFlow = ai.defineFlow(
  {
    name: 'enhanceUserPromptFlow',
    inputSchema: EnhancePromptInputSchema,
    outputSchema: EnhancePromptOutputSchema,
  },
  async (input: EnhancePromptInput): Promise<EnhancePromptOutput> => {
    console.log(`[enhanceUserPromptFlow] Enhancing user prompt: "${input.userInputPrompt.substring(0, 100)}..."`);
    try {
      const {output} = await enhanceUserPromptPrompt(input);

      if (!output || typeof output.enhancedPrompt !== 'string') {
        console.error('[enhanceUserPromptFlow] CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_INVALID_STRUCTURE_FOR_ENHANCED_PROMPT. Output was:', output);
        return {enhancedPrompt: `Error: Could not enhance prompt. AI returned invalid structure. Original: ${input.userInputPrompt}`};
      }
      
      if (output.enhancedPrompt.trim() === '') {
        console.warn('[enhanceUserPromptFlow] AI returned an empty string for enhanced prompt. Returning original prompt with a warning.');
        return {enhancedPrompt: `Warning: AI returned an empty enhanced prompt. Original: ${input.userInputPrompt}`};
      }

      console.log(`[enhanceUserPromptFlow] Prompt enhancement successful. New prompt length: ${output.enhancedPrompt.length}`);
      return output;

    } catch (error: any) {
      let errorMessage = `Unknown error occurred during prompt enhancement flow for prompt: ${input.userInputPrompt.substring(0,50)}.`;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) { /* ignore stringify error */ }
      }
      console.error(`[enhanceUserPromptFlow] Critical error in flow for prompt "${input.userInputPrompt.substring(0,50)}":`, errorMessage);
      return {enhancedPrompt: `Error during prompt enhancement: ${errorMessage}. Original: ${input.userInputPrompt}`};
    }
  }
);
