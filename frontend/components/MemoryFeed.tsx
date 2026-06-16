import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function MemoryFeed() {
  const [memories, setMemories] = useState<any[]>([]);

  useEffect(() => {
    api.getRecentMemories().then(setMemories);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {memories.map((m: any) => (
        <div key={m.id} className="p-4 border rounded shadow">
          <p className="text-sm text-gray-500">{new Date(m.created_at * 1000).toLocaleString()} - {m.source}</p>
          <p>Encrypted Content: {m.content_encrypted}</p>
        </div>
      ))}
    </div>
  );
}
