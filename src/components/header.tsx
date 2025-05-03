import React from 'react';
import { Code, Bot } from 'lucide-react'; // Use appropriate icons

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6" /> {/* Or use Code icon */}
        <h1 className="text-xl font-semibold">AI Code Weaver</h1> {/* Ensure consistent title */}
      </div>
       {/* Add any other header elements like user profile, settings, etc. here */}
       {/* Example:
       <div className="flex items-center gap-4">
         <Button variant="ghost" size="icon">
           <Settings className="h-5 w-5" />
         </Button>
         <Avatar>
           <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
           <AvatarFallback>CN</AvatarFallback>
         </Avatar>
       </div>
       */}
    </header>
  );
}
