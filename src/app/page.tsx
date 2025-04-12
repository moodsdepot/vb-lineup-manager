import Link from 'next/link';
import JoinTeamForm from '@/components/teams/JoinTeamForm';
import CreateTeamForm from '@/components/teams/CreateTeamForm';

export default function Page() {
  return (
    <main className="min-h-screen overflow-hidden relative">
      {/* Main full-screen background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-950 via-indigo-900 to-blue-900"></div>
      
      {/* Layered gradients for more depth and smoothness */}
      <div className="fixed inset-0 bg-gradient-to-tr from-transparent via-transparent to-violet-900/30"></div>
      <div className="fixed inset-0 bg-gradient-to-bl from-transparent via-transparent to-blue-950/40"></div>
      
      {/* Subtle radial gradient for center focus */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,rgba(15,23,42,0.2)_70%)]"></div>
      
      {/* Very subtle noise texture */}
      <div className="fixed inset-0 bg-[url('/subtle-noise.png')] opacity-[0.03]"></div>
      
      {/* Decorative glow elements positioned strategically */}
      <div className="fixed top-[10%] left-[15%] w-[40rem] h-[40rem] bg-blue-600/10 rounded-full blur-[8rem]"></div>
      <div className="fixed bottom-[15%] right-[10%] w-[35rem] h-[35rem] bg-violet-600/10 rounded-full blur-[8rem]"></div>
      <div className="fixed top-[40%] right-[20%] w-[25rem] h-[25rem] bg-indigo-600/10 rounded-full blur-[6rem]"></div>

      <div className="relative w-full max-w-7xl mx-auto px-4 py-12 md:py-24 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-24">
          <h1 className="font-satoshi font-bold text-5xl md:text-7xl lg:text-8xl tracking-tight text-white mb-6">
            LineupMan
          </h1>
          <p className="font-satoshi text-xl md:text-2xl text-white/80 max-w-2xl mx-auto">
            Create, manage, and share your volleyball lineups with ease
          </p>
        </div>

        {/* Cards - Vertical Stack */}
        <div className="w-full max-w-md space-y-6">
          {/* Join Team Card */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-blue-500/20 rounded-xl blur-lg opacity-75 group-hover:opacity-100 group-hover:blur-xl transition-all duration-500"></div>
            <div className="relative bg-blue-950/70 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <h2 className="font-satoshi font-bold text-2xl text-white">Join Team</h2>
                </div>
                <span className="text-xs font-medium bg-blue-500/20 text-blue-300 rounded-full px-2 py-1">Coming Soon</span>
              </div>
              <p className="text-white/70 mb-6">
                Enter your team code to access your team's lineups
              </p>
              <JoinTeamForm />
            </div>
          </div>

          {/* Create Team Card */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/30 to-purple-500/20 rounded-xl blur-lg opacity-75 group-hover:opacity-100 group-hover:blur-xl transition-all duration-500"></div>
            <div className="relative bg-blue-950/70 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-violet-500/20 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                    </svg>
                  </div>
                  <h2 className="font-satoshi font-bold text-2xl text-white">Create Team</h2>
                </div>
                <span className="text-xs font-medium bg-violet-500/20 text-violet-300 rounded-full px-2 py-1">Coming Soon</span>
              </div>
              <p className="text-white/70 mb-6">
                Start a new team and invite your players
              </p>
              <CreateTeamForm />
            </div>
          </div>

          {/* Quick Start Card */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/20 rounded-xl blur-lg opacity-75 group-hover:opacity-100 group-hover:blur-xl transition-all duration-500"></div>
            <div className="relative bg-blue-950/70 backdrop-blur-lg border border-white/10 rounded-xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-cyan-500/20 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                </div>
                <h2 className="font-satoshi font-bold text-2xl text-white">Quick Start</h2>
              </div>
              <p className="text-white/70 mb-6">
                Try the app without creating a team
              </p>
              <Link 
                href="/court"
                className="block w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-satoshi font-bold rounded-md text-center transition-all duration-300"
              >
                Open Court
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
