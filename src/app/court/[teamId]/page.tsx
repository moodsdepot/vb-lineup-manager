// Minimal Server Component - just passes teamId down

// We no longer need server-side Supabase helpers here
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
import { notFound } from 'next/navigation'; // Keep notFound
import VolleyballCourtPageClient from "@/components/pages/VolleyballCourtPageClient"; 

// Type the props directly in the function signature
export default function VolleyballCourtTeamPage({ params }: { params: { teamId: string } }) {
  const { teamId } = params; 

  // Basic validation of teamId format (optional but good)
  // This is a simple UUID check regex
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(teamId)) {
      console.warn(`[Server Page /court/${teamId}] Invalid teamId format.`);
      notFound(); // Trigger 404 if the ID format is wrong
  }

  console.log(`[Server Page /court/${teamId}] Rendering client component.`);

  // Render the Client Component, passing only the teamId
  // The client component will handle auth check and data fetching
  return <VolleyballCourtPageClient teamId={teamId} />;
} 