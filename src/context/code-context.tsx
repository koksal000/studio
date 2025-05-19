
'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { generateCode } from '@/ai/flows/generate-code-from-prompt';
import type { GenerateCodeOutput } from '@/ai/flows/generate-code-from-prompt';
import { refactorCode } from '@/ai/flows/refactor-code';
import type { RefactorCodeOutput } from '@/ai/flows/refactor-code';
import { testApiConnection } from '@/ai/flows/test-api-flow'; // New import
import type { TestApiOutput } from '@/ai/flows/test-api-flow'; // New import

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

  // For API test
  isTestingApi: boolean;
  testApiResponse: string | null;
  testApiError: string | null;
  handleTestApiConnection: () => Promise<void>;
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

  // New state for API test
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [testApiResponse, setTestApiResponse] = useState<string | null>(null);
  const [testApiError, setTestApiError] = useState<string | null>(null);


  const parseGeneratedCode = useCallback((code: string | null): GeneratedFile[] => {
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return [];
    }
    return [{ fileName: 'index.html', content: code.trim() }];
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
      const resultCode: GenerateCodeOutput = await generateCode({ prompt });
      if (resultCode !== null) {
        setGeneratedCode(resultCode);
        if (resultCode.trim() === '' || resultCode.startsWith('<!-- Error:') || resultCode.startsWith('<!-- Warning:') || resultCode.startsWith('<!-- CRITICAL_ERROR:')) {
             setError(resultCode.trim() === '' ? 'AI returned empty content.' : resultCode);
        }
      } else {
        const nullErrorMsg = 'CRITICAL_ERROR: AI_MODEL_RETURNED_NULL. The AI model itself provided no content for the initial generation. This usually indicates an API key issue, a problem with the AI model\'s ability to handle the request, or a temporary service disruption.';
        setError(nullErrorMsg);
        setGeneratedCode('<!-- CRITICAL_ERROR: AI_MODEL_RETURNED_NULL (handled in context) -->');
      }
    } catch (err) {
      console.error('Error in handleGenerateCode:', err);
      const errorMessage = `Failed to generate code. ${err instanceof Error ? err.message : 'An unexpected error occurred.'}`;
      setError(errorMessage);
      const errorHtml = `<!-- Context Error: ${errorMessage} -->`;
      setGeneratedCode(errorHtml);
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
         if (resultRefactoredCode.trim() === '' || resultRefactoredCode.startsWith('<!-- Error:') || resultRefactoredCode.startsWith('<!-- Warning:') || resultRefactoredCode.startsWith('<!-- CRITICAL_ERROR:')) {
            setRefactorError(resultRefactoredCode.trim() === '' ? 'AI returned empty refactored code.' : resultRefactoredCode);
        }
      } else {
        const nullErrorMsg = 'CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_FOR_REFACTOR. The AI model provided no content for refactoring.';
        setRefactorError(nullErrorMsg);
        setRefactoredCode(`<!-- CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_FOR_REFACTOR (handled in context) -->\n${generatedCode}`);
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

  const handleTestApiConnection = async () => {
    setIsTestingApi(true);
    setTestApiResponse(null);
    setTestApiError(null);
    console.log('[CodeContext] handleTestApiConnection called');
    try {
      const result: TestApiOutput = await testApiConnection({ message: 'merhaba' });
      if (result && result.reply) {
        if (result.reply.startsWith('<!-- ERROR: AI_MODEL_RETURNED_NULL_OR_EMPTY_FOR_TEST -->')) {
            setTestApiError('Test API call failed: Model returned null or empty for the test.');
            console.error('[CodeContext] Test API returned null/empty error:', result.reply);
        } else {
            setTestApiResponse(result.reply);
            console.log('[CodeContext] Test API success:', result.reply);
        }
      } else {
        const noReplyMsg = 'Test API call succeeded but received no reply content from the AI model.';
        setTestApiError(noReplyMsg);
        console.error('[CodeContext] Test API no reply or invalid structure:', result);
      }
    } catch (err) {
      console.error('[CodeContext] Error in handleTestApiConnection:', err);
      const errorMessage = `Test API call failed. ${err instanceof Error ? err.message : 'An unexpected error occurred.'}`;
      setTestApiError(errorMessage);
    } finally {
      setIsTestingApi(false);
    }
  };

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

        // For API test
        isTestingApi,
        testApiResponse,
        testApiError,
        handleTestApiConnection,
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
