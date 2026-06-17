import SearchBar from "../../components/SearchBar";
import { Search } from "lucide-react";

export default function SearchPage() {
  return (
    <main className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in-up">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center glow-amber">
            <Search size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Semantic Search
          </h1>
        </div>
        <p className="text-muted-foreground text-sm font-medium">
          Search through your memories and relationships using natural language
        </p>
      </header>
      
      <div className="glass-panel p-8 rounded-3xl">
        <SearchBar />
      </div>
    </main>
  );
}
