"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { BookOpen, Mic, FileText, Calendar, Clock } from "lucide-react";

interface Memory {
  id: string;
  source?: string;
  raw_text: string;
  created_at: string;
  persons?: Array<{ id: string; name: string; nickname?: string }>;
}

function timeAgo(dateStr: string): string {
  const ts = new Date(dateStr).getTime() / 1000;
  if (isNaN(ts)) return "recently";
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MemoryFeed() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRecentMemories()
      .then((data: any) => setMemories(Array.isArray(data) ? data : []))
      .catch(() => setMemories([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
          <BookOpen size={28} className="text-gray-500" />
        </div>
        <p className="text-lg font-semibold text-white">No memories yet</p>
        <p className="text-sm text-gray-500 max-w-xs">
          Log a memory from the dashboard and it'll appear here in your timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="relative px-6 py-6">
      {/* Vertical timeline line */}
      <div className="absolute left-[2.75rem] top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      <div className="space-y-6">
        {memories.map((m, idx) => {
          const isVoice = m.source === "voice";
          return (
            <div
              key={m.id ?? idx}
              className="relative flex gap-5 group"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Timeline node */}
              <div className={`relative z-10 w-9 h-9 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all duration-300 ${
                isVoice
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400 group-hover:bg-indigo-500/30"
                  : "bg-amber-500/20 border-amber-500/40 text-amber-400 group-hover:bg-amber-500/30"
              }`}>
                {isVoice ? <Mic size={14} /> : <FileText size={14} />}
              </div>

              {/* Card */}
              <div className="flex-1 glass-card rounded-2xl p-5 space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      isVoice
                        ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400"
                        : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                    }`}>
                      {isVoice ? "Voice" : "Text"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{timeAgo(m.created_at)}</span>
                    <span className="mx-1 opacity-30">·</span>
                    <Calendar size={12} />
                    <span>{isNaN(new Date(m.created_at).getTime()) ? "Recently" : new Date(m.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <p className="text-base text-gray-100 font-medium leading-relaxed">
                    {m.raw_text}
                  </p>
                  <p className="text-[10px] font-mono text-gray-500">
                    ID: {m.id}
                  </p>
                </div>

                {/* Person tags */}
                {m.persons && m.persons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                    {m.persons.map((p) => (
                      <span
                        key={p.id}
                        className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20"
                      >
                        {p.name} {p.nickname ? `(${p.nickname})` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
