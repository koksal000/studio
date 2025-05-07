
'use client';

import React, { useState, useMemo } from 'react';
import { useCodeContext } from '@/context/code-context';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Clipboard, Check, Code, FileText, Undo, Pencil, ListCollapse } from 'lucide-react'; // Added ListCollapse
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { RefactorCodeModal } from './refactor-code-modal';
import { Badge } from '@/components/ui/badge'; // Added Badge

// Helper function to count lines
const countLines = (text: string | null | undefined): number => {
  return text ? text.split('\n').length : 0;
};

export function CodeOutput() {
  const {
    generatedCode,
    isLoading,
    error,
    downloadCode,
    undoRefactor,
    previousGeneratedCode,
    setIsRefactorModalOpen,
  } = useCodeContext();
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const lineCount = useMemo(() => countLines(generatedCode), [generatedCode]);

  const handleCopy = async (content: string) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast({
        title: 'Copied!',
        description: `HTML code copied to clipboard.`,
        duration: 2000,
      });
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
       toast({
         title: 'Error Copying',
         description: 'Could not copy code to clipboard.',
         variant: 'destructive',
         duration: 3000,
       });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
         <div className="p-4 space-y-4">
           <Skeleton className="h-8 w-1/4" />
           <Skeleton className="h-6 w-1/2" />
           <Skeleton className="h-4 w-3/4" />
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-5/6" />
         </div>
       );
    }

    if (!generatedCode && !error) {
       return (
         <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
            <FileText className="h-10 w-10 mr-4" />
            <div>
             <p className="font-semibold">No Code Generated Yet</p>
             <p>Enter a prompt and click "Generate Code".</p>
            </div>
         </div>
       );
    }
    if (error && !generatedCode) {
       return (
         <div className="flex items-center justify-center h-full text-destructive p-4 text-center">
           <FileText className="h-10 w-10 mr-4" />
           <div>
             <p className="font-semibold">Generation Failed</p>
             <p>Could not generate code. Check the error message or try again.</p>
           </div>
         </div>
       );
     }

    return (
       <div className="relative flex-1 p-0 m-0 h-full">
           <div className="absolute top-2 right-2 flex gap-2 z-10">
             <Button
               variant="ghost"
               size="icon"
               onClick={undoRefactor}
               disabled={!previousGeneratedCode}
               aria-label="Undo Last Refactor"
               title="Undo Last Refactor"
               className="h-8 w-8"
             >
               <Undo className="h-4 w-4" />
             </Button>
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRefactorModalOpen(true)}
                disabled={isLoading || !generatedCode}
                aria-label="Refactor Code"
                title="Refactor Code"
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
             <Button
               variant="ghost"
               size="icon"
               onClick={() => handleCopy(generatedCode)}
               disabled={!generatedCode}
               aria-label="Copy HTML Code"
               title="Copy HTML Code"
               className="h-8 w-8"
             >
               {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
             </Button>
             <Button
                variant="ghost"
                size="icon"
                onClick={downloadCode}
                disabled={isLoading || !generatedCode}
                aria-label="Download HTML file"
                title="Download index.html"
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
           <ScrollArea className="h-full w-full">
            <pre className="text-sm p-4 pt-12 bg-muted/30 rounded-md overflow-auto font-mono whitespace-pre break-words h-full">
              <code>{generatedCode || '// No code generated yet...'}</code>
            </pre>
           </ScrollArea>
        </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 h-1/2 border-b border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
         <div className="flex items-center gap-2">
           <Code className="h-5 w-5" />
           <h2 className="text-lg font-semibold">Generated Code (index.html)</h2>
            {generatedCode && !isLoading && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <ListCollapse className="h-3 w-3" />
                {lineCount} lines
              </Badge>
            )}
         </div>
         <div className="flex items-center gap-2">
             <Button
               variant="outline"
               size="sm"
               onClick={downloadCode}
               disabled={isLoading || !generatedCode}
             >
               <Download className="mr-2 h-4 w-4" />
               Download
             </Button>
             <Button
               variant="outline"
               size="sm"
               onClick={() => setIsRefactorModalOpen(true)}
               disabled={isLoading || !generatedCode}
             >
               <Pencil className="mr-2 h-4 w-4" />
               Edit
             </Button>
             <Button
               variant="outline"
               size="sm"
               onClick={undoRefactor}
               disabled={!previousGeneratedCode}
             >
               <Undo className="mr-2 h-4 w-4" />
               Undo
             </Button>
         </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
         {renderContent()}
      </div>
      <RefactorCodeModal />
    </div>
  );
}
