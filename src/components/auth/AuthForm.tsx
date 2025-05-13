'use client';
import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase'; // Use the getter function
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";   
import { Label } from "@/components/ui/label";     
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; 
import { useRouter } from 'next/navigation'; // Import router

interface AuthFormProps {
  initialMode?: 'login' | 'signup';
  onSuccess?: () => void; 
}

export default function AuthForm({ initialMode = 'login', onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Initialize router

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');
    const supabase = getSupabaseBrowserClient(); // Get client instance when needed

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        
        if (data.user && data.user.aud !== 'authenticated') {
          setMessage(
            'Account created! Please check your email inbox (and spam folder) for a confirmation link to activate your account before logging in.'
          );
        } else {
          setMessage('Signup successful! You are logged in.');
          onSuccess?.(); 
          router.refresh(); 
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) throw authError;

        if (data.user) {
           if (data.user.aud !== 'authenticated') {
               setMessage('Signup successful! Check email for confirmation.');
           } else {
               setMessage('Login successful!');
               onSuccess?.(); 
               router.refresh();
           }
        } else if (!data.user && !data.session) {
            setError('Login failed. Please check your credentials.');
        } else if (data.session) {
            setMessage('Login successful!');
            onSuccess?.();
            router.refresh();
        }
      }

    } catch (err: unknown) {
      console.error("Auth Error:", err);
      // Type checking for error message
      let errorMessage = 'Authentication failed. Please try again.';
      if (err instanceof Error) { 
          // Use specific checks based on Supabase error structure if possible
          // For now, use the generic message
          errorMessage = err.message; 
          // Add specific checks based on err.message content
           if (errorMessage?.includes('Email rate limit exceeded')) {
               setError('Too many attempts. Please wait a moment and try again.');
               errorMessage = ''; // Clear generic message if specific one is set
           } else if (errorMessage?.includes('Invalid login credentials')) {
                setError('Invalid email or password.');
                errorMessage = ''; 
           } else if (errorMessage?.includes('User already registered')) {
                setError('An account with this email already exists. Try logging in.');
                setIsSignUp(false); 
                errorMessage = ''; 
           } else {
               // Use the caught error message if not handled specifically
               setError(errorMessage);
           }
      } else {
         // Handle non-Error types if necessary
         setError('An unexpected error occurred.');
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-none shadow-none bg-transparent p-6 md:p-8"> 
      <CardHeader className="text-center pt-0 px-0 pb-4"> 
        <CardTitle>{isSignUp ? 'Create Account' : 'Login or Sign Up'}</CardTitle> 
        <CardDescription>
          {isSignUp 
             ? 'Enter your details to sign up.' 
             : 'Enter your credentials or sign up below.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0 pb-0"> 
        <form onSubmit={handleAuth} id={`auth-form-${initialMode}`} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor={`email-${initialMode}`}>Email</Label>
            <Input
              id={`email-${initialMode}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`password-${initialMode}`}>Password</Label>
            <Input
              id={`password-${initialMode}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6} 
              disabled={isLoading}
            />
          </div>
        </form>
         {message && <p className="text-sm text-center text-green-400 pt-2">{message}</p>}
         {error && <p className="text-sm text-center text-red-400 pt-2">{error}</p>}
      </CardContent>
      <CardFooter className="flex flex-col gap-4 px-0 pb-0 pt-4"> 
         <Button 
            type="submit" 
            form={`auth-form-${initialMode}`} 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
          </Button>
          
          <Button variant="link" size="sm" onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }} disabled={isLoading}>
             {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
           </Button>
      </CardFooter>
    </Card>
  );
}
