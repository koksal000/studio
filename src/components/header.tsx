
'use client'; // Make this a client component to use onClick with browser APIs

import React from 'react';
import { Bot, DownloadCloud } from 'lucide-react'; // Use appropriate icons
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';


async function inlineCSS(doc: Document): Promise<Document> {
  const clonedDoc = doc.cloneNode(true) as Document;
  const linkElements = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));

  for (const link of linkElements) {
    const href = link.getAttribute('href');
    if (href) {
      try {
        // Create an absolute URL to handle relative paths correctly
        const absoluteUrl = new URL(href, clonedDoc.baseURI).href;

        // Only fetch same-origin CSS files to avoid CORS issues and keep it simple
        if (new URL(absoluteUrl).origin === window.location.origin) {
          const response = await fetch(absoluteUrl);
          if (response.ok) {
            const cssText = await response.text();
            const styleElement = clonedDoc.createElement('style');
            styleElement.textContent = cssText;
            link.parentNode?.replaceChild(styleElement, link);
          } else {
            console.warn(`Failed to fetch CSS for inlining: ${href}, status: ${response.status}`);
          }
        } else {
          // console.log(`Skipping external CSS: ${href}`);
        }
      } catch (error) {
        console.error(`Error inlining CSS ${href}:`, error);
      }
    }
  }
  return clonedDoc;
}

export function Header() {
  const { toast } = useToast();

  const handleDownloadProjectApp = async () => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        toast({
          title: 'Hata',
          description: 'İndirme yalnızca tarayıcıdan başlatılabilir.',
          variant: 'destructive',
        });
        return;
      }

      // Attempt to inline CSS resources
      const docWithInlinedCSS = await inlineCSS(document);
      
      // Serialize the modified document
      // outerHTML of documentElement includes the <html> tag itself.
      // We prepend <!DOCTYPE html> for a complete document.
      const pageHtml = `<!DOCTYPE html>\n${docWithInlinedCSS.documentElement.outerHTML}`;
      
      const blob = new Blob([pageHtml], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ai-code-weaver-app.html'; // Changed filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: 'Uygulama İndirildi',
        description: 'Uygulamanın bir kopyası (CSS stilleri gömülmüş olarak) indirildi. JavaScript dosyaları bağlantılıdır ve tam işlevsellik yerel olarak veya farklı bir alan adında çalıştırıldığında garanti edilemez.',
        duration: 10000, // Longer duration for important message
      });

    } catch (error) {
      console.error("Error downloading project app:", error);
      toast({
        title: 'İndirme Hatası',
        description: `Proje uygulaması indirilemedi. ${error instanceof Error ? error.message : ''}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <header className="flex items-center justify-between p-4 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6" /> {/* Or use Code icon */}
        <h1 className="text-xl font-semibold">AI Code Weaver</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownloadProjectApp} // Changed onClick handler
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          <DownloadCloud className="mr-2 h-4 w-4" />
          {/* Changed button text to Turkish as per user's implied intent */}
          Projeyi İndir (HTML)
        </Button>
         {/* Add any other header elements like user profile, settings, etc. here */}
      </div>
    </header>
  );
}

