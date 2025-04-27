'use client'; // This component handles state and renders interactive components

import { useState, useEffect } from 'react'; // Import hooks
import Link from 'next/link';
import Image from 'next/image'; // Assuming you want the logo here too
import VolleyballCourt from "@/components/court/VolleyballCourt";
import { DndProvider } from 'react-dnd'; // Import DndProvider here
import { HTML5Backend } from 'react-dnd-html5-backend'; // Import Backend here
import type { PlayerToken } from '@/types/volleyball'; // Import player type
import { getSupabaseBrowserClient } from '@/lib/supabase'; // Import client getter
import { useRouter } from 'next/navigation'; // Import router for redirects

// Define the props this component now receives
interface VolleyballCourtPageClientProps {
  teamId: string | null; // Only receives teamId now
}

// Define shape for fetched data state
interface FetchedData {
  teamName: string | null;
  lineupId: string | null;
  players: PlayerToken[];
}

// Define default player positions AND numbers
const DEFAULT_PLAYERS: PlayerToken[] = [
  // Assign some common/example numbers
  { id: 'p1', number: "10", position: "OH", x: 33, y: 45 }, 
  { id: 'p2', number: "7", position: "S",  x: 50, y: 45 },  
  { id: 'p3', number: "14", position: "OPP", x: 67, y: 45 }, 
  { id: 'p4', number: "2", position: "OH", x: 67, y: 75 },  
  { id: 'p5', number: "18", position: "MB", x: 50, y: 75 },  
  { id: 'p6', number: "5", position: "MB", x: 33, y: 75 },  
];


export default function VolleyballCourtPageClient({ teamId }: VolleyballCourtPageClientProps) {
  const isDemoMode = teamId === 'demo' || !teamId; 

  const [loading, setLoading] = useState(!isDemoMode); 
  const [error, setError] = useState<string | null>(null);
  const [fetchedData, setFetchedData] = useState<FetchedData | null>(
     isDemoMode ? { teamName: 'Demo Team', lineupId: null, players: DEFAULT_PLAYERS } : null
  );
  const router = useRouter();
  const supabase = getSupabaseBrowserClient(); // Get client instance

  useEffect(() => {
    if (!isDemoMode && teamId && !fetchedData) { 
        let isMounted = true;
        console.log(`[Client Page /court/${teamId}] useEffect running for fetch.`);
        const fetchData = async () => { 
            setLoading(true); 
            setError(null);
             try {
                 const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                 if (!isDemoMode && (sessionError || !session?.user)) { 
                    if(isMounted) setError("You must be logged in to view this team.");
                    setLoading(false); return; 
                 }
                 
                 console.log(`[Client Page /court/${teamId}] Fetching team data...`);
                 // --- CORRECTED QUERY ---
                 const { data: teamData, error: teamError } = await supabase
                    .from('teams')
                    .select(`
                        name, 
                        lineups ( id, name, players ) 
                    `) 
                    .eq('id', teamId) // Filter by teamId
                    .limit(1, { foreignTable: 'lineups' }) // Get only one lineup
                    .maybeSingle(); // Expect 0 or 1 result
                 // --- END CORRECTED QUERY ---

                  if (teamError) throw teamError;
                  if (!teamData) throw new Error("Team not found or you don't have access.");
                 
                  console.log(`[Client Page /court/${teamId}] Fetched data for team: ${teamData.name}`);
                  const initialLineup = teamData.lineups?.length > 0 ? teamData.lineups[0] : null;
                  const validatedPlayers = initialLineup?.players as PlayerToken[] | null ?? null;
                  
                  if(isMounted) {
                      setFetchedData({
                          teamName: teamData.name,
                          lineupId: initialLineup?.id ?? null,
                          players: validatedPlayers && validatedPlayers.length === 6 ? validatedPlayers : DEFAULT_PLAYERS
                      });
                  }
             } catch (err) {
                  console.error(`[Client Page /court/${teamId}] Error fetching data:`, err);
                  if (isMounted) setError(err instanceof Error ? err.message : "Failed to load team data.");
             } finally {
                 if (isMounted) setLoading(false);
             }
        };
        fetchData();
        return () => { isMounted = false };
    } else if (isDemoMode) {
         setLoading(false);
    }
  }, [teamId, supabase, router, fetchedData, isDemoMode]); 

  // --- Render Logic ---

  if (loading) {
    // TODO: Replace with a better loading skeleton/spinner
    return <div className="min-h-screen flex items-center justify-center">Loading Team Data...</div>;
  }

  if (error && !isDemoMode) {
    // Display error message
    return <div className="min-h-screen flex items-center justify-center p-4 text-center text-red-500">Error: {error}</div>;
  }
  
  if (!fetchedData && !isDemoMode) {
      // Should be covered by loading/error, but added as fallback
       return <div className="min-h-screen flex items-center justify-center">Could not load team data.</div>;
  }

  const currentData = fetchedData ?? { teamName: 'Demo Team', lineupId: null, players: DEFAULT_PLAYERS };
  const displayTeamName = isDemoMode ? 'Demo Mode' : (currentData.teamName ?? 'Unnamed Team');

  // playersToLoad logic remains the same, will now use new defaults if needed
  const playersToLoad = currentData.players && currentData.players.length === 6 
    ? currentData.players 
    : DEFAULT_PLAYERS; 
    
  const lineupIdToLoad = currentData.lineupId; 

  // Data is loaded, render the court
  return (
    <DndProvider backend={HTML5Backend}> 
      <main className="min-h-screen bg-gradient-to-b from-background to-[var(--court-surface)] p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
             {/* Back to Home or Dashboard Link */}
             {/* TODO: Decide where this should link - maybe a future /dashboard page? */}
            <Link
              href="/" 
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" /* ... svg props ... */ >
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Home
            </Link>
             {/* Optionally add UserStatus here if needed on this page */}
          </div>

          <header className="text-center space-y-2">
            {/* Display team name passed from server */}
            <div className="flex items-center justify-center gap-3 mb-2"> 
              <Image
                src="/volleyball-logo.png"
                alt="LineupMan Volleyball Logo"
                width={40} 
                height={40}
                className="inline-block" 
              />
              <h1 className="text-3xl font-bold tracking-tight">
                {displayTeamName}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {isDemoMode ? 'Try out the court features (no saving)' : `Manage your lineup for ${currentData.teamName ?? 'this team'}`}
            </p>
          </header>
          
          <div className="bg-card rounded-lg shadow-xl p-6">
             {/* Render the VolleyballCourt, passing necessary props */}
            <VolleyballCourt 
               teamId={isDemoMode ? 'demo' : teamId!} 
               initialPlayers={playersToLoad} // Pass potentially updated defaults
               lineupId={lineupIdToLoad} 
            />
          </div>
        </div>
      </main>
    </DndProvider>
  );
}
