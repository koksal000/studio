
'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCodeContext } from '@/context/code-context';
import { Loader2, AlertCircle, Activity } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export function CodeInput() {
  const {
    prompt,
    setPrompt,
    handleGenerateCode,
    isLoading,
    error,
    isTestingApi,
    testApiResponse,
    testApiError,
    handleTestApiConnection,
  } = useCodeContext();

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow submitting with Cmd/Ctrl + Enter
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault(); // Prevent default newline behavior
      if (!isLoading) {
        handleGenerateCode();
      }
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
       <Label htmlFor="prompt-input" className="text-lg font-semibold flex items-center gap-2">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-terminal"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
         Enter Your Prompt
       </Label>
      <ScrollArea className="flex-1">
         <Textarea
           id="prompt-input"
           placeholder="Describe the code you want to generate (e.g., 'Create a React button component with primary and secondary variants using Tailwind CSS')..."
           value={prompt}
           onChange={handleInputChange}
           onKeyDown={handleKeyDown}
           className="min-h-[200px] flex-1 resize-none text-base"
           aria-label="Code generation prompt"
         />
      </ScrollArea>
      {error && (
        <div className="flex items-center text-destructive text-sm p-2 bg-destructive/10 rounded-md">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}
      <Button
        onClick={handleGenerateCode}
        disabled={isLoading || !prompt.trim()}
        className="w-full transition-all duration-200"
        aria-live="polite"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Code'
        )}
      </Button>

      {/* Test API Button and Display Area */}
      <div className="mt-4 border-t pt-4 space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">API Test Section</Label>
        <Button
          variant="outline"
          onClick={handleTestApiConnection}
          disabled={isTestingApi}
          className="w-full"
          aria-live="polite"
        >
          {isTestingApi ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing API...
            </>
          ) : (
            <>
              <Activity className="mr-2 h-4 w-4" />
              Test API Connection (Merhaba)
            </>
          )}
        </Button>
        {testApiResponse && (
          <div className="text-sm p-3 bg-green-500/10 text-green-700 rounded-md shadow">
            <strong>Test API Yanıtı:</strong>
            <pre className="mt-1 whitespace-pre-wrap break-all bg-green-500/5 p-2 rounded text-xs">{testApiResponse}</pre>
          </div>
        )}
        {testApiError && (
          <div className="flex items-start text-destructive text-sm p-3 bg-destructive/10 rounded-md shadow">
            <AlertCircle className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
            <div>
                <strong>Test API Hatası:</strong>
                <p className="mt-1 text-xs">{testApiError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
