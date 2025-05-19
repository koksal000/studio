
// src/components/header.tsx
'use client'; 

import React from 'react';
import { Bot, Sparkles, Undo, Redo } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { useCodeContext } from '@/context/code-context';

export function Header() {
  const {
    handleEnhanceCode,
    undoRefactor,
    redoChange,
    generatedCode,
    previousGeneratedCode,
    futureGeneratedCode,
    isLoading,
    isEnhancing,
    isRefactoring,
  } = useCodeContext();

  const canUndo = !!previousGeneratedCode;
  const canRedo = futureGeneratedCode.length > 0;
  const canEnhance = !!generatedCode;

  const anyLoading = isLoading || isEnhancing || isRefactoring;

  return (
    <header className="flex items-center justify-between p-4 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6" />
        <h1 className="text-xl font-semibold">AI Code Weaver</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEnhanceCode}
          disabled={anyLoading || !canEnhance}
          title="Kodu Geliştir"
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Geliştir
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={undoRefactor}
          disabled={anyLoading || !canUndo}
          title="Geri Al"
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          <Undo className="mr-2 h-4 w-4" />
          Geri Al
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={redoChange}
          disabled={anyLoading || !canRedo}
          title="İleri Al"
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          <Redo className="mr-2 h-4 w-4" />
          İleri Al
        </Button>
      </div>
    </header>
  );
}

    