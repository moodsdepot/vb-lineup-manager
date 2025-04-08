import VolleyballCourt from "@/components/court/VolleyballCourt";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-[var(--court-surface)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            🏐 Volleyball Lineup Manager
          </h1>
          <p className="text-muted-foreground">
            Create, manage, and share your team lineups
          </p>
        </header>
        
        <div className="bg-card rounded-lg shadow-xl p-6">
          <VolleyballCourt />
        </div>
      </div>
    </main>
  );
}
