'use client';

import React, { useEffect } from 'react';
import { useCodeContext } from '@/context/code-context';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCcw, AlertTriangle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area'; // Assuming ScrollArea is still needed if iframe fails or for placeholders

export function Preview() {
  // previewUrl now directly points to the Blob URL of the generated index.html
  const { previewUrl, updatePreview, isLoading, generatedCode } = useCodeContext();

  // Automatically update preview when generated code changes
  // No need to check generatedFiles.length anymore
  useEffect(() => {
    if (generatedCode && !isLoading) {
      updatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedCode, isLoading]); // updatePreview is stable due to useCallback

  const handleRefresh = () => {
    // Re-run the updatePreview logic which creates a new Blob URL
    updatePreview();
  };

  return (
    <div className="flex flex-col flex-1 h-1/2 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Preview (index.html)</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || !previewUrl} // Disable if no preview URL exists
          title="Refresh Preview"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
       {/* Use bg-background to match theme, iframe will overlay this */}
      <div className="flex-1 bg-background relative">
        {isLoading ? (
           <div className="absolute inset-0 flex items-center justify-center h-full text-muted-foreground">
             Generating Preview...
           </div>
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            title="Code Preview"
            className="w-full h-full border-0 absolute inset-0" // Use absolute positioning to fill parent
            sandbox="allow-scripts allow-same-origin" // Keep basic sandbox
            key={previewUrl} // Force iframe remount when URL changes
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
            <AlertTriangle className="h-10 w-10 mb-4 text-amber-500" />
            <p className="font-semibold">No Preview Available</p>
            {generatedCode ? (
                 // This case might happen if blob creation fails, unlikely but possible
                 <p>Could not generate preview. Try refreshing.</p>
              ) : (
                 <p>Generate some code to see a preview here.</p>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
