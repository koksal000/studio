
'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCodeContext } from '@/context/code-context';
import { Loader2, AlertCircle, Wand2, Terminal } from 'lucide-react'; 
import { ScrollArea } from './ui/scroll-area';

export function CodeInput() {
  const {
    prompt,
    setPrompt,
    handleGenerateCode,
    isLoading,
    error,
    handleEnhancePrompt,
    isEnhancingPrompt,
    enhancePromptError,
  } = useCodeContext();

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  };

  const handleGenerateKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!isLoading && !isEnhancingPrompt) {
        handleGenerateCode();
      }
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
       <Label htmlFor="prompt-input" className="text-lg font-semibold flex items-center gap-2">
         <Terminal className="h-6 w-6"/>
         İsteminizi Girin
       </Label>
      <ScrollArea className="flex-1">
         <Textarea
           id="prompt-input"
           placeholder="Oluşturmak istediğiniz kodu açıklayın (örn: 'Tailwind CSS kullanarak birincil ve ikincil varyantlara sahip bir React buton bileşeni oluşturun')..."
           value={prompt}
           onChange={handleInputChange}
           onKeyDown={handleGenerateKeyDown}
           className="min-h-[200px] flex-1 resize-none text-base"
           aria-label="Kod üretme istemi"
         />
      </ScrollArea>
      {(error || enhancePromptError) && (
        <div className="flex items-center text-destructive text-sm p-2 bg-destructive/10 rounded-md">
          <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
          {error || enhancePromptError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={handleEnhancePrompt}
          disabled={isLoading || isEnhancingPrompt || !prompt.trim()}
          className="w-full sm:w-auto transition-all duration-200"
          variant="outline"
          aria-live="polite"
        >
          {isEnhancingPrompt ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              İstem Geliştiriliyor...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              İstemi Geliştir
            </>
          )}
        </Button>
        <Button
          onClick={handleGenerateCode}
          disabled={isLoading || isEnhancingPrompt || !prompt.trim()}
          className="w-full flex-1 transition-all duration-200"
          aria-live="polite"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kod Üretiliyor...
            </>
          ) : (
            'Kod Üret'
          )}
        </Button>
      </div>
    </div>
  );
}
