'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { generateCode } from '@/ai/flows/generate-code-from-prompt';
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
  isLoading: boolean;
  error: string | null;
  previewUrl: string | null;
  handleGenerateCode: () => Promise<void>;
  downloadCode: () => Promise<void>;
  updatePreview: () => void; // Kept for potential manual refresh, though auto-update is primary
}

const CodeContext = createContext<CodeContextType | undefined>(undefined);

export const CodeProvider = ({ children }: { children: ReactNode }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>(''); // Raw output from AI
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]); // Array, but usually holds one file
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Cleanup function for Blob URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Simplified parser: assumes the entire output is a single HTML file content
  const parseGeneratedCode = (code: string): GeneratedFile[] => {
    if (!code || code.trim() === '') {
      return []; // Return empty if no code generated
    }
    // The AI is instructed to return a single HTML file content.
    // We wrap it in our GeneratedFile structure.
    return [{ fileName: 'index.html', content: code.trim() }];
  };


  const handleGenerateCode = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedCode('');
    setGeneratedFiles([]);
    if (previewUrl) {
       URL.revokeObjectURL(previewUrl); // Clean up previous URL
    }
    setPreviewUrl(null); // Reset preview on new generation

    try {
      // The AI flow now returns the complete HTML code directly.
      const result = await generateCode({ prompt });
      const singleHtmlContent = result.code; // Assuming 'code' holds the full HTML string
      setGeneratedCode(singleHtmlContent); // Store raw HTML

      const files = parseGeneratedCode(singleHtmlContent); // Create the file structure
      setGeneratedFiles(files);

      // Automatically update preview after generation
      updatePreviewInternal(files);
    } catch (err) {
      console.error('Error generating code:', err);
      setError(`Failed to generate code. ${err instanceof Error ? err.message : 'Please try again.'}`);
      setGeneratedCode('');
      setGeneratedFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Updates the preview URL based on the generated files (usually just index.html)
  const updatePreviewInternal = (files: GeneratedFile[]) => {
     if (previewUrl) {
        URL.revokeObjectURL(previewUrl); // Clean up existing URL before creating a new one
     }

     if (files.length === 0 || !files[0].content) {
         setPreviewUrl(null);
         return;
     }

     // Since we expect a single index.html, directly use its content
     const htmlFile = files[0];
     const blob = new Blob([htmlFile.content], { type: 'text/html' });
     const url = URL.createObjectURL(blob);
     setPreviewUrl(url);
  };


  // Callback to manually trigger preview update (might not be strictly necessary with auto-update)
  const updatePreview = useCallback(() => {
     updatePreviewInternal(generatedFiles);
   }, [generatedFiles]); // Dependency on generatedFiles ensures it uses the latest


  // Download function now downloads a single HTML file directly
  const downloadCode = async () => {
    if (generatedFiles.length === 0 || !generatedFiles[0].content) {
      setError('No code generated to download.');
      return;
    }

    try {
      const file = generatedFiles[0];
      const blob = new Blob([file.content], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = file.fileName; // Download as 'index.html'
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href); // Clean up the URL object
    } catch (err) {
      console.error('Error creating download link:', err);
      setError('Failed to prepare file for download.');
    }
  };


  return (
    <CodeContext.Provider
      value={{
        prompt,
        setPrompt,
        generatedCode, // Provide the raw code
        generatedFiles, // Provide the file structure (usually one file)
        isLoading,
        error,
        previewUrl,
        handleGenerateCode,
        downloadCode,
        updatePreview,
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
