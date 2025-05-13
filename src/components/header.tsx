
'use client'; // Make this a client component to use onClick with browser APIs

import React from 'react';
import { Bot, DownloadCloud } from 'lucide-react'; // Use appropriate icons
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';


// Note: The functions inlineCSS and inlineJS are not used for Python server download
// but are kept here in case the HTML snapshot functionality is reinstated or desired elsewhere.
async function inlineCSS(doc: Document): Promise<Document> {
  const clonedDoc = doc.cloneNode(true) as Document;
  const linkElements = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));

  for (const link of linkElements) {
    const href = link.getAttribute('href');
    if (href) {
      try {
        const absoluteUrl = new URL(href, clonedDoc.baseURI).href;
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
    if (src && !script.type?.includes('application/json')) { 
      try {
        const absoluteUrl = new URL(src, clonedDoc.baseURI).href;
        if (new URL(absoluteUrl).origin === window.location.origin || absoluteUrl.startsWith('data:')) {
            const response = await fetch(absoluteUrl);
            if (response.ok) {
                const jsText = await response.text();
                const newScriptElement = clonedDoc.createElement('script');
                if (script.id) newScriptElement.id = script.id;
                newScriptElement.textContent = jsText;
                script.parentNode?.replaceChild(newScriptElement, script);
            } else {
                console.warn(`Failed to fetch JS for inlining: ${src}, status: ${response.status}. Keeping original script tag.`);
            }
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
      if (typeof window === 'undefined') {
        toast({
          title: 'Hata',
          description: 'İndirme yalnızca tarayıcıdan başlatılabilir.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Python Sunucu Betiği İndiriliyor',
        description: 'Uygulamayı lokalde Python ile çalıştırmak için bir sunucu betiği ve talimatlar indirilecek. Lütfen betik içindeki talimatları dikkatlice okuyun.',
        duration: 10000, // Increased duration for user to read
      });

      const pythonServerScript = `
import http.server
import socketserver
import os
import webbrowser

PORT = 8000
# ========================== IMPORTANT SETUP INSTRUCTIONS ==========================
# This Python script serves files from a directory named 'exported_next_app'.
# To run the AI Code Weaver application (this web application) locally using this script:
#
# 1. GET THE SOURCE CODE: You need the complete Next.js project source code for AI Code Weaver.
#    This script CANNOT automatically package the running web application from your browser.
#
# 2. INSTALL DEPENDENCIES: Open a terminal in the AI Code Weaver project's root directory and run:
#    npm install
#    (or 'yarn install' if you use Yarn)
#
# 3. BUILD THE PROJECT: In the same terminal, run:
#    npm run build
#    (or 'yarn build')
#
# 4. EXPORT TO STATIC FILES: In the same terminal, run:
#    npm run export
#    (or 'yarn export')
#    - If an 'export' script doesn't exist in 'package.json', you might need to add it.
#      A basic one is: "export": "next export"
#    - This command will typically create an 'out' folder containing static HTML, CSS, and JS files.
#    - Note: Not all Next.js features (especially server-side logic like Genkit AI flows)
#      can be fully replicated in a static export. The core UI should work.
#
# 5. PREPARE SERVE DIRECTORY:
#    - In the SAME directory where you save THIS 'run_local_server.py' script,
#      create a NEW FOLDER named: exported_next_app
#
# 6. COPY EXPORTED FILES:
#    - Copy ALL files and folders from the 'out' directory (created in Step 4)
#      INTO the 'exported_next_app' directory (created in Step 5).
#
# 7. RUN THIS PYTHON SCRIPT:
#    - Open a terminal in the directory where you saved this 'run_local_server.py' script.
#    - Run: python run_local_server.py
#    - Your browser should open to http://localhost:8000.
#
# ==================================================================================

WEB_DIR = 'exported_next_app'

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_GET(self):
        # Serve index.html for root path or directory paths
        path_to_check = os.path.join(WEB_DIR, self.path.lstrip('/'))
        if os.path.isdir(path_to_check):
            if not self.path.endswith('/'):
                self.send_response(301)
                self.send_header('Location', self.path + '/')
                self.end_headers()
                return
            self.path += 'index.html'
        # Try to serve .html for paths without extension (basic client-side routing support)
        elif not os.path.splitext(self.path)[1] and os.path.exists(path_to_check + '.html'):
             self.path += '.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

def run_server():
    print("--- AI Code Weaver - Local Python Server ---")
    print("Starting server to serve static files for the AI Code Weaver application.")
    print(f"Please ensure you have followed all setup instructions at the top of this script.")

    if not os.path.exists(WEB_DIR) or not os.listdir(WEB_DIR):
        print(f"ERROR: The directory '{WEB_DIR}' is missing or empty.")
        print(f"Please create '{WEB_DIR}' and populate it with the exported Next.js application files as per the instructions.")
        try:
            os.makedirs(WEB_DIR, exist_ok=True)
            placeholder_content = f"""
            <!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>Setup Required</title>
            <style>body {{ font-family: sans-serif; padding: 20px; }} h1 {{ color: #d9534f; }} pre {{ background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }}</style></head>
            <body><h1>Setup Required for AI Code Weaver</h1>
            <p>The directory <strong>'{WEB_DIR}'</strong> is currently empty or was just created by this script.</p>
            <p>To run the AI Code Weaver application locally, you need to manually prepare the application files:</p>
            <pre>
SETUP INSTRUCTIONS:

1. GET THE SOURCE CODE: You need the complete Next.js project source code for AI Code Weaver.

2. INSTALL DEPENDENCIES: Open a terminal in the AI Code Weaver project's root directory and run:
   npm install (or yarn install)

3. BUILD THE PROJECT: In the same terminal, run:
   npm run build (or yarn build)

4. EXPORT TO STATIC FILES: In the same terminal, run:
   npm run export (or yarn export)
   (If 'export' script is not in package.json, add: "export": "next export")
   This creates an 'out' folder.

5. PREPARE SERVE DIRECTORY:
   - In the SAME directory as THIS 'run_local_server.py' script,
     ensure there is a folder named: {WEB_DIR}

6. COPY EXPORTED FILES:
   - Copy ALL contents from the 'out' folder (from Step 4)
     INTO the '{WEB_DIR}' folder.

7. RUN THIS PYTHON SCRIPT AGAIN.
            </pre>
            </body></html>
            """
            with open(os.path.join(WEB_DIR, "index.html"), "w", encoding="utf-8") as f:
                f.write(placeholder_content)
            print(f"Created a placeholder 'index.html' in '{WEB_DIR}'. Please populate the directory and restart.")
        except Exception as e_create:
            print(f"Could not create placeholder directory/file: {e_create}")
        input("\\nPress Enter to exit.")
        return

    print(f"Serving files from './{WEB_DIR}' directory.")
    print(f"Attempting to start server at http://localhost:{PORT}")
    
    httpd = None
    try:
        # Allow address reuse
        socketserver.TCPServer.allow_reuse_address = True
        httpd = socketserver.TCPServer(("", PORT), Handler)
        print(f"Server started successfully! Access it at http://localhost:{PORT}")
        print("Your browser should open automatically. If not, please navigate to the address above.")
        print("Press Ctrl+C in this terminal to stop the server.")
        try:
            webbrowser.open_new_tab(f"http://localhost:{PORT}")
        except Exception as e_browser:
            print(f"Could not open browser automatically: {e_browser}. Please open manually.")
        httpd.serve_forever()
    except OSError as e_os:
        print(f"ERROR starting server: {e_os}")
        if "address already in use" in str(e_os).lower():
            print(f"The port {PORT} is likely in use by another application.")
            print("Please stop the other application or change the 'PORT' variable at the top of this script to a different number (e.g., 8001).")
        else:
            print("An unexpected OS error occurred.")
    except KeyboardInterrupt:
        print("\\nServer stopped by user (Ctrl+C).")
    finally:
        if httpd:
            httpd.server_close()
        print("Exiting server script.")

if __name__ == "__main__":
    run_server()
`;

      const blob = new Blob([pythonServerScript], { type: 'text/x-python;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'run_local_server.py'; // Changed filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: 'Python Sunucu Betiği İndirildi',
        description: 'run_local_server.py indirildi. Çalıştırmak için betik içindeki ve konsoldaki talimatları izleyin (Python, Node.js ve npm/yarn gereklidir).',
        duration: 20000, // Longer duration for extensive instructions
      });

    } catch (error) {
      console.error("Error preparing Python server script for download:", error);
      toast({
        title: 'İndirme Hatası',
        description: `Python sunucu betiği hazırlanamadı. ${error instanceof Error ? error.message : ''}`,
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
          Projeyi Lokal Sunucu Olarak İndir (Python)
        </Button>
      </div>
    </header>
  );
}

