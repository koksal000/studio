'use client';

import React, { useState } from 'react';
import { useCodeContext } from '@/context/code-context';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Clipboard, Check, Code, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast'; // Import useToast

export function CodeOutput() {
  const { generatedFiles, isLoading, error, downloadCode } = useCodeContext();
  const { toast } = useToast(); // Use the toast hook
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const handleCopy = async (content: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedStates((prev) => ({ ...prev, [fileName]: true }));
      toast({
        title: 'Copied!',
        description: `${fileName} copied to clipboard.`,
        duration: 2000, // Show toast for 2 seconds
      });
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [fileName]: false }));
      }, 2000); // Reset icon after 2 seconds
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

    if (error && generatedFiles.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
          <FileText className="h-10 w-10 mr-4" />
          <div>
             <p className="font-semibold">Waiting for Generation</p>
             <p>Enter a prompt and click "Generate Code" to see the results here.</p>
           </div>
        </div>
      );
    }

    if (generatedFiles.length === 0) {
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

     if (generatedFiles.length === 1 && !generatedFiles[0].fileName.startsWith('untitled-')) {
      // Display single file directly without tabs
      const file = generatedFiles[0];
      const isCopied = copiedStates[file.fileName];
      return (
         <div className="relative flex-1 p-0 m-0">
             <div className="absolute top-2 right-2 flex gap-2 z-10">
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => handleCopy(file.content, file.fileName)}
                 aria-label={`Copy ${file.fileName}`}
                 title={`Copy ${file.fileName}`}
                 className="h-8 w-8"
               >
                 {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
               </Button>
               <Button
                  variant="ghost"
                  size="icon"
                  onClick={downloadCode}
                  aria-label="Download project as zip"
                  title="Download project as zip"
                  className="h-8 w-8"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
             <ScrollArea className="h-full w-full">
              <pre className="text-sm p-4 pt-12 bg-muted/30 rounded-md overflow-auto font-mono whitespace-pre-wrap break-words">
                <code>{file.content}</code>
              </pre>
             </ScrollArea>
          </div>
      );
     }


    // Display multiple files in tabs
    return (
      <Tabs defaultValue={generatedFiles[0]?.fileName || 'file-0'} className="flex flex-col h-full w-full">
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <TabsList className="bg-transparent p-0">
            {generatedFiles.map((file, index) => (
              <TabsTrigger
                key={file.fileName || `file-${index}`}
                value={file.fileName || `file-${index}`}
                className="text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                {file.fileName || `File ${index + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCode}
            disabled={isLoading || generatedFiles.length === 0}
            className="ml-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Zip
          </Button>
        </div>

        {generatedFiles.map((file, index) => {
          const fileNameKey = file.fileName || `file-${index}`;
          const isCopied = copiedStates[fileNameKey];
          return (
             <TabsContent key={fileNameKey} value={fileNameKey} className="flex-1 overflow-hidden relative m-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0">
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => handleCopy(file.content, fileNameKey)}
                 aria-label={`Copy ${fileNameKey}`}
                 title={`Copy ${fileNameKey}`}
                 className="absolute top-2 right-2 z-10 h-8 w-8"
               >
                 {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
               </Button>
               <ScrollArea className="h-full w-full">
                  <pre className="text-sm p-4 pt-12 bg-muted/30 rounded-b-md overflow-auto font-mono whitespace-pre-wrap break-words">
                    <code>{file.content}</code>
                  </pre>
               </ScrollArea>
             </TabsContent>
          )
        })}
      </Tabs>
    );
  };

  return (
    <div className="flex flex-col flex-1 h-1/2 border-b border-border overflow-hidden">
      <div className="flex items-center p-4 border-b">
         <Code className="h-5 w-5 mr-2" />
         <h2 className="text-lg font-semibold">Generated Code</h2>
      </div>
      <div className="flex-1 relative overflow-hidden">
         {renderContent()}
      </div>
    </div>
  );
}
