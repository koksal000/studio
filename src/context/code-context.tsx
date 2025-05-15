
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
  const [generatedCode, setGeneratedCode] = useState<string | null>(null); // Initialize to null
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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Renamed to avoid conflict and make clear it's internal
  const updatePreviewFromCode = useCallback((currentCode: string | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null); // Clear previous URL
    }

    const files = parseGeneratedCode(currentCode);
    if (files.length === 0 || !files[0].content) {
      setPreviewUrl(null);
      return;
    }

    const htmlFile = files[0];
    try {
      const blob = new Blob([htmlFile.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (e) {
      console.error("Error creating blob for preview:", e);
      setPreviewUrl(null);
      setError("Could not create preview from the generated content.");
    }
  }, [previewUrl]); // Removed setPreviewUrl from dependencies as it causes loops

  useEffect(() => {
     updatePreviewFromCode(generatedCode);
  }, [generatedCode, updatePreviewFromCode]);


  const parseGeneratedCode = (code: string | null): GeneratedFile[] => {
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return [];
    }
    return [{ fileName: 'index.html', content: code.trim() }];
  };

  const handleGenerateCode = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedCode(null); // Set to null initially
    setPreviousGeneratedCode(null);
    setGeneratedFiles([]);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    try {
      const resultCode: GenerateCodeOutput = await generateCode({ prompt }); // generateCode now returns Promise<string | null>
      
      if (resultCode !== null) {
        setGeneratedCode(resultCode);
        setGeneratedFiles(parseGeneratedCode(resultCode));
        if (resultCode.trim() === '' || resultCode.startsWith('<!-- Error:') || resultCode.startsWith('<!-- Warning:')) {
             // If AI returned an empty string or a known error/warning comment, show it in the error display
             setError(resultCode.trim() === '' ? 'AI returned empty content.' : resultCode);
        }
      } else {
        // Model explicitly returned null from the flow
        const nullErrorMsg = 'AI failed to generate content (returned null). Please try again or check the model.';
        setError(nullErrorMsg);
        setGeneratedCode('<!-- Error: AI returned null -->');
        setGeneratedFiles(parseGeneratedCode('<!-- Error: AI returned null -->'));
      }
    } catch (err) { // This catch is for unexpected errors in the generateCode call itself or context logic
      console.error('Error in handleGenerateCode:', err);
      const errorMessage = `Failed to generate code. ${err instanceof Error ? err.message : 'An unexpected error occurred.'}`;
      setError(errorMessage);
      const errorHtml = `<!-- Context Error: ${errorMessage} -->`;
      setGeneratedCode(errorHtml);
      setPreviousGeneratedCode(null);
      setGeneratedFiles(parseGeneratedCode(errorHtml));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefactorCode = async () => {
    if (!refactorPrompt) {
      setRefactorError('Please enter refactoring instructions.');
      return;
    }
    if (!generatedCode) { // Check if generatedCode is null or empty
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
      setGeneratedCode(refactoredCode);
      // generatedFiles will be updated by the useEffect on generatedCode
      setRefactoredCode(null);
      setRefactorPrompt('');
      setIsRefactorModalOpen(false);
      setError(null); // Clear general error if refactor is successful
      setRefactorError(null); // Clear refactor specific error
    } else {
      setRefactorError(refactoredCode === null ? "Cannot apply changes: No refactored code available." : "Cannot apply changes: Refactored code contains errors or is empty.");
    }
  };

  const undoRefactor = () => {
    if (previousGeneratedCode !== null) {
      setGeneratedCode(previousGeneratedCode);
      // generatedFiles will be updated by the useEffect on generatedCode
      setPreviousGeneratedCode(null);
      setError(null); // Clear general error
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
     updatePreviewFromCode(generatedCode);
   }, [generatedCode, updatePreviewFromCode]);

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
