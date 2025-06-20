
import { CodeInput } from '@/components/code-input';
import { CodeOutput } from '@/components/code-output';
import { Header } from '@/components/header';
import { Preview } from '@/components/preview';

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-secondary">
      <Header />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-border overflow-hidden">
        {/* Left Column */}
        <div className="flex flex-col bg-background overflow-hidden">
          <CodeInput />
        </div>
        {/* Right Column */}
        <div className="flex flex-col bg-background overflow-hidden">
          <div className="flex-[2] min-h-0 border-b border-border"> {/* Wrapper for CodeOutput */}
            <CodeOutput />
          </div>
          <div className="flex-[2] min-h-0"> {/* Wrapper for Preview */}
            <Preview />
          </div>
          <div className="flex-1 bg-muted/50 p-2 border-t border-border flex flex-col items-center justify-center min-h-[100px] text-center"> {/* Ad Area */}
            <script async src="https://quintessentialreport.com/b/3/V/0/P.3ypsv/b/mFVJJfZ/D/0p2yNsD/MD5hMpzMQp4HLaTwYT0BM/zRk/zwNkDfkw"></script>
            <p className="text-sm font-medium mt-2">Reklam Alanı</p>
            <p className="text-xs text-muted-foreground">(İçerik harici script ile yüklenecektir)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
