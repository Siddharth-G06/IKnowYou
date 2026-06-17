"use client";
import { useState } from "react";
import { Mic, MicOff, Loader2, CheckCircle2, AlertTriangle, Radio } from "lucide-react";
import { api } from "../lib/api";

export default function VoiceCapture() {
  const [recording, setRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleToggle = () => {
    if (recording) {
      // Stop recording — simulate processing
      setRecording(false);
      setIsProcessing(true);
      setStatus("idle");
      setTimeout(() => {
        setIsProcessing(false);
        setTranscript("Had lunch with Amma today. She mentioned Karthik's wedding next month.");
        setStatus("success");
      }, 1800);
    } else {
      setRecording(true);
      setTranscript("");
      setStatus("idle");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 p-6 flex flex-col items-center justify-center gap-5 text-center"
      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)' }}>

      {/* Background pulse rings while recording */}
      {recording && (
        <>
          <span className="absolute w-32 h-32 rounded-full border border-red-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          <span className="absolute w-48 h-48 rounded-full border border-red-500/10 animate-ping" style={{ animationDuration: '2s' }} />
        </>
      )}

      {/* Title */}
      <div className="relative z-10">
        <h3 className="text-base font-bold text-white">Voice Journal</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {recording ? "Recording... tap to stop" : isProcessing ? "Transcribing..." : "Tap to record a memory"}
        </p>
      </div>

      {/* Mic Button */}
      <button
        onClick={handleToggle}
        disabled={isProcessing}
        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg disabled:cursor-not-allowed ${
          recording
            ? "bg-red-500/20 border-2 border-red-500/60 text-red-400 scale-110 hover:bg-red-500/30"
            : "bg-indigo-500/20 border-2 border-indigo-500/40 text-indigo-400 hover:scale-105 hover:bg-indigo-500/30"
        }`}
      >
        {isProcessing ? (
          <Loader2 size={28} className="animate-spin text-indigo-400" />
        ) : recording ? (
          <MicOff size={28} />
        ) : (
          <Mic size={28} />
        )}
      </button>

      {/* Live indicator */}
      {recording && (
        <div className="relative z-10 flex items-center gap-2 text-xs text-red-400 font-semibold">
          <Radio size={12} className="animate-pulse" />
          LIVE
        </div>
      )}

      {/* Transcript result */}
      {transcript && (
        <div className={`relative z-10 w-full p-4 rounded-xl border text-sm text-left animate-in fade-in-up ${
          status === "success"
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-red-500/10 border-red-500/20"
        }`}>
          <div className="flex items-center gap-1.5 mb-2">
            {status === "success"
              ? <CheckCircle2 size={14} className="text-emerald-400" />
              : <AlertTriangle size={14} className="text-red-400" />}
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Transcript</span>
          </div>
          <p className="text-gray-300 italic leading-relaxed">"{transcript}"</p>
        </div>
      )}
    </div>
  );
}
