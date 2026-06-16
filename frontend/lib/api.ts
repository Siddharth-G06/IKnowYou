const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = {
  async logMemory(content: string, source = "text") {
    const res = await fetch(`${BASE}/api/memories/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, source }),
    });
    return res.json();
  },

  async logVoiceMemory(audioBlob: Blob) {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");
    const res = await fetch(`${BASE}/api/memories/voice`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  async getRecentMemories(limit = 20) {
    const res = await fetch(`${BASE}/api/memories/recent?limit=${limit}`);
    return res.json();
  },

  async searchPeople(q: string) {
    const res = await fetch(`${BASE}/api/people/search?q=${encodeURIComponent(q)}`);
    return res.json();
  },

  async getPersonNetwork(id: string, depth = 2) {
    const res = await fetch(`${BASE}/api/people/${id}/network?depth=${depth}`);
    return res.json();
  },

  async semanticSearch(q: string, k = 5) {
    const res = await fetch(`${BASE}/api/search/semantic?q=${encodeURIComponent(q)}&k=${k}`);
    return res.json();
  },
};
