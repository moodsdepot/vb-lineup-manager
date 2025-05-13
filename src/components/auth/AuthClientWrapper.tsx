'use client'; // This component needs client-side hooks for auth state

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase'; // Import the function
import type { User, SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type
import UserStatus from './UserStatus'; // Import the component we created
import { Button } from '@/components/ui/button'; // Import the Button component
import AuthModal from './AuthModal'; // Import the AuthModal component

export default function AuthClientWrapper() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null); // State to show init errors
  const [clientInstance, setClientInstance] = useState<SupabaseClient | null>(null); // Store client instance
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    console.log("--- AuthClientWrapper: useEffect Running ---");
    let supabase: SupabaseClient;
    try {
        // Call the function to get/create the client instance
        supabase = getSupabaseBrowserClient(); 
        setClientInstance(supabase); // Store the instance in state
        console.log("Supabase client obtained via getSupabaseBrowserClient.");
        setInitError(null); 
    } catch (error) {
        console.error("Failed to get Supabase client:", error);
        setInitError(error instanceof Error ? error.message : "Failed to initialize auth.");
        setLoading(false);
        return; 
    }

    // --- Now proceed with auth logic using the obtained 'supabase' instance ---
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
         if (sessionError) throw sessionError; // Handle potential errors fetching session
         
        if (isMounted) {
            setUser(session?.user ?? null);
            setLoading(false);
            console.log("User session fetched:", session ? session.user?.id : 'No session');
        }
      } catch (err) {
         console.error("Error fetching Supabase session:", err);
          if (isMounted) setLoading(false); // Stop loading even if session fetch fails
      }
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
         if (isMounted) {
           setUser(session?.user ?? null);
           setLoading(false); // Update loading state on auth changes too
         }
      }
    );
    
    return () => { 
        console.log("AuthClientWrapper: Cleaning up listener.");
        isMounted = false;
        authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const openModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // --- Render Logic ---
  const containerStyle = "absolute top-4 right-4 z-50"; // Position top right

   // Display Environment Error if present
   if (initError) {
       return <div className={`${containerStyle} p-2 bg-red-800 text-white text-xs rounded`}>Error: {initError}</div>;
   }

  // Loading state
  if (loading) {
    return <div className={`${containerStyle} h-8`}></div>; 
  }

  // Render UserStatus or Login/SignUp buttons
  return (
    <>
      <div className={containerStyle}>
        {user && clientInstance ? (
          <UserStatus supabaseClient={clientInstance} /> // Show email/logout if logged in
        ) : (
          <div className="flex items-center gap-2">
            {/* Use shadcn Button styles */}
            <Button variant="outline" size="sm" onClick={() => openModal('login')} className="bg-background/30 backdrop-blur-sm border-white/20 hover:bg-white/10 text-white hover:text-white">Login</Button>
            <Button variant="default" size="sm" onClick={() => openModal('signup')} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">Sign Up</Button>
          </div>
        )}
      </div>

      <AuthModal 
        open={isAuthModalOpen} 
        onOpenChange={setIsAuthModalOpen} 
        initialMode={authModalMode} 
      />
    </>
  );
}
