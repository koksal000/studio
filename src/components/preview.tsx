
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCodeContext } from '@/context/code-context';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCcw, AlertTriangle, Expand, Shrink } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Preview() {
  const { previewUrl, updatePreview, isLoading, generatedCode } = useCodeContext();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the container to make fullscreen

  // Automatically update preview when generated code changes
  useEffect(() => {
    if (generatedCode && !isLoading) {
      updatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedCode, isLoading]); // updatePreview is stable due to useCallback

  const handleRefresh = () => {
    updatePreview();
    // If the iframe is currently loaded, refresh it directly
    if (iframeRef.current) {
        iframeRef.current.src = previewUrl || '';
    }
  };

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
    document.addEventListener('mozfullscreenchange', handleFullscreenChange); // Firefox
    document.addEventListener('MSFullscreenChange', handleFullscreenChange); // IE/Edge

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);


  return (
    // Use relative positioning on the outer div to contain the absolute fullscreen element
    <div className="flex flex-col h-full overflow-hidden relative"> {/* Changed: Removed flex-1, h-1/2 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Preview (index.html)</h2>
        </div>
        <div className="flex items-center gap-2">
           <Button
             variant="outline"
             size="sm"
             onClick={handleFullscreen}
             disabled={!previewUrl}
             title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
           >
             {isFullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
           </Button>
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
      </div>
      {/* Container Ref for Fullscreen */}
      <div ref={containerRef} className={cn(
        "flex-1 bg-background relative",
        // Use bg-background explicitly for fullscreen background
        isFullscreen && "fixed inset-0 z-50 bg-background"
      )}>
        {isLoading && !isFullscreen ? ( // Only show loading outside fullscreen
           <div className="absolute inset-0 flex items-center justify-center h-full text-muted-foreground">
             Generating Preview...
           </div>
        ) : previewUrl ? (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            title="Code Preview"
            // Adjust className for fullscreen: ensure it fills the container
            className={cn(
               "w-full h-full border-0",
               isFullscreen ? "absolute inset-0" : "relative" // Use absolute only in fullscreen
            )}
            sandbox="allow-scripts allow-same-origin"
            key={previewUrl} // Force iframe remount when URL changes might not be needed if refreshing directly
          />
        ) : (
          !isFullscreen && ( // Only show placeholder outside fullscreen
              <div className="absolute inset-0 flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                <AlertTriangle className="h-10 w-10 mb-4 text-amber-500" />
                <p className="font-semibold">No Preview Available</p>
                {generatedCode ? (
                     <p>Could not generate preview. Try refreshing.</p>
                  ) : (
                     <p>Generate some code to see a preview here.</p>
                  )}
              </div>
           )
        )}
         {/* Add an exit button visible only in fullscreen */}
         {isFullscreen && (
             <Button
               variant="secondary" // Use a different variant for visibility
               size="icon"
               onClick={handleFullscreen}
               title="Exit Fullscreen"
               className="absolute top-4 right-4 z-[60] rounded-full" // Ensure it's above iframe
             >
               <Shrink className="h-5 w-5" />
             </Button>
           )}
      </div>
    </div>
  );
}
