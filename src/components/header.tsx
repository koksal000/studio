// src/components/header.tsx
'use client'; 

import React from 'react';
import { Bot } from 'lucide-react'; 


export function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6" />
        <h1 className="text-xl font-semibold">AI Code Weaver</h1>
      </div>
      <div className="flex items-center gap-2">
        {/* Placeholder for future buttons or actions if needed */}
      </div>
    </header>
  );
}
