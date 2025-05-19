
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { generateCode } from '@/ai/flows/generate-code-from-prompt';
import type { GenerateCodeOutput } from '@/ai/flows/generate-code-from-prompt';
import { refactorCode } from '@/ai/flows/refactor-code';
import type { RefactorCodeOutput } from '@/ai/flows/refactor-code';

export interface GeneratedFile {
  fileName: string;
  content: string;
}

interface CodeContextType {
  prompt: string;
  setPrompt: (prompt: string) => void;
  generatedCode: string | null; // Stores the HTML string directly
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
  refactoredCode: string | null; // Stores the refactored HTML string directly
  isRefactoring: boolean;
  refactorError: string | null;
  handleRefactorCode: () => Promise<void>;
  applyRefactor: () => void;
  previousGeneratedCode: string | null;
  undoRefactor: () => void;
}

const CodeContext = createContext<CodeContextType | undefined>(undefined);

export const CodeProvider = ({ children }: { children: ReactNode }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [previousGeneratedCode, setPreviousGeneratedCode] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isRefactorModalOpen, setIsRefactorModalOpen] = useState<boolean>(false);
  const [refactorPrompt, setRefactorPrompt] = useState<string>('');
  const [refactoredCode, setRefactoredCode] = useState<string | null>(null); // Stores the proposed refactored HTML string
  const [isRefactoring, setIsRefactoring] = useState<boolean>(false);
  const [refactorError, setRefactorError] = useState<string | null>(null);

  const parseHtmlString = useCallback((htmlString: string | null): GeneratedFile[] => {
    if (!htmlString || typeof htmlString !== 'string' || htmlString.trim() === '') {
      return [];
    }
    return [{ fileName: 'index.html', content: htmlString.trim() }];
  }, []);

  useEffect(() => {
    setPreviewUrl(currentOldUrl => {
      if (currentOldUrl) {
        URL.revokeObjectURL(currentOldUrl);
      }

      if (!generatedCode) {
        setGeneratedFiles([]);
        return null;
      }

      const files = parseHtmlString(generatedCode); // Use parseHtmlString
      setGeneratedFiles(files);

      if (files.length === 0 || !files[0].content) {
        return null;
      }

      const htmlFile = files[0];
      try {
        const blob = new Blob([htmlFile.content], { type: 'text/html' });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.error("Error creating blob for preview (useEffect generatedCode):", e);
        setError("Could not create preview from the generated content.");
        return null;
      }
    });
  }, [generatedCode, parseHtmlString, setError]);


  useEffect(() => {
    const urlToCleanOnUnmount = previewUrl;
    return () => {
      if (urlToCleanOnUnmount) {
        URL.revokeObjectURL(urlToCleanOnUnmount);
      }
    };
  }, [previewUrl]);

  const handleGenerateCode = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedCode(null);
    setPreviousGeneratedCode(null);

    try {
      const result: GenerateCodeOutput = await generateCode({ prompt }); // Expects { code: string }
      if (result && result.code) {
        setGeneratedCode(result.code);
        if (result.code.trim() === '' || result.code.startsWith('<!-- Error:') || result.code.startsWith('<!-- Warning:') || result.code.startsWith('<!-- CRITICAL_ERROR:')) {
             setError(result.code.trim() === '' ? 'AI returned empty content.' : result.code);
        }
      } else {
        const nullErrorMsg = 'CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_EMPTY_CODE. The AI model itself provided no content or an invalid structure.';
        setError(nullErrorMsg);
        setGeneratedCode(`<!-- ${nullErrorMsg} (handled in context) -->`);
      }
    } catch (err) {
      console.error('Error in handleGenerateCode:', err);
      const errorMessage = `Failed to generate code. ${err instanceof Error ? err.message : 'An unexpected error occurred.'}`;
      setError(errorMessage);
      setGeneratedCode(`<!-- Context Error: ${errorMessage} -->`);
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
    setRefactoredCode(null);

    try {
      const result: RefactorCodeOutput = await refactorCode({ code: generatedCode, prompt: refactorPrompt }); // Expects { code: string }
      if (result && result.code) {
        setRefactoredCode(result.code);
         if (result.code.trim() === '' || result.code.startsWith('<!-- Error:') || result.code.startsWith('<!-- Warning:') || result.code.startsWith('<!-- CRITICAL_ERROR:')) {
            setRefactorError(result.code.trim() === '' ? 'AI returned empty refactored code.' : result.code);
        }
      } else {
        const nullErrorMsg = 'CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_OR_EMPTY_CODE_FOR_REFACTOR. The AI model provided no content or an invalid structure for refactoring.';
        setRefactorError(nullErrorMsg);
        setRefactoredCode(`<!-- ${nullErrorMsg} (handled in context) -->\n${generatedCode}`);
      }
    } catch (err) {
      console.error('Error in handleRefactorCode:', err);
      const errorMessage = `Failed to refactor code. ${err instanceof Error ? err.message : 'An unexpected error occurred.'}`;
      setRefactorError(errorMessage);
      setRefactoredCode(`<!-- Context Error during refactor: ${errorMessage} -->\n${generatedCode}`);
    } finally {
      setIsRefactoring(false);
    }
  };

  const applyRefactor = () => {
    if (refactoredCode !== null && typeof refactoredCode === 'string' && !(refactoredCode.startsWith('<!-- Error:') || refactoredCode.startsWith('<!-- Warning:') || refactoredCode.startsWith('<!-- CRITICAL_ERROR:'))) {
      setPreviousGeneratedCode(generatedCode);
      setGeneratedCode(refactoredCode);
      setRefactoredCode(null);
      setRefactorPrompt('');
      setIsRefactorModalOpen(false);
      setError(null);
      setRefactorError(null);
    } else {
      setRefactorError(refactoredCode === null ? "Cannot apply changes: No refactored code available." : "Cannot apply changes: Refactored code contains errors or is empty.");
    }
  };

  const undoRefactor = () => {
    if (previousGeneratedCode !== null) {
      setGeneratedCode(previousGeneratedCode);
      setPreviousGeneratedCode(null);
      setError(null);
    }
  };

  const downloadCode = async () => {
    if (!generatedCode || typeof generatedCode !== 'string' || generatedCode.trim() === '') {
      setError('No valid code generated to download.');
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
    setPreviewUrl(currentOldUrl => {
      if (currentOldUrl) {
        URL.revokeObjectURL(currentOldUrl);
      }
      if (!generatedCode) {
        return null;
      }
      const files = parseHtmlString(generatedCode); // Use parseHtmlString
      if (files.length === 0 || !files[0].content) {
        return null;
      }
      const htmlFile = files[0];
      try {
        const blob = new Blob([htmlFile.content], { type: 'text/html' });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.error("Error creating blob for preview (updatePreview):", e);
        setError("Could not create preview from the generated content.");
        return null;
      }
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
