export default function PersonCard({ person }: { person: any }) {
  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-lg font-bold">{person.name}</h2>
    </div>
  );
}
