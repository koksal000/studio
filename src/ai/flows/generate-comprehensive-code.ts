'use server';
/**
 * @fileOverview A comprehensive code generation flow that iteratively enhances the code.
 *
 * - generateComprehensiveCode - The main function that orchestrates the generation and enhancement process.
 * - GenerateComprehensiveCodeInput - The input type for the function.
 * - GenerateComprehensiveCodeOutput - The return type for the function.
 */

import {z} from 'genkit';
import {generateCode} from './generate-code-from-prompt';
import {enhanceCode} from './enhance-code';

const GenerateComprehensiveCodeInputSchema = z.object({
  prompt: z.string().describe('The user prompt describing the code to generate.'),
});
export type GenerateComprehensiveCodeInput = z.infer<typeof GenerateComprehensiveCodeInputSchema>;

const GenerateComprehensiveCodeOutputSchema = z.object({
  code: z.string().describe('The final, comprehensively generated and enhanced HTML code.'),
});
export type GenerateComprehensiveCodeOutput = z.infer<typeof GenerateComprehensiveCodeOutputSchema>;


const countLines = (text: string | null | undefined): number => {
  return text ? text.split('\n').length : 0;
};

const TARGET_LINE_COUNT = 2000;
const MAX_ENHANCE_ATTEMPTS = 2; // Initial gen + 2 enhancements

export async function generateComprehensiveCode(input: GenerateComprehensiveCodeInput): Promise<GenerateComprehensiveCodeOutput> {
  console.log('[generateComprehensiveCode] Starting comprehensive generation for prompt:', input.prompt);
  
  // 1. Initial Generation
  const initialResult = await generateCode({ prompt: input.prompt });

  if (!initialResult || typeof initialResult.code !== 'string' || initialResult.code.trim() === '' || initialResult.code.startsWith('<!--')) {
    const errorMsg = initialResult?.code || 'CRITICAL_ERROR: AI model returned invalid or empty code on initial generation.';
    console.error('[generateComprehensiveCode] Initial generation failed:', errorMsg);
    return { code: `<!-- Comprehensive Generation Failed (Initial Step): ${errorMsg.replace(/-->/g, '--&gt;')} -->` };
  }
  
  let currentCode: string = initialResult.code;
  let enhancementTries = 0;
  
  console.log(`[generateComprehensiveCode] Initial code generated. Line count: ${countLines(currentCode)}`);

  // 2. Iterative Enhancement Loop (on the server)
  while (
    countLines(currentCode) < TARGET_LINE_COUNT &&
    enhancementTries < MAX_ENHANCE_ATTEMPTS
  ) {
    enhancementTries++;
    console.log(`[generateComprehensiveCode] Attempting enhancement #${enhancementTries}. Current lines: ${countLines(currentCode)}`);

    const enhanceResult = await enhanceCode({
      currentCode: currentCode,
      originalUserPrompt: input.prompt,
    });

    if (enhanceResult && typeof enhanceResult.enhancedCode === 'string' && enhanceResult.enhancedCode.trim() !== '' && !enhanceResult.enhancedCode.startsWith('<!--')) {
        // Only update if the new code is substantially longer to avoid minor, useless enhancements
        if (countLines(enhanceResult.enhancedCode) > countLines(currentCode) + 50) {
            currentCode = enhanceResult.enhancedCode;
            console.log(`[generateComprehensiveCode] Enhancement #${enhancementTries} successful. New line count: ${countLines(currentCode)}`);
        } else {
            console.log(`[generateComprehensiveCode] Enhancement #${enhancementTries} did not significantly increase code length. Stopping loop.`);
            break;
        }
    } else {
      const errorMsg = enhanceResult?.enhancedCode || 'Enhancement step returned empty or error code.';
      console.warn(`[generateComprehensiveCode] Enhancement #${enhancementTries} failed:`, errorMsg);
      // Append a warning and stop the loop, but keep the last good code.
      currentCode += `\n<!-- WARNING: Enhancement attempt #${enhancementTries} failed. -->`;
      break; 
    }
  }

  console.log(`[generateComprehensiveCode] Finished comprehensive generation. Final line count: ${countLines(currentCode)}`);
  return { code: currentCode };
}
