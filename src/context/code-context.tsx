'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { generateCode } from '@/ai/flows/generate-code-from-prompt';
import type { GenerateCodeOutput } from '@/ai/flows/generate-code-from-prompt'; // Will be string
import { refactorCode } from '@/ai/flows/refactor-code';
import type { RefactorCodeOutput } from '@/ai/flows/refactor-code'; // Will be string

export interface GeneratedFile {
  fileName: string;
  content: string;
}

interface CodeContextType {
  prompt: string;
  setPrompt: (prompt: string) => void;
  generatedCode: string;
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
  refactoredCode: string | null; // Stores the proposed refactored code (string)
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
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [previousGeneratedCode, setPreviousGeneratedCode] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isRefactorModalOpen, setIsRefactorModalOpen] = useState<boolean>(false);
  const [refactorPrompt, setRefactorPrompt] = useState<string>('');
  const [refactoredCode, setRefactoredCode] = useState<string | null>(null); // Now stores string
  const [isRefactoring, setIsRefactoring] = useState<boolean>(false);
  const [refactorError, setRefactorError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
     updatePreviewInternal(parseGeneratedCode(generatedCode));
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [generatedCode]);


  const parseGeneratedCode = (code: string): GeneratedFile[] => {
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return [];
    }
    return [{ fileName: 'index.html', content: code.trim() }];
  };

  const updatePreviewInternal = useCallback((files: GeneratedFile[]) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (files.length === 0 || !files[0].content || typeof files[0].content !== 'string') {
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
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]);


  const handleGenerateCode = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedCode('');
    setPreviousGeneratedCode(null);
    setGeneratedFiles([]);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    try {
      const resultCode: GenerateCodeOutput = await generateCode({ prompt }); // generateCode now returns Promise<string>
      if (typeof resultCode === 'string') {
        setGeneratedCode(resultCode);
        setGeneratedFiles(parseGeneratedCode(resultCode));
      } else {
        // This case should ideally not be reached if generateCode adheres to its return type
        console.error('Error generating code: AI returned non-string output despite schema.', resultCode);
        setError('Failed to generate code: AI returned an unexpected format.');
        const errorHtml = '<!-- AI returned unexpected non-string output -->';
        setGeneratedCode(errorHtml);
        setGeneratedFiles(parseGeneratedCode(errorHtml));
      }
    } catch (err) {
      console.error('Error generating code:', err);
      const errorMessage = `Failed to generate code. ${err instanceof Error ? err.message : 'Please try again.'}`;
      setError(errorMessage);
      const errorHtml = `<!-- Error: ${errorMessage} -->`;
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
    if (!generatedCode) {
      setRefactorError('No code available to refactor.');
      return;
    }

    setIsRefactoring(true);
    setRefactorError(null);
    setRefactoredCode(null);

    try {
      const resultRefactoredCode: RefactorCodeOutput = await refactorCode({ code: generatedCode, prompt: refactorPrompt }); // refactorCode now returns Promise<string>
      if (typeof resultRefactoredCode === 'string') {
        setRefactoredCode(resultRefactoredCode);
      } else {
        // This case should ideally not be reached
        console.error('Error refactoring code: AI returned non-string refactored code.', resultRefactoredCode);
        setRefactorError('Failed to refactor code: AI returned an unexpected format.');
        setRefactoredCode(`<!-- AI returned non-string refactored code -->\n${generatedCode}`);
      }
    } catch (err) {
      console.error('Error refactoring code:', err);
      const errorMessage = `Failed to refactor code. ${err instanceof Error ? err.message : 'Please try again.'}`;
      setRefactorError(errorMessage);
      setRefactoredCode(`<!-- Error: ${errorMessage} -->\n${generatedCode}`);
    } finally {
      setIsRefactoring(false);
    }
  };

  const applyRefactor = () => {
    if (refactoredCode !== null && typeof refactoredCode === 'string') {
      setPreviousGeneratedCode(generatedCode);
      setGeneratedCode(refactoredCode);
      setGeneratedFiles(parseGeneratedCode(refactoredCode));
      setRefactoredCode(null);
      setRefactorPrompt('');
      setIsRefactorModalOpen(false);
    } else {
      setRefactorError("Cannot apply changes: No valid refactored code available.");
    }
  };

  const undoRefactor = () => {
    if (previousGeneratedCode !== null) {
      setGeneratedCode(previousGeneratedCode);
      setGeneratedFiles(parseGeneratedCode(previousGeneratedCode));
      setPreviousGeneratedCode(null);
    }
  };

  const downloadCode = async () => {
    if (!generatedCode || typeof generatedCode !== 'string') {
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
     updatePreviewInternal(generatedFiles);
   }, [generatedFiles, updatePreviewInternal]);

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
