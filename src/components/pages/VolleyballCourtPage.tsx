import Link from 'next/link';
import Image from 'next/image';
import VolleyballCourt from "@/components/court/VolleyballCourt";

export default function VolleyballCourtPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-[var(--court-surface)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </Link>
        </div>

        <header className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image
              src="/volleyball-logo.png"
              alt="LineupMan Volleyball Logo"
              width={40}
              height={40}
              className="inline-block"
            />
            <h1 className="text-3xl font-bold tracking-tight">
              Volleyball Lineup Manager
            </h1>
          </div>
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