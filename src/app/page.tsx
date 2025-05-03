import { CodeInput } from '@/components/code-input';
import { CodeOutput } from '@/components/code-output';
import { Header } from '@/components/header';
import { Preview } from '@/components/preview';

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-secondary">
      <Header />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-border overflow-hidden">
        <div className="flex flex-col bg-background overflow-hidden">
          <CodeInput />
        </div>
        <div className="flex flex-col bg-background overflow-hidden">
          <CodeOutput />
          <Preview />
        </div>
      </main>
    </div>
  );
}
