// Minimal Server Component - just passes teamId down

// We no longer need server-side Supabase helpers here
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
import { notFound } from 'next/navigation'; // Keep notFound
import VolleyballCourtPageClient from "@/components/pages/VolleyballCourtPageClient"; 

// Remove the unused PageParams interface
// interface PageParams {
//   teamId: string;
// }

// Keep the correct definition for internal use
interface CorrectPageProps {
  params: { 
    teamId: string; 
  };
  searchParams?: { [key: string]: string | string[] | undefined }; 
}

// Add ESLint disable comment BEFORE the line using 'any'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function VolleyballCourtTeamPage(props: any) { 
  
  // --- Runtime check and type assertion ---
  // Ensure params and teamId exist at runtime before using them
  const params = props?.params as CorrectPageProps['params'] | undefined;
  const teamId = params?.teamId;

  if (!teamId || typeof teamId !== 'string') {
       console.error("[Server Page /court/[dynamic]] Failed to extract valid string teamId from props:", props);
       notFound();
  }
  // --- End Runtime check ---

  // --- Validation ---
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(teamId)) {
      console.warn(`[Server Page /court/${teamId}] Invalid teamId format.`);
      notFound(); 
  }
  // --- End Validation ---

  console.log(`[Server Page /court/${teamId}] Rendering client component with teamId: ${teamId}`);

  // Render the Client Component, passing the validated teamId
  return <VolleyballCourtPageClient teamId={teamId} />;
} 