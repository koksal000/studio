
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
        const absoluteUrl = new URL(href, clonedDoc.baseURI).href;
        // Only fetch same-origin CSS files to avoid CORS issues and keep it simple
        // or if it's a data URI
        if (new URL(absoluteUrl).origin === window.location.origin || absoluteUrl.startsWith('data:')) {
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

async function inlineJS(doc: Document): Promise<Document> {
  const clonedDoc = doc.cloneNode(true) as Document;
  const scriptElements = Array.from(clonedDoc.querySelectorAll('script[src]'));

  for (const script of scriptElements) {
    const src = script.getAttribute('src');
    if (src && !script.type?.includes('application/json')) { // Skip JSON data scripts like __NEXT_DATA__
      try {
        const absoluteUrl = new URL(src, clonedDoc.baseURI).href;
         // Only attempt to fetch same-origin scripts
        if (new URL(absoluteUrl).origin === window.location.origin || absoluteUrl.startsWith('data:')) {
            const response = await fetch(absoluteUrl);
            if (response.ok) {
                const jsText = await response.text();
                const newScriptElement = clonedDoc.createElement('script');
                if (script.id) newScriptElement.id = script.id;
                // Do not set type="module" for inline scripts as it might cause issues with file:/// protocol
                // if (script.type) newScriptElement.type = script.type; 
                newScriptElement.textContent = jsText;
                script.parentNode?.replaceChild(newScriptElement, script);
            } else {
                console.warn(`Failed to fetch JS for inlining: ${src}, status: ${response.status}. Keeping original script tag.`);
            }
        } else {
            // console.log(`Skipping external JS: ${src}`);
        }
      } catch (error) {
        console.error(`Error inlining JS ${src}:`, error, ". Keeping original script tag.");
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

      toast({
        title: 'Proje İndirme Başlatıldı',
        description: 'CSS ve JavaScript stilleri gömülüyor... Bu işlem biraz zaman alabilir.',
        duration: 5000,
      });

      // 1. Clone the current document to avoid altering the live page
      let downloadableDoc = document.cloneNode(true) as Document;
      
      // 2. Inline CSS
      try {
        downloadableDoc = await inlineCSS(downloadableDoc);
      } catch (error) {
        console.error("Error during CSS inlining:", error);
        toast({
            title: 'CSS Gömme Hatası',
            description: `CSS stilleri gömülürken bir hata oluştu. ${error instanceof Error ? error.message : ''}`,
            variant: 'destructive',
        });
        // Proceed with potentially non-inlined CSS
      }

      // 3. Attempt to Inline JavaScript (EXPERIMENTAL)
      // This is highly experimental for complex apps like Next.js and might not achieve full functionality.
      try {
        downloadableDoc = await inlineJS(downloadableDoc);
      } catch (error) {
        console.error("Error during JavaScript inlining:", error);
         toast({
            title: 'JavaScript Gömme Hatası',
            description: `JavaScript gömülmeye çalışılırken bir hata oluştu. ${error instanceof Error ? error.message : ''}`,
            variant: 'destructive',
        });
        // Proceed with potentially non-inlined JS
      }
      
      // Remove any Next.js development-specific overlay scripts or elements if they exist
      downloadableDoc.querySelectorAll('next-dev-overlay, nextjs-portal, script[src*="/_next/static/chunks/react-refresh."]').forEach(el => el.remove());


      // Serialize the modified document
      const pageHtml = `<!DOCTYPE html>\n${downloadableDoc.documentElement.outerHTML}`;
      
      const blob = new Blob([pageHtml], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ai-code-weaver-app.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: 'Proje İndirildi (HTML Anlık Görüntü)',
        description: 'Projenin bir kopyası (CSS ve denenen JS gömülerek) indirildi. Yerel olarak açıldığında tam işlevsellik, özellikle sunucuya bağımlı özellikler (örneğin kod üretimi) veya karmaşık istemci tarafı etkileşimleri garanti edilemez.',
        duration: 15000, 
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
        <Bot className="h-6 w-6" />
        <h1 className="text-xl font-semibold">AI Code Weaver</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownloadProjectApp}
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          <DownloadCloud className="mr-2 h-4 w-4" />
          Projeyi İndir (HTML)
        </Button>
      </div>
    </header>
  );
}
