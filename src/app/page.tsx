'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import JoinTeamForm from '@/components/teams/JoinTeamForm';
import CreateTeamForm from '@/components/teams/CreateTeamForm';
import AuthModal from '@/components/auth/AuthModal';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'link'>('login');
  const [quickStartLoading, setQuickStartLoading] = useState(false);
  const [quickStartError, setQuickStartError] = useState<string | null>(null);
  const router = useRouter();

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
             }
         }
     );
     return () => {
         isMounted = false;
         authListener.subscription.unsubscribe();
     };
  }, []);

  const openModal = (mode: 'login' | 'signup' | 'link') => {
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

  const handleQuickStart = async () => {
    const supabase = getSupabaseBrowserClient();
    setQuickStartLoading(true);
    setQuickStartError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        router.push('/court');
        return;
      }

      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      router.push('/court');
    } catch (err) {
      console.error('Quick start error:', err);
      const message = err instanceof Error ? err.message : 'Could not start anonymous session.';
      setQuickStartError(message);
    } finally {
      setQuickStartLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full relative overflow-y-auto">
      {/* Hardwood background */}
      <div
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hardwood.png')" }}
      />
      <div className="fixed inset-0 z-[-1] bg-[#2c2418]/60" />

      {/* Auth Modal */}
      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        initialMode={authModalMode}
      />

      <div className="relative w-full max-w-md mx-auto px-5 py-12 md:py-20 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="mb-5">
            <Image
              src="/volleyball-logo.png"
              alt="LineupMan"
              width={64}
              height={64}
              className="mx-auto drop-shadow-md"
              priority
            />
          </div>
          <h1 className="text-3xl md:text-4xl text-[#f5f0e8] mb-2 drop-shadow-sm">
            LineupMan
          </h1>
          <p className="text-sm md:text-base text-[#d4cdc0]">
            Create, manage, and share your volleyball lineups
          </p>
        </div>

        {/* Cards - Solid linen surfaces */}
        <div className="w-full space-y-4">
          {/* Join Team Card */}
          <div className="bg-[#f5f0e8] border border-[#c4b8a5] rounded-md p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-[#a35d3a]/10 rounded flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#a35d3a]">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-[#1a1612]">Join Team</h2>
                <p className="text-sm text-[#6b5f52]">Enter your team code</p>
              </div>
            </div>
            <JoinTeamForm
              onInitiateSubmit={handleInitiateJoin}
              userId={user?.id}
            />
          </div>

          {/* Create Team Card */}
          <div className="bg-[#f5f0e8] border border-[#c4b8a5] rounded-md p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-[#a35d3a]/10 rounded flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#a35d3a]">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-[#1a1612]">Create Team</h2>
                <p className="text-sm text-[#6b5f52]">Start a new team</p>
              </div>
            </div>
            <CreateTeamForm
              onInitiateSubmit={handleInitiateCreate}
              userId={user?.id}
            />
          </div>

          {/* Quick Start */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleQuickStart}
              disabled={quickStartLoading}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#d4cdc0] hover:bg-[#c4b8a5] text-[#1a1612] font-medium rounded-md text-center transition-colors disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
              {quickStartLoading ? 'Starting...' : 'Try without signing in'}
            </button>
            {quickStartError && (
              <p className="mt-2 text-center text-sm text-[#9b3c3c]">{quickStartError}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-10 text-xs text-[#a39485]">
          Mobile-first lineup management for volleyball teams
        </p>
      </div>
    </main>
  );
}
