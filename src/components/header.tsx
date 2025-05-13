'use client'; // Make this a client component to use onClick with browser APIs

import React from 'react';
import { Code, Bot, DownloadCloud } from 'lucide-react'; // Use appropriate icons
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';


export function Header() {
  const { toast } = useToast();

  const handleDownloadProjectSnapshot = () => {
    try {
      // Ensure this code runs only on the client-side
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        toast({
          title: 'Error',
          description: 'Download can only be initiated from the browser.',
          variant: 'destructive',
        });
        return;
      }

      const pageHtml = document.documentElement.outerHTML;
      const blob = new Blob([pageHtml], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ai-code-weaver-snapshot.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: 'Snapshot Downloaded',
        description: 'A static HTML snapshot of the current page has been downloaded. Note: AI features will not be functional in this offline file.',
        duration: 7000,
      });

    } catch (error) {
      console.error("Error downloading project snapshot:", error);
      toast({
        title: 'Download Error',
        description: `Could not download the project snapshot. ${error instanceof Error ? error.message : ''}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <header className="flex items-center justify-between p-4 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6" /> {/* Or use Code icon */}
        <h1 className="text-xl font-semibold">AI Code Weaver</h1> {/* Ensure consistent title */}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleDownloadProjectSnapshot} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
          <DownloadCloud className="mr-2 h-4 w-4" />
          Download Project Snapshot
        </Button>
         {/* Add any other header elements like user profile, settings, etc. here */}
         {/* Example:
         <Button variant="ghost" size="icon">
           <Settings className="h-5 w-5" />
         </Button>
         <Avatar>
           <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
           <AvatarFallback>CN</AvatarFallback>
         </Avatar>
         */}
      </div>
    </header>
  );
}
