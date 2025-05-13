'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import JoinTeamForm from '@/components/teams/JoinTeamForm';
import CreateTeamForm from '@/components/teams/CreateTeamForm';
import AuthModal from '@/components/auth/AuthModal';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
     const supabase = getSupabaseBrowserClient(); 
     let isMounted = true;
     const fetchUser = async () => { 
        try {
             const { data: { session }, error } = await supabase.auth.getSession();
             if (error) throw error;
             if (isMounted) {
                 setUser(session?.user ?? null);
             }
        } catch (err) {
            console.error("Error getting session on page load:", err);
        }
     };
     fetchUser();
     const { data: authListener } = supabase.auth.onAuthStateChange(
         (event, session) => {
             if (isMounted) {
                 setUser(session?.user ?? null);
                 // Maybe close modal if user logs in/out while it's open?
                 // if(isAuthModalOpen) setIsAuthModalOpen(false); 
             }
         }
     );
     return () => { 
         isMounted = false;
         authListener.subscription.unsubscribe(); 
     };
  }, []);

  const openModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleInitiateJoin = () => {
    if (!user) {
      openModal('login'); 
      return false; 
    }
    return true; 
  };

  const handleInitiateCreate = () => {
    if (!user) {
      openModal('login'); 
      return false; 
    }
    return true; 
  };
  
  // Optional: Show a loading indicator for the whole page?
  // if (loadingUser) return <div>Loading...</div>;

  return (
    <main className="min-h-screen w-full relative overflow-y-auto">
      {/* Fixed Background Image Layer */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: "url('/hardwood.png')" }} 
      >
        {/* Optional subtle overlay to darken/tint the background if needed */}
        {/* <div className="absolute inset-0 bg-black/30"></div> */}
      </div>

      {/* Render the Modal */}
      <AuthModal 
        open={isAuthModalOpen} 
        onOpenChange={setIsAuthModalOpen}
        initialMode={authModalMode} 
      />

      <div className="relative w-full max-w-7xl mx-auto px-4 py-12 md:py-24 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-24">
          <div className="mb-8">
            <Image 
              src="/volleyball-logo.png"
              alt="LineupMan Volleyball Logo"
              width={100} 
              height={100} 
              className="mx-auto" 
              priority 
            />
          </div>
          <h1 className="font-satoshi font-bold text-5xl md:text-7xl lg:text-8xl tracking-tight text-white mb-6">
            LineupMan
          </h1>
          <p className="font-satoshi text-xl md:text-2xl text-white/80 max-w-2xl mx-auto">
            Create, manage, and share your team lineups with ease
          </p>
        </div>

        {/* Cards - Vertical Stack */}
        <div className="w-full max-w-md space-y-6">
          {/* Join Team Card */}
          <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 shadow-lg">
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
            </div>
            <p className="text-white/70 mb-6">
              Enter your team code to access your team&apos;s lineups
            </p>
            <JoinTeamForm 
              onInitiateSubmit={handleInitiateJoin} 
              userId={user?.id}
            />
          </div>

          {/* Create Team Card */}
          <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-violet-500/20 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                  </svg>
                </div>
                <h2 className="font-satoshi font-bold text-2xl text-white">Create Team</h2>
              </div>
            </div>
            <p className="text-white/70 mb-6">
              Start a new team and invite your players
            </p>
            <CreateTeamForm 
              onInitiateSubmit={handleInitiateCreate} 
              userId={user?.id}
            />
          </div>

          {/* Quick Start Card */}
          <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 shadow-lg">
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
    </main>
  );
}
