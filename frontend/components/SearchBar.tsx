"use client";
import { useState, useCallback } from "react";
import { api } from "../lib/api";
import { Search, Loader2, Sparkles, X, Clock, User, Brain, ArrowRight } from "lucide-react";

interface SearchResult {
  memory_id?: string;
  id?: string;
  raw_text?: string;
  content?: string;
  similarity_score?: number;
  score?: number;
  persons?: Array<{ id?: string; name?: string; nickname?: string }>;
  person_name?: string;
  metadata?: Record<string, string>;
  [key: string]: unknown;
}

function getField(r: SearchResult, ...keys: string[]): string {
  for (const k of keys) {
    const v = (r as Record<string, unknown>)[k];
    if (v && typeof v === "string") return v;
  }
  return "";
}

function getScore(r: SearchResult): number {
  return typeof r.similarity_score === "number"
    ? r.similarity_score
    : typeof r.score === "number"
    ? r.score
    : 0;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.round(score * 100));
  const color =
    pct >= 60 ? "#f59e0b" : pct >= 40 ? "#fb923c" : "#6366f1";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color }}>
        {pct}% match
      </span>
    </div>
  );
}

const SUGGESTIONS = [
  "Who did I meet last week?",
  "People I know from work",
  "Family members in Chennai",
  "Friends I haven't talked to recently",
];

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await api.semanticSearch(query);
      setResults(Array.isArray(res) ? res : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Search failed. Is the backend running?";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setResults(null);
    setError(null);
  };

  return (
    <div className="w-full space-y-7">

      {/* ── Search Input ───────────────────────────────────────────────── */}
      <div className="relative">
        {/* Ambient glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-indigo-500/10 rounded-2xl blur-xl opacity-0 focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative flex items-center rounded-2xl border border-[#2e3140] bg-[#181b25] overflow-hidden focus-within:border-amber-500/50 focus-within:bg-[#1c2030] transition-all duration-300 shadow-lg">
          {/* Icon */}
          <div className="pl-4 pr-3 shrink-0">
            {isLoading
              ? <Loader2 size={20} className="text-amber-400 animate-spin" />
              : <Search size={20} className="text-[#6b7280]" />
            }
          </div>

          {/* Input */}
          <input
            id="semantic-search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder='Ask anything — "who did I meet at the wedding?"'
            className="flex-1 h-14 bg-transparent text-white placeholder:text-[#3d4255] text-[15px] outline-none font-medium"
          />

          {/* Clear */}
          {query && (
            <button
              onClick={clearSearch}
              className="p-2 mr-1 rounded-lg text-[#4b5280] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={15} />
            </button>
          )}

          {/* Search button */}
          <button
            id="semantic-search-btn"
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="m-2 px-5 h-10 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 active:scale-95 text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-amber-500/20"
          >
            <Sparkles size={14} />
            Search
          </button>
        </div>
      </div>

      {/* ── Suggestions ───────────────────────────────────────────────── */}
      {!results && !error && !isLoading && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4b5280]">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="group px-3.5 py-1.5 rounded-full text-xs font-medium border border-[#2a2d3a] bg-[#181b25] text-[#6b7280] hover:text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all flex items-center gap-1.5"
              >
                <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/50 border border-red-500/25 text-red-300 text-sm">
          <X size={16} className="shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────── */}
      {results !== null && (
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#9ca3af]">
                {results.length} semantic result{results.length !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={clearSearch}
              className="text-xs text-[#4b5280] hover:text-white transition-colors"
            >
              Clear results
            </button>
          </div>

          {results.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#1a1d28] border border-[#2a2d3a] flex items-center justify-center mx-auto">
                <Sparkles size={24} className="text-[#3d4255]" />
              </div>
              <p className="text-white font-semibold">No results found</p>
              <p className="text-sm text-[#4b5280]">Try rephrasing your query or logging more memories</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, idx) => {
                const text = getField(result, "raw_text", "content");
                const score = getScore(result);
                const id = getField(result, "memory_id", "id") || String(idx);
                const persons = Array.isArray(result.persons) ? result.persons : [];
                const dateMentioned = result.metadata?.date_mentioned || "";

                return (
                  <div
                    key={id}
                    className="group relative rounded-2xl border border-[#2a2d3a] bg-[#14171f] hover:border-amber-500/30 hover:bg-[#181c28] transition-all duration-200 overflow-hidden"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/0 via-amber-400/60 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="p-5 space-y-3">
                      {/* Top row: persons + date */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {persons.length > 0 ? persons.map((p, pi) => (
                            <div key={p.id ?? pi} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                              <div className="w-4 h-4 rounded-full bg-amber-500/30 flex items-center justify-center text-[9px] font-bold text-amber-300 shrink-0">
                                {(p.name ?? p.nickname ?? "?")[0]?.toUpperCase()}
                              </div>
                              <span className="text-xs font-semibold text-amber-200">{p.name ?? p.nickname}</span>
                            </div>
                          )) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e2130] border border-[#2e3140]">
                              <User size={10} className="text-[#6b7280]" />
                              <span className="text-xs text-[#6b7280]">No persons linked</span>
                            </div>
                          )}
                        </div>

                        {dateMentioned && (
                          <div className="flex items-center gap-1 shrink-0 text-[10px] text-[#4b5280]">
                            <Clock size={10} />
                            <span className="capitalize">{dateMentioned}</span>
                          </div>
                        )}
                      </div>

                      {/* Memory text */}
                      {text ? (
                        <p className="text-[#d1d5db] text-sm leading-relaxed">{text}</p>
                      ) : (
                        <p className="text-[#4b5280] text-xs font-mono">memory/{id}</p>
                      )}

                      {/* Score bar */}
                      {score > 0 && <ScoreBar score={score} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Loading skeleton ──────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl border border-[#2a2d3a] bg-[#14171f] p-5 space-y-3 animate-pulse">
              <div className="flex gap-2">
                <div className="h-6 w-24 rounded-full bg-[#1e2130]" />
                <div className="h-6 w-16 rounded-full bg-[#1e2130]" />
              </div>
              <div className="space-y-2">
                <div className="h-3 rounded bg-[#1e2130] w-full" />
                <div className="h-3 rounded bg-[#1e2130] w-3/4" />
              </div>
              <div className="h-1.5 rounded-full bg-[#1e2130] w-2/5" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
