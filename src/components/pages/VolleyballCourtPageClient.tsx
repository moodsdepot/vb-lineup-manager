'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import VolleyballCourt from "@/components/court/VolleyballCourt";
import type { PlayerToken } from '@/types/volleyball';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import AuthModal from '@/components/auth/AuthModal';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

interface VolleyballCourtPageClientProps {
  teamId: string | null;
}

interface FetchedData {
  teamName: string | null;
  teamCode: string | null;
  lineupId: string | null;
  players: PlayerToken[];
}

const DEFAULT_PLAYERS: PlayerToken[] = [
  { id: 'p1', number: "10", position: "OH", x: 33, y: 45 },
  { id: 'p2', number: "7", position: "S",  x: 50, y: 45 },
  { id: 'p3', number: "14", position: "OPP", x: 67, y: 45 },
  { id: 'p4', number: "2", position: "OH", x: 67, y: 75 },
  { id: 'p5', number: "18", position: "MB", x: 50, y: 75 },
  { id: 'p6', number: "5", position: "MB", x: 33, y: 75 },
];

export default function VolleyballCourtPageClient({ teamId }: VolleyballCourtPageClientProps) {
  const isQuickstart = !teamId || teamId === 'demo';

  const [activeTeamId, setActiveTeamId] = useState<string | null>(isQuickstart ? null : teamId);
  const [loading, setLoading] = useState(true);
  const [resolvingQuickstart, setResolvingQuickstart] = useState(isQuickstart);
  const [error, setError] = useState<string | null>(null);
  const [fetchedData, setFetchedData] = useState<FetchedData | null>(
    isQuickstart ? { teamName: 'Demo Team', teamCode: 'DEMO', lineupId: null, players: DEFAULT_PLAYERS } : null
  );
  const [user, setUser] = useState<User | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
  const quickstartTeamRef = useRef<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isDemoMode =
    !activeTeamId || activeTeamId === 'demo' || !activeTeamId.includes('-');

  const resolveQuickstartTeam = async (
    client: SupabaseClient<Database>,
    userId: string
  ) => {
    if (quickstartTeamRef.current) return quickstartTeamRef.current;

    // Query 1: Get team membership (without nested lineups join to avoid 500 error)
    const { data: membershipRows, error: membershipError } = await client
      .from('team_members')
      .select(`
        team_id,
        teams (
          id,
          name,
          code
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: true })
      .limit(1);

    if (membershipError) {
      console.error('Membership query error:', JSON.stringify(membershipError, null, 2));
      throw membershipError;
    }

    const membership = membershipRows?.[0] as {
      team_id: string;
      teams?: {
        id?: string;
        name?: string | null;
        code?: string | null;
      } | null;
    } | undefined;

    if (membership?.team_id) {
      // Query 2: Fetch lineup separately to avoid nested join issues
      let initialLineup: { id: string; name: string; players: unknown } | null = null;

      const { data: lineupData, error: lineupError } = await client
        .from('lineups')
        .select('id, name, players')
        .eq('team_id', membership.team_id)
        .limit(1)
        .maybeSingle();

      if (lineupError) {
        console.error('Lineup query error:', JSON.stringify(lineupError, null, 2));
        // Don't throw - lineup is optional, continue with defaults
      } else {
        initialLineup = lineupData;
      }

      const validatedPlayers =
        Array.isArray(initialLineup?.players) && (initialLineup.players as unknown as PlayerToken[]).length > 0
          ? (initialLineup.players as unknown as PlayerToken[])
          : DEFAULT_PLAYERS;

      setFetchedData({
        teamName: membership.teams?.name ?? 'Team',
        teamCode: membership.teams?.code ?? null,
        lineupId: initialLineup?.id ?? null,
        players: validatedPlayers,
      });

      quickstartTeamRef.current = membership.team_id;
      return membership.team_id;
    }

    const formData = new FormData();
    formData.append('teamName', 'Quickstart Team');

    const { data: { session } } = await client.auth.getSession();

    const response = await fetch('/api/teams/create', {
      method: 'POST',
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result?.teamId) {
      throw new Error(result?.message || 'Could not create quickstart team.');
    }

    quickstartTeamRef.current = result.teamId as string;
    setFetchedData({
      teamName: 'Quickstart Team',
      teamCode: null,
      lineupId: null,
      players: DEFAULT_PLAYERS,
    });

    return result.teamId as string;
  };

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    setSupabase(client);
    if (!client) return;

    let isMounted = true;

    const initialize = async () => {
      try {
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        if (!isMounted) return;
        if (sessionError) throw sessionError;

        setUser(session?.user ?? null);

        if (isQuickstart) {
          if (!session?.user) {
            setResolvingQuickstart(false);
            setLoading(false);
            return;
          }

          setError(null);
          setResolvingQuickstart(true);

          const resolvedTeamId = await resolveQuickstartTeam(client, session.user.id);
          if (!isMounted) return;
          setActiveTeamId(resolvedTeamId);
          setResolvingQuickstart(false);
        } else {
          setResolvingQuickstart(false);
        }
      } catch (err) {
        console.error('[Client Page] Error initializing session:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to start session.');
          setResolvingQuickstart(false);
          setLoading(false);
        }
      } finally {
        if (isMounted && !isQuickstart) {
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: authListener } = client.auth.onAuthStateChange((_, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [isQuickstart]);

  useEffect(() => {
    if (!supabase) return;

    if (!activeTeamId || activeTeamId === 'demo') {
      if (!isQuickstart) {
        setLoading(false);
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          throw sessionError || new Error('You must be logged in to view this team.');
        }

        // Query 1: Get team data
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('name, code')
          .eq('id', activeTeamId)
          .maybeSingle();

        if (teamError) {
          console.error('Team query error:', JSON.stringify(teamError, null, 2));
          throw teamError;
        }
        if (!teamData) throw new Error("Team not found or you don't have access.");

        // Query 2: Get lineup separately
        const { data: lineupData, error: lineupError } = await supabase
          .from('lineups')
          .select('id, name, players')
          .eq('team_id', activeTeamId)
          .limit(1)
          .maybeSingle();

        if (lineupError) {
          console.error('Lineup query error:', JSON.stringify(lineupError, null, 2));
          // Don't throw - lineup is optional
        }

        const initialLineup = lineupData ?? null;
        const validatedPlayers =
          Array.isArray(initialLineup?.players) && (initialLineup.players as unknown as PlayerToken[]).length > 0
            ? (initialLineup.players as unknown as PlayerToken[])
            : DEFAULT_PLAYERS;

        if (isMounted) {
          setFetchedData({
            teamName: teamData.name,
            teamCode: teamData.code ?? null,
            lineupId: initialLineup?.id ?? null,
            players: validatedPlayers,
          });
        }
      } catch (err) {
        console.error(`[Client Page /court/${activeTeamId}] Error fetching data:`, err);
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load team data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [activeTeamId, isQuickstart, supabase]);

  if (loading || resolvingQuickstart) {
    return (
      <div className="min-h-screen bg-[#2c2418] flex items-center justify-center">
        <div className="text-[#a39485]">
          {resolvingQuickstart ? 'Setting up your quickstart team...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#2c2418] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[#9b3c3c] mb-4">{error}</p>
          <Link href="/" className="text-[#a35d3a] hover:underline">Go back home</Link>
        </div>
      </div>
    );
  }

  if (!fetchedData && !isDemoMode) {
    return (
      <div className="min-h-screen bg-[#2c2418] flex items-center justify-center">
        <p className="text-[#a39485]">Could not load team data.</p>
      </div>
    );
  }

  const currentData = fetchedData ?? { teamName: 'Demo Team', teamCode: 'DEMO', lineupId: null, players: DEFAULT_PLAYERS };
  const displayTeamName = isDemoMode ? 'Quickstart' : (currentData.teamName ?? 'Unnamed Team');

  return (
      <main className="min-h-screen bg-[#2c2418]">
        <AuthModal
          open={isAuthModalOpen}
          onOpenChange={setIsAuthModalOpen}
          initialMode="link"
        />

        {/* Header - warm linen style */}
        <header className="sticky top-0 z-20 bg-[#f5f0e8] border-b border-[#c4b8a5] shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-[#6b5f52] hover:text-[#1a1612] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="text-sm font-medium">Back</span>
            </Link>

            <div className="flex items-center gap-2 min-w-0">
              <Image
                src="/volleyball-logo.png"
                alt="LineupMan"
                width={26}
                height={26}
              />
              <h1 className="text-base font-semibold text-[#1a1612] truncate max-w-[140px] md:max-w-none">
                {displayTeamName}
              </h1>
            </div>

            {!isDemoMode && currentData.teamCode && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-[#6b5f52]">Code:</span>
                <code className="text-sm font-mono text-[#1a1612] bg-[#e8e2d8] px-2 py-1 rounded border border-[#c4b8a5]">
                  {currentData.teamCode}
                </code>
              </div>
            )}
            {isDemoMode && (
              <span className="text-xs text-[#6b5f52] bg-[#e8e2d8] px-2 py-1 rounded border border-[#c4b8a5]">Quickstart</span>
            )}
          </div>

          {user?.is_anonymous && (
            <div className="max-w-2xl mx-auto px-4 pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-[#e8e2d8] border border-[#c4b8a5] rounded px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-[#6b5f52]">
                  <span className="px-2 py-0.5 rounded bg-white border border-[#d4cdc0] text-[#1a1612] font-semibold">Anonymous</span>
                  <span>Your changes are tied to this temporary session.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-xs font-semibold text-[#a35d3a] hover:text-[#8a4e31] underline-offset-4 hover:underline"
                >
                  Create Account to save permanently
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-4 md:py-6">
          {/* Team code on mobile */}
          {!isDemoMode && currentData.teamCode && (
            <div className="md:hidden mb-4 flex items-center justify-center gap-2 text-sm">
              <span className="text-[#a39485]">Team Code:</span>
              <code className="font-mono text-[#f5f0e8] bg-[#3d3022] px-2 py-1 rounded border border-[#5a4d3a]">
                {currentData.teamCode}
              </code>
            </div>
          )}

          {/* Court Container */}
          <div className="bg-[#f5f0e8] rounded-md border border-[#c4b8a5] shadow-sm overflow-hidden">
            {supabase && (
              <VolleyballCourt
                teamId={isDemoMode ? 'demo' : activeTeamId!}
                initialPlayers={currentData.players}
                lineupId={isDemoMode ? null : currentData.lineupId}
              />
            )}
            {!supabase && !loading && !isDemoMode && (
              <p className="p-4 text-[#6b5f52] text-center">Error initializing court.</p>
            )}
            {!supabase && isDemoMode && (
              <VolleyballCourt
                teamId={'demo'}
                initialPlayers={currentData.players}
                lineupId={null}
              />
            )}
          </div>

          {/* Help text */}
          <p className="mt-4 text-center text-xs text-[#a39485]">
            {isDemoMode
              ? 'Quickstart mode - we created a temporary team for you.'
              : user?.is_anonymous
                ? 'Changes are saved to this session. Link an account to keep them forever.'
                : 'Changes are saved automatically.'}
          </p>
        </div>
      </main>
  );
}
