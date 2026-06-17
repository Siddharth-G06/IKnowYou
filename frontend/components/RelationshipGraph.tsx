"use client";
import { useEffect, useState } from "react";
import { getFullGraph } from "@/lib/api";
import { GitBranch, Loader2, AlertTriangle } from "lucide-react";

interface GraphNode { id: string; name: string; }
interface GraphLink { source: string; target: string; relation: string; }

export default function RelationshipGraph() {
  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getFullGraph()
      .then((d: any) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl bg-white/5 border border-white/10">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl bg-white/5 border border-white/10 gap-3 text-center px-6">
        <AlertTriangle size={28} className="text-red-400" />
        <p className="text-sm text-gray-400">Could not load graph data.</p>
      </div>
    );
  }

  if (data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl bg-white/5 border border-white/10 gap-3 text-center px-6">
        <GitBranch size={32} className="text-gray-600" />
        <p className="text-white font-semibold">No relationships yet</p>
        <p className="text-sm text-gray-500">Add people and relationships to see them visualised here.</p>
      </div>
    );
  }

  // Simple text list fallback (the actual D3 graph is in FamilyGraph.tsx)
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
        <GitBranch size={14} className="text-indigo-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          {data.nodes.length} Nodes · {data.links.length} Edges
        </span>
      </div>
      <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
        {data.links.map((link, i) => {
          const fromNode = data.nodes.find(n => n.id === link.source);
          const toNode = data.nodes.find(n => n.id === link.target);
          return (
            <div key={i} className="px-5 py-3 flex items-center gap-3 text-sm hover:bg-white/5 transition-colors">
              <span className="text-white font-medium">{fromNode?.name ?? link.source}</span>
              <span className="text-amber-500 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                {link.relation}
              </span>
              <span className="text-white font-medium">{toNode?.name ?? link.target}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
