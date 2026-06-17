"use client";
import { useState } from "react";
import { api } from "../lib/api";
import { Send, Loader2, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

export default function MemoryLogger() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const res = await api.logMemory(content);
      setResult({ ok: true, data: res });
      setContent("");
    } catch (e: any) {
      setResult({ ok: false, error: e?.message ?? "Backend unavailable." });
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > 2000;

  return (
    <div className="space-y-4">
      {/* Textarea */}
      <div className="relative">
        <textarea
          id="memory-input"
          rows={4}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`"Had lunch with Amma today. She mentioned Karthik's wedding next month..."`}
          className="w-full rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-600 bg-white/5 border border-white/10 outline-none resize-none transition-all focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 leading-relaxed"
        />
        <div className={`absolute bottom-3 right-4 text-xs font-mono ${isOverLimit ? 'text-red-400' : 'text-gray-600'}`}>
          {charCount}/2000
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600">
        <Sparkles size={12} className="text-amber-500/50" />
        <span>IKnowYou will automatically extract people and relationships from your memory.</span>
      </div>

      {/* Submit row */}
      <div className="flex justify-end">
        <button
          id="log-memory-btn"
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading || isOverLimit}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {isLoading ? (
            <><Loader2 size={15} className="animate-spin" /> Logging...</>
          ) : (
            <><Send size={15} /> Log Memory</>
          )}
        </button>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`rounded-xl p-4 text-sm border flex items-start gap-3 animate-in fade-in-up duration-300 ${
          result.ok
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {result.ok
            ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            : <AlertTriangle size={18} className="mt-0.5 shrink-0" />}
          <div>
            {result.ok ? (
              <>
                <p className="font-semibold">Memory logged!</p>
                <p className="text-xs mt-0.5 opacity-80">
                  {result.data?.extraction?.persons?.length
                    ? <>Found <strong>{result.data.extraction.persons.filter((p: {name?: string}) => p.name && p.name !== 'I').length}</strong> {result.data.extraction.persons.length === 1 ? 'person' : 'people'} · </>
                    : null}
                  ID: {String(result.data?.id ?? '').substring(0, 16)}…
                </p>
              </>
            ) : (
              <p>{result.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
