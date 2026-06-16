import MemoryFeed from "../../components/MemoryFeed";
import VoiceCapture from "../../components/VoiceCapture";
import SearchBar from "../../components/SearchBar";
import RelationshipGraph from "../../components/RelationshipGraph";

export default function Home() {
  return (
    <main className="p-8 max-w-4xl mx-auto flex flex-col gap-8">
      <h1 className="text-3xl font-bold">IKnowYou</h1>
      <SearchBar />
      <VoiceCapture />
      <RelationshipGraph />
      <MemoryFeed />
    </main>
  );
}
