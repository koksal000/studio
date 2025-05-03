'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { generateCode } from '@/ai/flows/generate-code-from-prompt';
import { refactorCode } from '@/ai/flows/refactor-code'; // Import refactor flow
import JSZip from 'jszip';

// Define the structure for generated files (now simplified for single file)
export interface GeneratedFile {
  fileName: string; // Will typically be 'index.html'
  content: string; // The full HTML content
}

interface CodeContextType {
  prompt: string;
  setPrompt: (prompt: string) => void;
  generatedCode: string; // Stores the raw generated HTML string
  generatedFiles: GeneratedFile[]; // Will usually contain just one file object
  isLoading: boolean; // For initial generation
  error: string | null; // For initial generation
  previewUrl: string | null;
  handleGenerateCode: () => Promise<void>;
  downloadCode: () => Promise<void>;
  updatePreview: () => void;

  // Refactoring state and functions
  isRefactorModalOpen: boolean;
  setIsRefactorModalOpen: (isOpen: boolean) => void;
  refactorPrompt: string;
  setRefactorPrompt: (prompt: string) => void;
  refactoredCode: string | null; // Stores the proposed refactored code
  isRefactoring: boolean; // Loading state for refactoring
  refactorError: string | null; // Error state for refactoring
  handleRefactorCode: () => Promise<void>;
  applyRefactor: () => void; // Apply the refactored code
  previousGeneratedCode: string | null; // To store the state before refactoring for undo
  undoRefactor: () => void; // Function to revert to previous code
}

const CodeContext = createContext<CodeContextType | undefined>(undefined);

export const CodeProvider = ({ children }: { children: ReactNode }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>(''); // Current active code
  const [previousGeneratedCode, setPreviousGeneratedCode] = useState<string | null>(null); // For undo
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false); // For initial generation
  const [error, setError] = useState<string | null>(null); // For initial generation
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Refactoring State
  const [isRefactorModalOpen, setIsRefactorModalOpen] = useState<boolean>(false);
  const [refactorPrompt, setRefactorPrompt] = useState<string>('');
  const [refactoredCode, setRefactoredCode] = useState<string | null>(null); // The result of refactor flow
  const [isRefactoring, setIsRefactoring] = useState<boolean>(false); // Loading state for refactor
  const [refactorError, setRefactorError] = useState<string | null>(null); // Error for refactor

  // --- Effects ---
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Update preview whenever generatedCode changes
  useEffect(() => {
     updatePreviewInternal(parseGeneratedCode(generatedCode));
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [generatedCode]); // Update preview when the active code changes


  // --- Utility Functions ---
  const parseGeneratedCode = (code: string): GeneratedFile[] => {
    if (!code || code.trim() === '') {
      return [];
    }
    return [{ fileName: 'index.html', content: code.trim() }];
  };

  const updatePreviewInternal = useCallback((files: GeneratedFile[]) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (files.length === 0 || !files[0].content) {
      setPreviewUrl(null);
      return;
    }

    const htmlFile = files[0];
    const blob = new Blob([htmlFile.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
     // Need to keep track of previewUrl for cleanup
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]); // Depend on previewUrl for cleanup


  // --- Core Actions ---
  const handleGenerateCode = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedCode('');
    setPreviousGeneratedCode(null); // Reset undo state on new generation
    setGeneratedFiles([]);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);

    try {
      const result = await generateCode({ prompt });
      const singleHtmlContent = result.code;
      setGeneratedCode(singleHtmlContent); // Set the initial generated code
      setGeneratedFiles(parseGeneratedCode(singleHtmlContent));
      // Preview updates via useEffect on generatedCode change
    } catch (err) {
      console.error('Error generating code:', err);
      setError(`Failed to generate code. ${err instanceof Error ? err.message : 'Please try again.'}`);
      setGeneratedCode('');
      setPreviousGeneratedCode(null);
      setGeneratedFiles([]);
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
    setRefactoredCode(null); // Clear previous refactor result

    try {
      const result = await refactorCode({ code: generatedCode, prompt: refactorPrompt });
      setRefactoredCode(result.refactoredCode); // Store the proposed refactored code
    } catch (err) {
      console.error('Error refactoring code:', err);
      setRefactorError(`Failed to refactor code. ${err instanceof Error ? err.message : 'Please try again.'}`);
      setRefactoredCode(null);
    } finally {
      setIsRefactoring(false);
    }
  };

  // Apply the refactored code as the current code
  const applyRefactor = () => {
    if (refactoredCode !== null) {
      setPreviousGeneratedCode(generatedCode); // Save current code for undo
      setGeneratedCode(refactoredCode); // Apply refactored code
      setGeneratedFiles(parseGeneratedCode(refactoredCode));
      // Preview updates via useEffect
      setRefactoredCode(null); // Clear the proposed code
      setRefactorPrompt(''); // Clear the prompt
      setIsRefactorModalOpen(false); // Close modal after applying
    }
  };

  // Revert to the code before the last refactor
  const undoRefactor = () => {
    if (previousGeneratedCode !== null) {
      setGeneratedCode(previousGeneratedCode);
      setGeneratedFiles(parseGeneratedCode(previousGeneratedCode));
      // Preview updates via useEffect
      setPreviousGeneratedCode(null); // Clear the undo state after undoing
    }
  };

  // Download function (uses current generatedCode)
  const downloadCode = async () => {
    if (!generatedCode) {
      setError('No code generated to download.'); // Use main error for consistency? Or a toast?
      return;
    }

    try {
      const blob = new Blob([generatedCode], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'index.html'; // Always download the current code as index.html
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Error creating download link:', err);
      setError('Failed to prepare file for download.'); // Use main error?
    }
  };

  // Manual preview update (might be less needed now)
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

        // Refactoring props
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
