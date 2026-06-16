"use client";
import { useState } from "react";
import { api } from "../lib/api";

export default function VoiceCapture() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const handleToggle = () => {
    // Placeholder for actual MediaRecorder logic
    setRecording(!recording);
  };

  return (
    <div className="p-4 border rounded shadow">
      <button onClick={handleToggle} className="bg-blue-500 text-white px-4 py-2 rounded">
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {transcript && <p className="mt-2 text-green-600">Transcript: {transcript}</p>}
    </div>
  );
}
