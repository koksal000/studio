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
  
  // Remove Next.js development-specific scripts if any more are identified (e.g., HMR scripts)
  const nextDevScripts = clonedDoc.querySelectorAll('script[src*="_next/static/chunks/webpack"], script[src*="_next/static/chunks/react-refresh"]');
  nextDevScripts.forEach(script => script.remove());

  return clonedDoc;
}


export function Header() {
  const { toast } = useToast();

  const handleDownloadClientSideHTML = async () => {
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
        title: 'İstemci Tarafı HTML Anlık Görüntüsü Oluşturuluyor...',
        description: 'Uygulamanın istemci tarafı HTML kopyası oluşturuluyor. Lütfen bekleyin...',
        duration: 5000,
      });

      // 1. Clone the entire current document
      let newDoc = new DOMParser().parseFromString(document.documentElement.outerHTML, 'text/html');

      // 2. Inline CSS
      newDoc = await inlineCSS(newDoc);

      // 3. Inline JavaScript
      newDoc = await inlineJS(newDoc);
      
      // 4. Add a prominent warning message to the downloaded HTML
      const warningScript = newDoc.createElement('script');
      warningScript.textContent = `
        alert("ÖNEMLİ UYARI: AI Code Weaver - İSTEMCİ TARAFI ANLIK GÖRÜNTÜSÜ\\n\\nBu dosya, AI Code Weaver uygulamasının o anki GÖRSEL ARAYÜZÜNÜN bir HTML kopyasıdır ve SADECE İSTEMCİ TARAFINDA çalışır.\\n\\nİŞLEVSELLİK SINIRLAMALARI:\\n- AI KOD ÜRETME, DÜZENLEME ve AÇIKLAMA özellikleri bu dosyada KESİNLİKLE ÇALIŞMAYACAKTIR.\\n  Bu özellikler, güvenli API anahtarları ve normalde bir sunucuda çalışan özel AI modelleri gerektirir. Bunlar, güvenlik ve teknik nedenlerle bir istemci tarafı HTML dosyasına gömülemez.\\n- Bu dosya, uygulamanın temel GÖRSEL yapısını ve AI olmayan bazı basit istemci tarafı etkileşimlerini (örneğin, buton tıklamaları, metin girişi gibi UI elemanları) göstermeyi amaçlar.\\n- Tam işlevsellik ve AI özellikleri için lütfen orijinal AI Code Weaver uygulamasını (bir geliştirme ortamında veya dağıtılmış tam sürümünü) kullanın.\\n\\nBu, Next.js gibi modern, sunucu etkileşimli bir web uygulamasının, tüm özellikleriyle birlikte tek bir, tamamen istemci tarafında çalışan statik HTML dosyasına dönüştürülmesinin teknik zorlukları ve güvenlik kısıtlamalarından kaynaklanmaktadır. Bu sürüm, sunucu tarafı mantığını ve Next.js'in dinamik yeteneklerini KOPYALAMAZ; yalnızca o anki sayfanın bir görüntüsünü alır ve bazı varlıkları gömmeye çalışır.");
        console.warn("ÖNEMLİ UYARI: Bu, AI Code Weaver uygulamasının istemci tarafı için basitleştirilmiş bir HTML anlık görüntüsüdür. AI kod üretme, düzenleme ve açıklama özellikleri bu dosyada ÇALIŞMAYACAKTIR. Bu sürüm, Next.js'in sunucu tarafı yeteneklerini veya AI backend'ini kopyalamaz. Tam işlevsellik için lütfen orijinal uygulamayı kullanın.");
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
      link.download = 'ai-code-weaver-client-snapshot.html'; // Updated filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: 'İstemci Tarafı HTML Anlık Görüntüsü İndirildi',
        description: 'ai-code-weaver-client-snapshot.html indirildi. Unutmayın, bu yalnızca istemci tarafı bir kopyadır ve AI özellikleri çalışmayacaktır.',
        duration: 10000,
      });

    } catch (error) {
      console.error("Error preparing client-side HTML snapshot for download:", error);
      toast({
        title: 'İndirme Hatası',
        description: `İstemci tarafı HTML anlık görüntüsü oluşturulamadı. ${error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.'}`,
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
          onClick={handleDownloadClientSideHTML} 
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          <DownloadCloud className="mr-2 h-4 w-4" />
          Projeyi İndir
        </Button>
      </div>
    </header>
  );
}
