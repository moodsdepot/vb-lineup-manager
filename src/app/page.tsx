import Link from 'next/link';
import JoinTeamForm from '@/components/teams/JoinTeamForm';
import CreateTeamForm from '@/components/teams/CreateTeamForm';

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-background to-violet-900">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[url('/volleyball-pattern.svg')] opacity-[0.02] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/50 to-background/80" />

      <div className="relative w-full max-w-6xl mx-auto px-4 py-8 md:py-16 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-16 h-16 md:w-20 md:h-20">
              🏐
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Volleyball Lineup Manager
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Create, manage, and share your team lineups with ease
          </p>
        </div>

        {/* Cards Section */}
        <div className="w-full max-w-4xl space-y-6 md:space-y-8">
          {/* Join Team Card */}
          <div className="group relative">
            <div className="absolute -inset-px bg-gradient-to-r from-primary/50 to-primary/30 rounded-lg blur" />
            <div className="relative bg-card/80 backdrop-blur-sm border rounded-lg p-6 md:p-8 hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <span className="p-2 bg-primary/10 rounded-lg">👥</span>
                Join Team
              </h2>
              <p className="text-muted-foreground mb-6">
                Enter your team code to access your team's lineups
              </p>
              <JoinTeamForm />
            </div>
          </div>

          {/* Create Team Card */}
          <div className="group relative">
            <div className="absolute -inset-px bg-gradient-to-r from-blue-500/50 to-violet-500/30 rounded-lg blur" />
            <div className="relative bg-card/80 backdrop-blur-sm border rounded-lg p-6 md:p-8 hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <span className="p-2 bg-blue-500/10 rounded-lg">✨</span>
                Create Team
              </h2>
              <p className="text-muted-foreground mb-6">
                Start a new team and invite your players
              </p>
              <CreateTeamForm />
            </div>
          </div>

          {/* Quick Start Card */}
          <div className="group relative">
            <div className="absolute -inset-px bg-gradient-to-r from-violet-500/50 to-primary/30 rounded-lg blur" />
            <div className="relative bg-card/80 backdrop-blur-sm border rounded-lg p-6 md:p-8 hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <span className="p-2 bg-violet-500/10 rounded-lg">🎯</span>
                Quick Start
              </h2>
              <p className="text-muted-foreground mb-6">
                Try the app without creating a team
              </p>
              <Link 
                href="/court"
                className="w-full inline-flex items-center justify-center rounded-md bg-primary/90 hover:bg-primary px-4 py-3 text-base font-medium text-primary-foreground transition-colors"
              >
                Open Court
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="ml-2 h-4 w-4" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
