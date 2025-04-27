// Static route for Quick Start / Demo Mode

import VolleyballCourtPageClient from "@/components/pages/VolleyballCourtPageClient";

export default function QuickStartCourtPage() {

  // Render the client component, passing a special 'demo' teamId
  // This tells the client component not to fetch real data
  return <VolleyballCourtPageClient teamId="demo" />; 
}
