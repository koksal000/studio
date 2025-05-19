'use server';

/**
 * @fileOverview Mevcut bir kodu geliştirmek ve tamamlamak için bir AI akışı.
 *
 * - enhanceCode - Kodu geliştirmek için ana fonksiyon.
 * - EnhanceCodeInput - enhanceCode fonksiyonu için giriş tipi.
 * - EnhanceCodeOutput - enhanceCode fonksiyonu için dönüş tipi.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {HUNDRED_RULES, ADVANCED_UI_UX_GUIDELINES} from './promptSnippets'; // Assuming these are extracted

const EnhanceCodeInputSchema = z.object({
  currentCode: z.string().describe('Geliştirilecek veya tamamlanacak mevcut HTML, CSS ve JS kodu.'),
  originalUserPrompt: z.string().describe('Mevcut kodun üretilmesine yol açan orijinal kullanıcı istemi.'),
});
export type EnhanceCodeInput = z.infer<typeof EnhanceCodeInputSchema>;

const EnhanceCodeOutputSchema = z.object({
  enhancedCode: z.string().describe('Geliştirilmiş ve tamamlanmış, tüm HTML, CSS ve JS\'yi içeren kod. Tam bir HTML dokümanı olmalıdır.'),
});
export type EnhanceCodeOutput = z.infer<typeof EnhanceCodeOutputSchema>;

export async function enhanceCode(input: EnhanceCodeInput): Promise<EnhanceCodeOutput> {
  return enhanceCodeFlow(input);
}

const enhanceCodePrompt = ai.definePrompt({
  name: 'enhanceCodePrompt',
  input: {schema: EnhanceCodeInputSchema},
  output: {schema: EnhanceCodeOutputSchema},
  prompt: `You are an EXCEPTIONAL AI Code Enhancer, Completer, and Extender.
Your primary directive is to take the provided HTML/CSS/JS code, which was generated based on an original user prompt, and SIGNIFICANTLY enhance, complete, and expand upon it to create a truly professional, feature-rich, and visually stunning web application or website section.

Original User Prompt (for context on desired outcome):
{{{originalUserPrompt}}}

Current Code to Enhance/Complete:
\`\`\`html
{{{currentCode}}}
\`\`\`

Your Task:
1.  **Complete Incomplete Code:** If the current code appears unfinished (e.g., missing closing tags, incomplete JavaScript logic, unstyled elements), robustly complete it. Ensure all parts are functional and well-integrated.
2.  **Massively Expand Features & Content:** Go far beyond simple completion. Proactively add new, relevant UI elements, sophisticated interactions, user-friendly functionalities, and meaningful content that would elevate the current code into a more comprehensive and impressive product. Think about what a user would implicitly want or what would make the experience significantly better.
3.  **Strictly Adhere to the 100 Rules & Advanced UI/UX Guidelines:** These are paramount. Ensure every aspect of the enhanced code meticulously follows these principles.
    ${HUNDRED_RULES}
    ${ADVANCED_UI_UX_GUIDELINES}
4.  **Aim for Substantial Improvement:** The goal is not minor tweaks. Strive for a significant increase in code length (aim for 1000-3000+ additional lines if the starting code is short, or a 50-100%+ increase for longer code), features, and overall polish. If the original code is already good, make it outstanding by adding more "wow" factor, delightful micro-interactions, and even more comprehensive features.
5.  **Maintain Self-Contained HTML:** The final output MUST be a single HTML string, starting with \`<!DOCTYPE html>\` and ending with \`</html>\`. All CSS must be within \`<style>\` tags in the \`<head>\`, and all JavaScript must be within \`<script>\` tags (preferably before the closing \`</body>\` tag, unless essential for initial rendering). NO EXTERNAL FILES.

Your JSON Response (ONLY THE JSON OBJECT containing the enhanced HTML):
{
  "enhancedCode": "YOUR_ENTIRE_ENHANCED_SELF_CONTAINED_HTML_CODE_HERE"
}

If, for any reason, you absolutely CANNOT enhance or complete the code as requested (e.g., the request is fundamentally impossible or violates safety policies), then the "enhancedCode" value in your JSON response MUST be a single HTML comment EXPLAINING THE REASON (e.g., { "enhancedCode": "<!-- Error: Could not enhance due to conflicting requirements. -->" }). Otherwise, ALWAYS provide the full HTML.`,
});

const enhanceCodeFlow = ai.defineFlow(
  {
    name: 'enhanceCodeFlow',
    inputSchema: EnhanceCodeInputSchema,
    outputSchema: EnhanceCodeOutputSchema,
  },
  async (input: EnhanceCodeInput): Promise<EnhanceCodeOutput> => {
    console.log('[enhanceCodeFlow] Starting code enhancement. Original prompt:', input.originalUserPrompt, 'Current code length:', input.currentCode.length);
    try {
      const {output} = await enhanceCodePrompt(input);

      if (!output || typeof output.enhancedCode !== 'string') {
        console.error('[enhanceCodeFlow] CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_INVALID_STRUCTURE_FOR_ENHANCED_CODE. Output was:', output);
        return {enhancedCode: `<!-- CRITICAL_ERROR: AI model returned invalid structure for enhanced code. Original code preserved. -->\n${input.currentCode}`};
      }

      if (output.enhancedCode.trim() === '') {
        console.warn('[enhanceCodeFlow] AI returned an empty string for enhanced code. Returning original code with warning.');
        return {enhancedCode: `<!-- WARNING: AI_MODEL_RETURNED_EMPTY_STRING_FOR_ENHANCEMENT. Original code preserved. -->\n${input.currentCode}`};
      }
      
      // Check if AI returned an error comment
      if (output.enhancedCode.startsWith('<!-- Error:') || output.enhancedCode.startsWith('<!-- CRITICAL_ERROR:') || output.enhancedCode.startsWith('<!-- WARNING:')) {
        console.warn('[enhanceCodeFlow] AI returned an error/warning comment for enhancement:', output.enhancedCode);
        // Prepend original code if AI returns an error, to avoid losing user's current state.
        return { enhancedCode: `${output.enhancedCode}\n${input.currentCode}` };
      }

      console.log(`[enhanceCodeFlow] Code enhancement successful. New code length: ${output.enhancedCode.length}`);
      return output;
    } catch (error: any) {
      let errorMessage = 'Unknown error occurred during code enhancement flow.';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.stack) {
          console.error('[enhanceCodeFlow] Error stack:', error.stack);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) { /* ignore stringify error */ }
      }
      console.error('[enhanceCodeFlow] Critical error in flow:', errorMessage);
      return {enhancedCode: `<!-- ERROR_DURING_ENHANCEMENT_FLOW: ${errorMessage.replace(/-->/g, '--&gt;')} -->\n${input.currentCode}`};
    }
  }
);
