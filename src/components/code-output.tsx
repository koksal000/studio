
'use client';

import React, { useState, useMemo } from 'react';
import { useCodeContext } from '@/context/code-context';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Clipboard, Check, Code, FileText, Pencil, ListCollapse, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { RefactorCodeModal } from './refactor-code-modal';
import { Badge } from '@/components/ui/badge';

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
    setIsRefactorModalOpen,
    isEnhancing,       
    enhanceError,      
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
    if (isLoading || isEnhancing) { 
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

    if (!generatedCode && !error && !enhanceError) {
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
    if ((error || enhanceError) && !generatedCode) {
       return (
         <div className="flex items-center justify-center h-full text-destructive p-4 text-center">
           <FileText className="h-10 w-10 mr-4" />
           <div>
             <p className="font-semibold">Operation Failed</p>
             <p>{error || enhanceError || 'Could not perform operation. Check the error message or try again.'}</p>
           </div>
         </div>
       );
     }

    return (
       <div className="relative flex-1 p-0 m-0 h-full">
           <Button
             variant="ghost"
             size="icon"
             onClick={() => handleCopy(generatedCode as string)} 
             disabled={!generatedCode || isLoading || isEnhancing}
             aria-label="Copy HTML Code"
             title="Copy HTML Code"
             className="absolute top-2 right-2 z-10 h-8 w-8 bg-background/80 hover:bg-background" // Positioned copy button
           >
             {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
           </Button>
           <ScrollArea className="h-full w-full">
            <pre className="text-sm p-4 pt-4 bg-muted/30 rounded-md overflow-auto font-mono whitespace-pre break-words h-full">
              <code>{generatedCode || '// No code generated yet...'}</code>
            </pre>
           </ScrollArea>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden"> {/* Changed: Removed flex-1, h-1/2, border-b */}
      <div className="flex items-center justify-between p-3 border-b"> 
         <div className="flex items-center gap-2">
           <Code className="h-5 w-5" />
           <h2 className="text-lg font-semibold">Generated Code (index.html)</h2>
            {generatedCode && !isLoading && !isEnhancing && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <ListCollapse className="h-3 w-3" />
                {lineCount} lines
              </Badge>
            )}
         </div>
         <div className="flex items-center gap-1.5"> 
             <Button
               variant="outline"
               size="sm"
               onClick={downloadCode}
               disabled={isLoading || isEnhancing || !generatedCode}
               title="Download index.html"
             >
               <Download className="mr-2 h-4 w-4" />
               İndir
             </Button>
             <Button
               variant="outline"
               size="sm"
               onClick={() => setIsRefactorModalOpen(true)}
               disabled={isLoading || isEnhancing || !generatedCode}
               title="Refactor Code"
             >
               <Pencil className="mr-2 h-4 w-4" />
               Düzenle
             </Button>
         </div>
      </div>
      {enhanceError && (
        <div className="flex items-center text-destructive text-xs p-2 bg-destructive/10 border-b">
          <AlertCircle className="h-3 w-3 mr-2 shrink-0" />
          Enhancement Error: {enhanceError}
        </div>
      )}
      <div className="flex-1 relative overflow-hidden">
         {renderContent()}
      </div>
      <RefactorCodeModal />
    </div>
  );
}
