import Link from 'next/link';
import VolleyballCourt from "@/components/court/VolleyballCourt";

export default function VolleyballCourtPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-[var(--court-surface)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <Link 
            href="/"
            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
          >
            ← Back to Home
          </Link>
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              🏐 Volleyball Lineup Manager
            </h1>
            <p className="text-muted-foreground">
              Create, manage, and share your team lineups
            </p>
          </div>
          
          {/* Empty div to maintain centering with flexbox */}
          <div className="w-[100px]"></div>
        </header>
        
        <div className="bg-card rounded-lg shadow-xl p-6">
          <VolleyballCourt />
        </div>
      </div>
    </main>
  );
} 