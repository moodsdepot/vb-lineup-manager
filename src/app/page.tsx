import Link from 'next/link';
import JoinTeamForm from '@/components/teams/JoinTeamForm';
import CreateTeamForm from '@/components/teams/CreateTeamForm';

export default function Page() {
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

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4">Join Team</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your team code to access your team's lineups
            </p>
            <JoinTeamForm />
          </div>

          <div className="bg-card rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4">Create Team</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Start a new team and invite your players
            </p>
            <CreateTeamForm />
          </div>

          <div className="bg-card rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Try the app without creating a team
            </p>
            <Link 
              href="/court"
              className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Open Court
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
