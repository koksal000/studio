'use client';

import React, { useMemo } from 'react'; // Added useMemo
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
import { Loader2, AlertCircle, Diff, Pencil, ArrowRightLeft } from 'lucide-react'; // Added Pencil, ArrowRightLeft
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge'; // Added Badge

// Helper function to count lines
const countLines = (text: string | null | undefined): number => {
  return text ? text.split('\n').length : 0;
};

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

  // Calculate line counts and difference
  const originalLines = useMemo(() => countLines(generatedCode), [generatedCode]);
  const refactoredLines = useMemo(() => countLines(refactoredCode), [refactoredCode]);
  const lineDifference = useMemo(() => refactoredLines - originalLines, [originalLines, refactoredLines]);

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

    // Basic side-by-side view using pre/code inside ScrollArea
    return (
      <div className="mt-4 border rounded-md">
         {/* Header for line counts and difference */}
         <div className="flex justify-between items-center px-3 py-2 border-b bg-muted/50 text-xs text-muted-foreground">
           <span>Original ({originalLines} lines)</span>
            <Badge variant={lineDifference === 0 ? "secondary" : (lineDifference > 0 ? "default" : "destructive")} className="flex items-center gap-1">
                 <ArrowRightLeft className="h-3 w-3" />
                 {lineDifference > 0 ? `+${lineDifference}` : lineDifference} lines
            </Badge>
           <span>Refactored ({refactoredLines} lines)</span>
         </div>
         {/* Code Comparison Area */}
        <div className="grid grid-cols-2 gap-0 max-h-[45vh] overflow-hidden"> {/* Applied max-h here */}
            <div className="flex flex-col h-full overflow-hidden border-r"> {/* Ensure flex container takes height */}
                {/* Use h-full on ScrollArea */}
                <ScrollArea className="flex-1 p-2 bg-muted/20 h-full"> {/* Added h-full */}
                   <pre className="text-xs font-mono whitespace-pre break-words"> {/* Removed whitespace-pre-wrap */}
                     <code>{generatedCode}</code>
                   </pre>
                </ScrollArea>
            </div>
            <div className="flex flex-col h-full overflow-hidden"> {/* Ensure flex container takes height */}
                {/* Use h-full on ScrollArea */}
                <ScrollArea className="flex-1 p-2 bg-green-500/10 h-full"> {/* Added h-full */}
                  <pre className="text-xs font-mono whitespace-pre break-words"> {/* Removed whitespace-pre-wrap */}
                    <code>{refactoredCode}</code>
                  </pre>
                </ScrollArea>
            </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isRefactorModalOpen} onOpenChange={setIsRefactorModalOpen}>
      {/* Increased max-width */}
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[65vw]">
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
