import { GitBranch } from 'lucide-react';
import FamilyGraph from '@/components/FamilyGraph';

export default function GraphPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in-up">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center glow-amber">
            <GitBranch size={22} className="text-indigo-400" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Family Tree
          </h1>
        </div>
        <p className="text-muted-foreground text-sm font-medium">
          Visualize your entire relationship network
        </p>
      </header>

      {/* Graph Area */}
      <div className="glass-panel rounded-3xl p-1 overflow-hidden relative min-h-[70vh]">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        <FamilyGraph />
      </div>
    </div>
  );
}
