export default function PersonPage({ params }: { params: { id: string } }) {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Person Details</h1>
      <p>ID: {params.id}</p>
    </main>
  );
}
