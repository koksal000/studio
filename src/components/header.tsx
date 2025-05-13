
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
        // Only fetch if it's a relative path, absolute path from same origin, or data URI
        if (!href.startsWith('http') || new URL(absoluteUrl).origin === window.location.origin || absoluteUrl.startsWith('data:')) {
          const response = await fetch(absoluteUrl);
          if (response.ok) {
            const cssText = await response.text();
            const styleElement = clonedDoc.createElement('style');
            styleElement.textContent = cssText;
            link.parentNode?.replaceChild(styleElement, link);
          } else {
            console.warn(`Failed to fetch CSS for inlining: ${href}, status: ${response.status}. Keeping link.`);
          }
        } else {
          console.warn(`Skipping external CSS: ${href}`);
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
    // Only process scripts with src and not type application/json (like Next.js data islands)
    if (src && !script.type?.includes('application/json')) { 
      try {
        const absoluteUrl = new URL(src, clonedDoc.baseURI).href;
         // Only fetch if it's a relative path or absolute path from same origin
        if (!src.startsWith('http') || new URL(absoluteUrl).origin === window.location.origin) {
            const response = await fetch(absoluteUrl);
            if (response.ok) {
                const jsText = await response.text();
                const newScriptElement = clonedDoc.createElement('script');
                if (script.id) newScriptElement.id = script.id;
                // Copy attributes like type, defer, async if they exist
                if (script.type) newScriptElement.type = script.type;
                if (script.hasAttribute('defer')) newScriptElement.defer = true;
                if (script.hasAttribute('async')) newScriptElement.async = true;
                
                newScriptElement.textContent = jsText;
                script.parentNode?.replaceChild(newScriptElement, script);
            } else {
                console.warn(`Failed to fetch JS for inlining: ${src}, status: ${response.status}. Keeping original script tag.`);
            }
        } else {
             console.warn(`Skipping external JS: ${src}. Keeping original script tag.`);
        }
      } catch (error) {
        console.error(`Error inlining JS ${src}:`, error, ". Keeping original script tag.");
      }
    }
  }
  // Remove Next.js specific script __NEXT_DATA__ as it's not useful in a static context
  // and might cause issues or unnecessary bloat.
  const nextDataScript = clonedDoc.getElementById('__NEXT_DATA__');
  if (nextDataScript) {
    nextDataScript.remove();
  }
  
  return clonedDoc;
}


export function Header() {
  const { toast } = useToast();

  const handleDownloadStaticSnapshot = async () => {
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
        title: 'Statik Anlık Görüntü Hazırlanıyor...',
        description: 'Uygulamanın statik bir HTML kopyası oluşturuluyor. Lütfen bekleyin. Bu kopya AI özelliklerini İÇERMEYECEKTİR.',
        duration: 5000,
      });

      // 1. Clone the entire current document
      let newDoc = new DOMParser().parseFromString(document.documentElement.outerHTML, 'text/html');

      // 2. Inline CSS
      newDoc = await inlineCSS(newDoc);

      // 3. Inline JavaScript (with caveats - full Next.js interactivity is unlikely to be preserved)
      newDoc = await inlineJS(newDoc);
      
      // 4. Add a prominent warning message to the downloaded HTML
      const warningScript = newDoc.createElement('script');
      warningScript.textContent = `
        alert("ÖNEMLİ UYARI:\\n\\nBu, AI Code Weaver uygulamasının statik bir HTML anlık görüntüsüdür.\\n\\n- AI KOD ÜRETME ve DÜZENLEME ÖZELLİKLERİ BU DOSYADA ÇALIŞMAYACAKTIR.\\n- Bu dosya yalnızca uygulamanın o anki görsel yapısını ve temel istemci tarafı etkileşimlerini (varsa) gösterir.\\n- Tam işlevsellik ve AI özellikleri için lütfen orijinal AI Code Weaver uygulamasını kullanın.\\n\\nBu, Next.js tabanlı bir uygulamanın tamamen istemci tarafında çalışan, AI yeteneklerine sahip tek bir HTML dosyasına dönüştürülmesinin teknik sınırlamalarından kaynaklanmaktadır. AI işlemleri sunucu tarafı mantık ve güvenli API anahtarları gerektirir.");
        console.warn("ÖNEMLİ UYARI: Bu, AI Code Weaver uygulamasının statik bir HTML anlık görüntüsüdür. AI kod üretme ve düzenleme özellikleri bu dosyada ÇALIŞMAYACAKTIR. Tam işlevsellik için lütfen orijinal uygulamayı kullanın.");
      `;
      // Prepend to body to ensure it runs early
      if (newDoc.body) {
        newDoc.body.prepend(warningScript);
      } else if (newDoc.documentElement) {
        const tempBody = newDoc.createElement('body');
        tempBody.prepend(warningScript);
        while (newDoc.documentElement.firstChild) {
            tempBody.appendChild(newDoc.documentElement.firstChild);
        }
        newDoc.documentElement.appendChild(tempBody);
      }


      // 5. Serialize the modified document
      const finalHtml = `<!DOCTYPE html>\n${newDoc.documentElement.outerHTML}`;
      
      const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ai-code-weaver-static-snapshot.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: 'Statik Anlık Görüntü İndirildi',
        description: 'ai-code-weaver-static-snapshot.html indirildi. Unutmayın, bu yalnızca statik bir kopyadır ve AI özellikleri çalışmayacaktır.',
        duration: 10000,
      });

    } catch (error) {
      console.error("Error preparing project static snapshot for download:", error);
      toast({
        title: 'İndirme Hatası',
        description: `Proje anlık görüntüsü oluşturulamadı. ${error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.'}`,
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
          onClick={handleDownloadStaticSnapshot} // Changed function name
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          <DownloadCloud className="mr-2 h-4 w-4" />
          Projeyi İndir
        </Button>
      </div>
    </header>
  );
}

