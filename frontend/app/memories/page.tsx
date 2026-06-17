import MemoryFeed from "../../components/MemoryFeed";
import { BookOpen } from "lucide-react";

export default function MemoriesPage() {
  return (
    <main className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in-up">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center glow-amber">
            <BookOpen size={20} className="text-emerald-400" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            All Memories
          </h1>
        </div>
        <p className="text-muted-foreground text-sm font-medium">
          A chronological feed of everything you've logged
        </p>
      </header>
      
      <div className="glass-panel p-1 rounded-3xl bg-background/40">
        <MemoryFeed />
      </div>
    </main>
  );
}
