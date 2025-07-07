
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
          <div className="flex-1 min-h-0 border-b border-border"> {/* Wrapper for CodeOutput */}
            <CodeOutput />
          </div>
          <div className="flex-1 min-h-0"> {/* Wrapper for Preview */}
            <Preview />
          </div>
        </div>
      </main>
    </div>
  );
}
