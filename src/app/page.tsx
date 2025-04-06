import VolleyballCourt from "@/components/court/VolleyballCourt";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">🏐 Volleyball Lineup</h1>
      <VolleyballCourt />
    </main>
  );
}
