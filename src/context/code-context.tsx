'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { generateCode } from '@/ai/flows/generate-code-from-prompt';
import JSZip from 'jszip';

// Define the structure for generated files
export interface GeneratedFile {
  fileName: string;
  content: string;
}

interface CodeContextType {
  prompt: string;
  setPrompt: (prompt: string) => void;
  generatedCode: string;
  setGeneratedCode: (code: string) => void;
  generatedFiles: GeneratedFile[];
  setGeneratedFiles: (files: GeneratedFile[]) => void;
  isLoading: boolean;
  error: string | null;
  previewUrl: string | null;
  handleGenerateCode: () => Promise<void>;
  downloadCode: () => Promise<void>;
  updatePreview: () => void;
}

const CodeContext = createContext<CodeContextType | undefined>(undefined);

export const CodeProvider = ({ children }: { children: ReactNode }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const parseGeneratedCode = (code: string): GeneratedFile[] => {
    // Simple parser: assumes code blocks are separated by ```[filename] and ```
    // More robust parsing logic might be needed for complex outputs
    const files: GeneratedFile[] = [];
    const fileRegex = /```(\w+\.\w+)?\s*([\s\S]*?)```/g;
    let match;

    // First, check if there are any explicit file markers
    const hasFileMarkers = /```\w+\.\w+/.test(code);

    if (hasFileMarkers) {
        while ((match = fileRegex.exec(code)) !== null) {
          const fileName = match[1] || `untitled-${files.length + 1}.txt`;
          const content = match[2].trim();
          if (content) {
              files.push({ fileName, content });
          }
        }
    }

    // If no file markers were found or no files were extracted, treat the whole code as a single file
    if (files.length === 0) {
        // Try to infer a reasonable default filename (e.g., index.html if it looks like HTML)
        let defaultFileName = 'generated-code.txt';
        if (code.trim().startsWith('<') && code.trim().endsWith('>')) {
            if (/<html/i.test(code)) {
                defaultFileName = 'index.html';
            } else if (/<body/i.test(code)) {
                 defaultFileName = 'index.html'; // Assume it's part of an HTML doc
            } else if (/<script/i.test(code)) {
                 defaultFileName = 'script.js';
            } else if (/<style/i.test(code)) {
                 defaultFileName = 'style.css';
            } else {
                 defaultFileName = 'component.jsx'; // Default for React/JSX like structures
            }
        } else if (code.includes('function') || code.includes('const') || code.includes('let') || code.includes('import')) {
             defaultFileName = 'script.js';
        } else if (code.includes('{') && code.includes('}') && (code.includes(':') || code.includes('#') || code.includes('.'))) {
             defaultFileName = 'style.css';
        }

        if (code.trim()) { // Only add if there's actual code content
             files.push({ fileName: defaultFileName, content: code.trim() });
        }
    }


    // If still no files (e.g., empty input or only markers), return empty array
    return files;
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
    setPreviewUrl(null); // Reset preview on new generation

    try {
      const result = await generateCode({ prompt });
      setGeneratedCode(result.code);
      const files = parseGeneratedCode(result.code);
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

  const updatePreviewInternal = (files: GeneratedFile[]) => {
     if (files.length === 0) {
         setPreviewUrl(null);
         return;
     }

     // Prioritize index.html for preview
     const htmlFile = files.find(f => f.fileName.toLowerCase() === 'index.html');

     if (htmlFile) {
         // Create a Blob from the HTML content
         const blob = new Blob([htmlFile.content], { type: 'text/html' });
         const url = URL.createObjectURL(blob);

         // Clean up previous URL if exists
         if (previewUrl) {
             URL.revokeObjectURL(previewUrl);
         }
         setPreviewUrl(url);
     } else {
         // If no index.html, try to show the first file as plain text or based on its type
         const firstFile = files[0];
         let mimeType = 'text/plain';
         if (firstFile.fileName.endsWith('.js')) mimeType = 'text/javascript';
         else if (firstFile.fileName.endsWith('.css')) mimeType = 'text/css';
         else if (firstFile.fileName.endsWith('.json')) mimeType = 'application/json';

         const blob = new Blob([firstFile.content], { type: mimeType });
         const url = URL.createObjectURL(blob);

          // Clean up previous URL if exists
         if (previewUrl) {
             URL.revokeObjectURL(previewUrl);
         }
         setPreviewUrl(url);
     }
  };


  const updatePreview = useCallback(() => {
     updatePreviewInternal(generatedFiles);
   }, [generatedFiles, previewUrl]); // Include previewUrl in dependencies to handle cleanup


  const downloadCode = async () => {
    if (generatedFiles.length === 0) {
      setError('No code generated to download.');
      return;
    }

    try {
      const zip = new JSZip();
      generatedFiles.forEach(file => {
        zip.file(file.fileName, file.content);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'ai-code-weaver-project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href); // Clean up the URL object
    } catch (err) {
      console.error('Error creating zip file:', err);
      setError('Failed to create zip file.');
    }
  };


  return (
    <CodeContext.Provider
      value={{
        prompt,
        setPrompt,
        generatedCode,
        setGeneratedCode,
        generatedFiles,
        setGeneratedFiles,
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
