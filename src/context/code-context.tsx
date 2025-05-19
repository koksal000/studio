
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { generateCode } from '@/ai/flows/generate-code-from-prompt';
import type { GenerateCodeOutput } from '@/ai/flows/generate-code-from-prompt'; // Will be string | null
import { refactorCode } from '@/ai/flows/refactor-code';
import type { RefactorCodeOutput } from '@/ai/flows/refactor-code'; // Will be string | null

export interface GeneratedFile {
  fileName: string;
  content: string;
}

interface CodeContextType {
  prompt: string;
  setPrompt: (prompt: string) => void;
  generatedCode: string | null; // Can be null
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
  const [refactoredCode, setRefactoredCode] = useState<string | null>(null);
  const [isRefactoring, setIsRefactoring] = useState<boolean>(false);
  const [refactorError, setRefactorError] = useState<string | null>(null);

  const parseGeneratedCode = useCallback((code: string | null): GeneratedFile[] => {
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return [];
    }
    return [{ fileName: 'index.html', content: code.trim() }];
  }, []);

  // Effect to update preview and generatedFiles when generatedCode changes
  useEffect(() => {
    // This function will be called when generatedCode changes.
    // It's responsible for revoking the old URL, parsing code, and setting the new URL.
    setPreviewUrl(currentOldUrl => {
      if (currentOldUrl) {
        URL.revokeObjectURL(currentOldUrl);
      }

      if (!generatedCode) {
        setGeneratedFiles([]);
        return null;
      }

      const files = parseGeneratedCode(generatedCode);
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
  }, [generatedCode, parseGeneratedCode, setError]);

  // Effect for unmount cleanup of the last previewUrl
  useEffect(() => {
    // Capture the previewUrl at the time the effect runs.
    // The cleanup function will then use this captured value.
    const urlToCleanOnUnmount = previewUrl;
    return () => {
      if (urlToCleanOnUnmount) {
        URL.revokeObjectURL(urlToCleanOnUnmount);
      }
    };
  }, [previewUrl]); // This effect re-subscribes if previewUrl changes.

  const handleGenerateCode = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedCode(null); // This will trigger the useEffect to clear/revoke preview
    setPreviousGeneratedCode(null);
    // generatedFiles and previewUrl are handled by the useEffect listening to generatedCode

    try {
      const resultCode: GenerateCodeOutput = await generateCode({ prompt });
      if (resultCode !== null) {
        setGeneratedCode(resultCode); // Triggers useEffect for preview and files
        if (resultCode.trim() === '' || resultCode.startsWith('<!-- Error:') || resultCode.startsWith('<!-- Warning:')) {
             setError(resultCode.trim() === '' ? 'AI returned empty content.' : resultCode);
        }
      } else {
        const nullErrorMsg = 'AI failed to generate content (returned null). Please try again or check the model.';
        setError(nullErrorMsg);
        setGeneratedCode('<!-- Error: AI returned null -->'); // Triggers useEffect
      }
    } catch (err) {
      console.error('Error in handleGenerateCode:', err);
      const errorMessage = `Failed to generate code. ${err instanceof Error ? err.message : 'An unexpected error occurred.'}`;
      setError(errorMessage);
      const errorHtml = `<!-- Context Error: ${errorMessage} -->`;
      setGeneratedCode(errorHtml); // Triggers useEffect
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
      const resultRefactoredCode: RefactorCodeOutput = await refactorCode({ code: generatedCode, prompt: refactorPrompt });
      if (resultRefactoredCode !== null) {
        setRefactoredCode(resultRefactoredCode);
         if (resultRefactoredCode.trim() === '' || resultRefactoredCode.startsWith('<!-- Error:') || resultRefactoredCode.startsWith('<!-- Warning:')) {
            setRefactorError(resultRefactoredCode.trim() === '' ? 'AI returned empty refactored code.' : resultRefactoredCode);
        }
      } else {
        const nullErrorMsg = 'AI failed to refactor code (returned null). Please try again or check the model.';
        setRefactorError(nullErrorMsg);
        setRefactoredCode(`<!-- Error: AI returned null during refactor. -->\n${generatedCode}`);
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
    if (refactoredCode !== null && typeof refactoredCode === 'string' && !refactoredCode.startsWith('<!-- Error:')) {
      setPreviousGeneratedCode(generatedCode);
      setGeneratedCode(refactoredCode); // Triggers useEffect for preview and files
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
      setGeneratedCode(previousGeneratedCode); // Triggers useEffect for preview and files
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
      URL.revokeObjectURL(link.href); // Clean up the object URL
    } catch (err) {
      console.error('Error creating download link:', err);
      setError('Failed to prepare file for download.');
    }
  };

  const updatePreview = useCallback(() => {
    // This function is for manual refresh. It re-processes the current generatedCode.
    setPreviewUrl(currentOldUrl => {
      if (currentOldUrl) {
        URL.revokeObjectURL(currentOldUrl);
      }
      if (!generatedCode) {
        // setGeneratedFiles([]); // This is handled by the main useEffect
        return null;
      }
      // We don't need to call setGeneratedFiles here again, as the main useEffect handles it.
      // Re-parsing is okay if parseGeneratedCode is cheap.
      const files = parseGeneratedCode(generatedCode);
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
  }, [generatedCode, parseGeneratedCode, setError]);

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
