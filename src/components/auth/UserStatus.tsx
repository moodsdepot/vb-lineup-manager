'use client';
import { useState, useEffect } from 'react';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation'; // Use App Router router

// Define props if needed, e.g., for styling variations
interface UserStatusProps {
  className?: string; 
  supabaseClient: SupabaseClient; // Accept client as prop
}

export default function UserStatus({ className, supabaseClient }: UserStatusProps) {
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null); 
  const router = useRouter();

  // Get user email once when component mounts or client changes
  useEffect(() => {
      const getUserEmail = async () => {
         try { // Add try/catch for safety
             const { data: { user }, error } = await supabaseClient.auth.getUser();
             if (error) throw error;
             setUserEmail(user?.email ?? null);
         } catch(err) {
             console.error("Error fetching user in UserStatus:", err);
             setUserEmail(null); // Clear email on error
         }
      };
      if (supabaseClient) { // Ensure client is passed before calling
          getUserEmail();
      }
  }, [supabaseClient]);

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
        await supabaseClient.auth.signOut(); 
        router.push('/'); 
        router.refresh(); 
    } catch (err) {
        console.error("Logout error:", err);
        // Optionally show error to user
    } finally {
        setLoadingLogout(false);
    }
  };

  const containerStyle = `flex items-center gap-3 p-2 rounded ${className}`;
  const emailStyle = "text-sm text-gray-300 truncate"; 
  const buttonStyle = "text-sm bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded";

  if (!userEmail && !loadingLogout) return null; // Don't render if no email unless logging out

  return (
    <div className={containerStyle}>
      {userEmail && <span className={emailStyle} title={userEmail}>{userEmail}</span>}
      <button onClick={handleLogout} className={buttonStyle} disabled={loadingLogout}>
        {loadingLogout ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}
