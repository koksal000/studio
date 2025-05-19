
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

  const parseHtmlString = useCallback((htmlString: string | null): GeneratedFile[] => {
    if (!htmlString || typeof htmlString !== 'string' || htmlString.trim() === '') {
      return [];
    }
    return [{ fileName: 'index.html', content: htmlString.trim() }];
  }, []);

  useEffect(() => {
    let newPreviewUrl: string | null = null;
    if (generatedCode) {
      const files = parseHtmlString(generatedCode);
      setGeneratedFiles(files);
      if (files.length > 0 && files[0].content && !files[0].content.startsWith('<!-- Error:') && !files[0].content.startsWith('<!-- WARNING:') && !files[0].content.startsWith('<!-- CRITICAL_ERROR:')) {
        try {
          const blob = new Blob([files[0].content], { type: 'text/html' });
          newPreviewUrl = URL.createObjectURL(blob);
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
      return newPreviewUrl;
    });

    return () => {
      if (newPreviewUrl) {
        URL.revokeObjectURL(newPreviewUrl);
      }
    };
  }, [generatedCode, parseHtmlString]);


  const handleGenerateCode = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedCode(null);
    setPreviousGeneratedCode(null);
    setRefactoredCode(null); 

    try {
      const result: GenerateCodeOutput = await generateCode({ prompt });
      if (result && typeof result.code === 'string') {
        setGeneratedCode(result.code);
        if (result.code.trim() === '' || result.code.startsWith('<!-- Error:') || result.code.startsWith('<!-- WARNING:') || result.code.startsWith('<!-- CRITICAL_ERROR:')) {
          setError(result.code.trim() === '' ? 'AI returned empty content.' : `Error from AI: ${result.code}`);
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
    setRefactoredCode(null); 

    try {
      const currentCodeToRefactor = generatedCode; 
      const result: RefactorCodeOutput = await refactorCode({ code: currentCodeToRefactor, prompt: refactorPrompt });
      if (result && typeof result.code === 'string') {
        setRefactoredCode(result.code); 
        if (result.code.trim() === '' || result.code.startsWith('<!-- Error:') || result.code.startsWith('<!-- WARNING:') || result.code.startsWith('<!-- CRITICAL_ERROR:')) {
           setRefactorError(result.code.trim() === '' ? 'AI returned empty refactored code.' : `Error from AI: ${result.code}`);
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
      setRefactorError(null);
      setRefactoredCode(null); 
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
    if (generatedCode) {
      const files = parseHtmlString(generatedCode);
      if (files.length > 0 && files[0].content && !files[0].content.startsWith('<!-- Error:') && !files[0].content.startsWith('<!-- WARNING:') && !files[0].content.startsWith('<!-- CRITICAL_ERROR:')) {
        try {
          const blob = new Blob([files[0].content], { type: 'text/html' });
          const newUrl = URL.createObjectURL(blob);
          setPreviewUrl(oldUrl => {
            if (oldUrl) URL.revokeObjectURL(oldUrl);
            return newUrl;
          });
        } catch (e) {
          console.error("Error creating blob for preview (updatePreview):", e);
          setError("Could not create preview from the generated content.");
           setPreviewUrl(oldUrl => {
            if (oldUrl) URL.revokeObjectURL(oldUrl);
            return null;
          });
        }
      } else {
        setPreviewUrl(oldUrl => {
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          return null;
        });
      }
    } else {
       setPreviewUrl(oldUrl => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return null;
      });
    }
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
