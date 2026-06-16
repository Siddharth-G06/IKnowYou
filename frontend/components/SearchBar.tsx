"use client";
import { useState } from "react";
import { api } from "../lib/api";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    const res = await api.semanticSearch(query);
    setResults(res);
  };

  return (
    <div className="w-full flex gap-2">
      <input 
        className="flex-1 p-2 border rounded" 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
        placeholder="Search memories semantically..." 
      />
      <button className="bg-blue-600 text-white px-4 rounded" onClick={handleSearch}>Search</button>
    </div>
  );
}
