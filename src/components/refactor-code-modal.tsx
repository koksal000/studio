'use client';

import React from 'react';
import { useCodeContext } from '@/context/code-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Diff, Pencil } from 'lucide-react'; // Added Pencil
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
// Assume a simple diff viewer component exists or use plain pre/code tags for now
// import DiffViewer from 'react-diff-viewer'; // Example, install if needed

export function RefactorCodeModal() {
  const {
    isRefactorModalOpen,
    setIsRefactorModalOpen,
    refactorPrompt,
    setRefactorPrompt,
    generatedCode, // Original code for context/diff
    refactoredCode, // Proposed refactored code
    isRefactoring,
    refactorError,
    handleRefactorCode,
    applyRefactor,
  } = useCodeContext();

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRefactorPrompt(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!isRefactoring) {
        handleRefactorCode();
      }
    }
  };

  const renderDiff = () => {
    if (isRefactoring) {
       return (
         <div className="space-y-2 mt-4">
           <Skeleton className="h-4 w-1/3" />
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-2/3" />
         </div>
       );
     }

    if (refactorError) {
       return (
         <div className="mt-4 text-destructive text-sm p-2 bg-destructive/10 rounded-md flex items-center">
           <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
           <span>{refactorError}</span>
         </div>
       );
     }

    if (!refactoredCode) {
      return (
        <div className="mt-4 text-center text-muted-foreground py-8">
          Enter instructions and click "Preview Changes" to see the proposed refactoring.
        </div>
      );
    }

    // Basic side-by-side view using pre/code for simplicity
    // Removed overflow-hidden from the grid container
    return (
        <div className="mt-4 grid grid-cols-2 gap-4 border rounded-md p-2 max-h-[40vh]">
            <div className="flex flex-col h-full"> {/* Ensure flex container takes height */}
                <Label className="text-xs text-muted-foreground mb-1">Original Code</Label>
                {/* Use h-full on ScrollArea */}
                <ScrollArea className="flex-1 border rounded-md p-2 bg-muted/20 h-full">
                   <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                     <code>{generatedCode}</code>
                   </pre>
                </ScrollArea>
            </div>
            <div className="flex flex-col h-full"> {/* Ensure flex container takes height */}
               <Label className="text-xs text-muted-foreground mb-1">Refactored Code</Label>
                {/* Use h-full on ScrollArea */}
                <ScrollArea className="flex-1 border rounded-md p-2 bg-green-500/10 h-full">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    <code>{refactoredCode}</code>
                  </pre>
                </ScrollArea>
            </div>
        </div>
    );
    /* Example using react-diff-viewer (requires installation: npm install react-diff-viewer)
    return (
      <div className="mt-4 border rounded-md overflow-hidden max-h-[40vh]"> // Add max-h here
        <ScrollArea className="h-full"> // Wrap DiffViewer in ScrollArea
            <DiffViewer
              oldValue={generatedCode || ''}
              newValue={refactoredCode || ''}
              splitView={true}
              showDiffOnly={false} // Show full files
              leftTitle="Original Code"
              rightTitle="Refactored Code"
              styles={{
                 variables: {
                   light: { // Adapt colors to your theme
                     diffViewerBackground: 'hsl(var(--background))',
                     diffViewerColor: 'hsl(var(--foreground))',
                     addedBackground: 'hsl(145 63% 90%)', // Example green tint
                     addedColor: 'hsl(145 63% 20%)',
                     removedBackground: 'hsl(0 84% 90%)', // Example red tint
                     removedColor: 'hsl(0 84% 30%)',
                     wordAddedBackground: 'hsl(145 63% 80%)',
                     wordRemovedBackground: 'hsl(0 84% 80%)',
                     // ... other style overrides
                   },
                 },
               }}
            />
        </ScrollArea>
      </div>
    );
    */
  };


  return (
    <Dialog open={isRefactorModalOpen} onOpenChange={setIsRefactorModalOpen}>
      <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[50vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <Pencil className="h-5 w-5"/>
             Refactor Code
          </DialogTitle>
          <DialogDescription>
            Enter instructions on how you want to modify the existing generated code. The AI will attempt to apply these changes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="refactor-prompt">Refactoring Instructions</Label>
            <Textarea
              id="refactor-prompt"
              placeholder="e.g., 'Change the primary button color to green', 'Add a loading spinner to the form submission', 'Make the header sticky'..."
              value={refactorPrompt}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] text-sm"
              aria-label="Refactoring instructions prompt"
              disabled={isRefactoring}
            />
          </div>

          <Button
             onClick={handleRefactorCode}
             disabled={isRefactoring || !refactorPrompt.trim() || !generatedCode}
             className="w-full"
             variant="secondary"
           >
             {isRefactoring ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Previewing Changes...
               </>
             ) : (
               <>
                 <Diff className="mr-2 h-4 w-4" />
                 Preview Changes
               </>
             )}
           </Button>

          {/* Diff Viewer Section */}
          {renderDiff()}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsRefactorModalOpen(false)} disabled={isRefactoring}>
            Cancel
          </Button>
          <Button
            onClick={applyRefactor}
            disabled={isRefactoring || !refactoredCode || !!refactorError}
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
