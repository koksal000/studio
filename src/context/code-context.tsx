'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { generateCode, GenerateCodeInput, GenerateCodeOutput } from '@/ai/flows/generate-code-from-prompt';
import { refactorCode, RefactorCodeInput, RefactorCodeOutput } from '@/ai/flows/refactor-code';
import { enhanceCode, EnhanceCodeInput, EnhanceCodeOutput } from '@/ai/flows/enhance-code';
import { enhanceUserPrompt, EnhancePromptInput, EnhancePromptOutput } from '@/ai/flows/enhance-prompt-flow';


export interface GeneratedFile {
  fileName: string;
  content: string;
}

interface CodeContextType {
  prompt: string;
  setPrompt: (prompt: string) => void;
  generatedCode: string | null;
  generatedFiles: GeneratedFile[];
  isLoading: boolean;
  error: string | null;
  previewUrl: string | null;
  handleGenerateCode: () => Promise<void>;
  downloadCode: () => Promise<void>;
  updatePreview: () => void;

  isRefactorModalOpen: boolean;
  setIsRefactorModalOpen: (isOpen: boolean) => void;
  refactorPrompt: string;
  setRefactorPrompt: (prompt: string) => void;
  refactoredCode: string | null;
  isRefactoring: boolean;
  refactorError: string | null;
  handleRefactorCode: () => Promise<void>;
  applyRefactor: () => void;

  previousGeneratedCode: string | null;
  undoRefactor: () => void;

  futureGeneratedCode: string[];
  redoChange: () => void;

  isEnhancing: boolean;
  enhanceError: string | null;
  handleEnhanceCode: () => Promise<void>;

  isEnhancingPrompt: boolean;
  enhancePromptError: string | null;
  handleEnhancePrompt: () => Promise<void>;
}

const CodeContext = createContext<CodeContextType | undefined>(undefined);

export const CodeProvider = ({ children }: { children: ReactNode }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [previousGeneratedCode, setPreviousGeneratedCode] = useState<string | null>(null);
  const [futureGeneratedCode, setFutureGeneratedCode] = useState<string[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isRefactorModalOpen, setIsRefactorModalOpen] = useState<boolean>(false);
  const [refactorPrompt, setRefactorPrompt] = useState<string>('');
  const [refactoredCode, setRefactoredCode] = useState<string | null>(null);
  const [isRefactoring, setIsRefactoring] = useState<boolean>(false);
  const [refactorError, setRefactorError] = useState<string | null>(null);

  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [enhancePromptError, setEnhancePromptError] = useState<string | null>(null);


  const parseHtmlString = useCallback((htmlString: string | null): GeneratedFile[] => {
    if (!htmlString || typeof htmlString !== 'string' || htmlString.trim() === '') {
      return [];
    }
    return [{ fileName: 'index.html', content: htmlString.trim() }];
  }, []);

  useEffect(() => {
    let newPreviewUrlObj: { url: string | null } = { url: null };

    if (generatedCode) {
      const files = parseHtmlString(generatedCode);
      setGeneratedFiles(files);
      if (files.length > 0 && files[0].content && !files[0].content.startsWith('<!-- Error:') && !files[0].content.startsWith('<!-- WARNING:') && !files[0].content.startsWith('<!-- CRITICAL_ERROR:')) {
        try {
          const blob = new Blob([files[0].content], { type: 'text/html' });
          newPreviewUrlObj.url = URL.createObjectURL(blob);
        } catch (e) {
          console.error("Error creating blob for preview (useEffect generatedCode):", e);
          setError("Could not create preview from the generated content.");
        }
      }
    } else {
      setGeneratedFiles([]);
    }

    setPreviewUrl(currentOldUrl => {
      if (currentOldUrl) {
        URL.revokeObjectURL(currentOldUrl);
      }
      return newPreviewUrlObj.url;
    });

    return () => {
      if (newPreviewUrlObj.url) {
        URL.revokeObjectURL(newPreviewUrlObj.url);
      }
    };
  }, [generatedCode, parseHtmlString]);

  const handleGenerateCode = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }

    // Reset all states for a new generation
    setIsLoading(true);
    setError(null);
    setGeneratedCode(null);
    setPreviousGeneratedCode(null);
    setFutureGeneratedCode([]);
    setRefactoredCode(null);
    setEnhanceError(null);
    setEnhancePromptError(null);

    try {
      // Perform a single, comprehensive generation call
      const result = await generateCode({ prompt } as GenerateCodeInput);

      if (result && typeof result.code === 'string') {
        setGeneratedCode(result.code);
        // If the AI returns an error comment, display it in the error area as well
        if (result.code.trim() === '' || result.code.startsWith('<!-- Error:') || result.code.startsWith('<!-- WARNING:') || result.code.startsWith('<!-- CRITICAL_ERROR:')) {
            setError(result.code);
        }
      } else {
        const nullErrorMsg = 'CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_INVALID_CODE_PROPERTY (GenerateCode).';
        setError(nullErrorMsg);
        setGeneratedCode(`<!-- ${nullErrorMsg} -->`);
      }
    } catch (err) {
      console.error('Error in handleGenerateCode:', err);
      const errorMessage = `Failed to generate code. ${err instanceof Error ? err.message : 'An unexpected error occurred.'}`;
      setError(errorMessage);
      setGeneratedCode(`<!-- Context Error (GenerateCode): ${errorMessage.replace(/-->/g, '--&gt;')} -->`);
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleRefactorCode = async () => {
    if (!refactorPrompt) {
      setRefactorError('Please enter refactoring instructions.');
      return;
    }
    if (!generatedCode) {
      setRefactorError('No code available to refactor.');
      return;
    }

    setIsRefactoring(true);
    setRefactorError(null);
    setEnhanceError(null);
    setEnhancePromptError(null);
    setRefactoredCode(null);

    try {
      const currentCodeToRefactor = generatedCode;
      const result: RefactorCodeOutput = await refactorCode({ code: currentCodeToRefactor, prompt: refactorPrompt } as RefactorCodeInput);
      if (result && typeof result.code === 'string') {
        setRefactoredCode(result.code);
        if (result.code.trim() === '' || result.code.startsWith('<!-- Error:') || result.code.startsWith('<!-- WARNING:') || result.code.startsWith('<!-- CRITICAL_ERROR:')) {
           setRefactorError(result.code.trim() === '' ? 'AI returned empty refactored code.' : result.code);
        }
      } else {
        const nullErrorMsg = 'CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_INVALID_CODE_PROPERTY_FOR_REFACTOR.';
        setRefactorError(nullErrorMsg);
        setRefactoredCode(`<!-- ${nullErrorMsg} -->\n${currentCodeToRefactor || ''}`);
      }
    } catch (err) {
      console.error('Error in handleRefactorCode:', err);
      const errorMessage = `Failed to refactor code. ${err instanceof Error ? err.message : 'An unexpected error occurred.'}`;
      setRefactorError(errorMessage);
      setRefactoredCode(`<!-- Context Error during refactor: ${errorMessage.replace(/-->/g, '--&gt;')} -->\n${generatedCode || ''}`);
    } finally {
      setIsRefactoring(false);
    }
  };

  const applyRefactor = () => {
    if (refactoredCode && typeof refactoredCode === 'string' && !(refactoredCode.startsWith('<!-- Error:') || refactoredCode.startsWith('<!-- WARNING:') || refactoredCode.startsWith('<!-- CRITICAL_ERROR:'))) {
      setPreviousGeneratedCode(generatedCode);
      setGeneratedCode(refactoredCode);
      setFutureGeneratedCode([]); // Clear redo stack on applying refactor
      setRefactoredCode(null);
      setRefactorPrompt('');
      setIsRefactorModalOpen(false);
      setError(null);
      setRefactorError(null);
      setEnhanceError(null);
      setEnhancePromptError(null);
    } else {
      setRefactorError(refactoredCode === null ? "Cannot apply changes: No refactored code available." : "Cannot apply changes: Refactored code contains errors or is empty.");
    }
  };

  const handleEnhanceCode = async () => {
    if (!generatedCode) {
      setEnhanceError('No code available to enhance.');
      return;
    }
    if (!prompt) { // Using original prompt state for enhancement context
      setEnhanceError('Original prompt is missing, cannot enhance.');
      return;
    }

    setIsEnhancing(true);
    setEnhanceError(null);
    setError(null); 
    setRefactorError(null); 
    setEnhancePromptError(null);

    try {
      const currentCodeToEnhance = generatedCode;
      const result: EnhanceCodeOutput = await enhanceCode({
        currentCode: currentCodeToEnhance,
        originalUserPrompt: prompt, 
      } as EnhanceCodeInput);

      if (result && typeof result.enhancedCode === 'string') {
        if (result.enhancedCode.trim() === '' || result.enhancedCode.startsWith('<!-- Error:') || result.enhancedCode.startsWith('<!-- WARNING:') || result.enhancedCode.startsWith('<!-- CRITICAL_ERROR:')) {
          setEnhanceError(result.enhancedCode.trim() === '' ? 'AI returned empty enhanced code.' : result.enhancedCode);
        } else {
          setPreviousGeneratedCode(currentCodeToEnhance);
          setGeneratedCode(result.enhancedCode);
          setFutureGeneratedCode([]); 
        }
      } else {
        const nullErrorMsg = 'CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_INVALID_STRUCTURE_FOR_ENHANCED_CODE.';
        setEnhanceError(nullErrorMsg);
      }
    } catch (err) {
      console.error('Error in handleEnhanceCode:', err);
      const errorMessage = `Failed to enhance code. ${err instanceof Error ? err.message : 'An unexpected error occurred.'}`;
      setEnhanceError(errorMessage);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt) {
      setEnhancePromptError('Please enter a prompt to enhance.');
      return;
    }
    setIsEnhancingPrompt(true);
    setEnhancePromptError(null);
    setError(null);
    setRefactorError(null);
    setEnhanceError(null);

    try {
      const result: EnhancePromptOutput = await enhanceUserPrompt({ userInputPrompt: prompt } as EnhancePromptInput);
      if (result && typeof result.enhancedPrompt === 'string') {
        if (result.enhancedPrompt.startsWith('Error:') || result.enhancedPrompt.startsWith('Warning:')) {
            setEnhancePromptError(result.enhancedPrompt);
        } else {
            setPrompt(result.enhancedPrompt);
        }
      } else {
        const nullErrorMsg = 'CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_INVALID_STRUCTURE_FOR_ENHANCED_PROMPT.';
        setEnhancePromptError(nullErrorMsg);
      }
    } catch (err) {
      console.error('Error in handleEnhancePrompt:', err);
      const errorMessage = `Failed to enhance prompt. ${err instanceof Error ? err.message : 'An unexpected error occurred.'}`;
      setEnhancePromptError(errorMessage);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };


  const undoRefactor = () => {
    if (previousGeneratedCode !== null) {
      if (generatedCode !== null) {
        setFutureGeneratedCode(prev => [generatedCode, ...prev]);
      }
      setGeneratedCode(previousGeneratedCode);
      setPreviousGeneratedCode(null);
      setError(null);
      setRefactorError(null);
      setRefactoredCode(null);
      setEnhanceError(null);
      setEnhancePromptError(null);
    }
  };

  const redoChange = () => {
    if (futureGeneratedCode.length > 0) {
      const nextState = futureGeneratedCode[0];
      const newFutureStack = futureGeneratedCode.slice(1);
      if (generatedCode !== null) {
         setPreviousGeneratedCode(generatedCode);
      }
      setGeneratedCode(nextState);
      setFutureGeneratedCode(newFutureStack);
      setError(null);
      setRefactorError(null);
      setEnhanceError(null);
      setEnhancePromptError(null);
    }
  };

  const downloadCode = async () => {
    if (!generatedCode || typeof generatedCode !== 'string' || generatedCode.trim() === '') {
      setError('No valid code generated to download.');
      return;
    }
    if (generatedCode.startsWith('<!-- Error:') || generatedCode.startsWith('<!-- WARNING:') || generatedCode.startsWith('<!-- CRITICAL_ERROR:')) {
        setError('Cannot download code containing errors.');
        return;
    }
    try {
      const blob = new Blob([generatedCode], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'index.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Error creating download link:', err);
      setError('Failed to prepare file for download.');
    }
  };

  const updatePreview = useCallback(() => {
    let newUrlObj: { url: string | null } = { url: null };
    if (generatedCode) {
      const files = parseHtmlString(generatedCode);
      if (files.length > 0 && files[0].content && !files[0].content.startsWith('<!-- Error:') && !files[0].content.startsWith('<!-- WARNING:') && !files[0].content.startsWith('<!-- CRITICAL_ERROR:')) {
        try {
          const blob = new Blob([files[0].content], { type: 'text/html' });
          newUrlObj.url = URL.createObjectURL(blob);
        } catch (e) {
          console.error("Error creating blob for preview (updatePreview):", e);
          setError("Could not create preview from the generated content.");
        }
      }
    }
    setPreviewUrl(oldUrl => {
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      return newUrlObj.url;
    });
  }, [generatedCode, parseHtmlString, setError]);

  return (
    <CodeContext.Provider
      value={{
        prompt,
        setPrompt,
        generatedCode,
        generatedFiles,
        isLoading,
        error,
        previewUrl,
        handleGenerateCode,
        downloadCode,
        updatePreview,
        isRefactorModalOpen,
        setIsRefactorModalOpen,
        refactorPrompt,
        setRefactorPrompt,
        refactoredCode,
        isRefactoring,
        refactorError,
        handleRefactorCode,
        applyRefactor,
        previousGeneratedCode,
        undoRefactor,
        futureGeneratedCode,
        redoChange,
        isEnhancing,
        enhanceError,
        handleEnhanceCode,
        isEnhancingPrompt,
        enhancePromptError,
        handleEnhancePrompt,
      }}
    >
      {children}
    </CodeContext.Provider>
  );
};

export const useCodeContext = (): CodeContextType => {
  const context = useContext(CodeContext);
  if (context === undefined) {
    throw new Error('useCodeContext must be used within a CodeProvider');
  }
  return context;
};

    