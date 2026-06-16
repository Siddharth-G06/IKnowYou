import MemoryFeed from "../../components/MemoryFeed";

export default function MemoriesPage() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">All Memories</h1>
      <MemoryFeed />
    </main>
  );
}
