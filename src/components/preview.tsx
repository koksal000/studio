'use client';

import React, { useEffect } from 'react';
import { useCodeContext } from '@/context/code-context';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCcw, AlertTriangle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export function Preview() {
  const { previewUrl, updatePreview, isLoading, generatedFiles } = useCodeContext();

  // Automatically update preview when generated files change
  useEffect(() => {
    if (generatedFiles.length > 0 && !isLoading) {
      updatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedFiles, isLoading]); // updatePreview is stable due to useCallback

  const handleRefresh = () => {
    updatePreview();
  };

  return (
    <div className="flex flex-col flex-1 h-1/2 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Preview</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || !previewUrl}
          title="Refresh Preview"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 bg-white"> {/* Use white background for preview area */}
        {isLoading ? (
           <div className="flex items-center justify-center h-full text-muted-foreground">
             Loading Preview...
           </div>
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            title="Code Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin" // Basic sandbox for security
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
            <AlertTriangle className="h-10 w-10 mb-4 text-amber-500" />
            <p className="font-semibold">No Preview Available</p>
             {generatedFiles.length > 0 ? (
                <p>Preview requires an 'index.html' file or will show the first generated file.</p>
             ) : (
                <p>Generate some code to see a preview.</p>
             )}

          </div>
        )}
      </ScrollArea>
    </div>
  );
}
