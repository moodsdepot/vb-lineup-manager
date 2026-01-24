'use client';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  initialMode?: 'login' | 'signup' | 'link';
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'signup' | 'link';

export default function AuthForm({ initialMode = 'login', onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMode(initialMode);
    setMessage('');
    setError('');
  }, [initialMode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');
    const supabase = getSupabaseBrowserClient();

    try {
      if (mode === 'signup') {
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
      } else if (mode === 'login') {
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
      } else {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error('No active session to link.');
        if (!session.user?.is_anonymous) {
          setMessage('You are already using a permanent account.');
          setMode('login');
          return;
        }

        const { data, error: updateError } = await supabase.auth.updateUser({ email, password });
        if (updateError) throw updateError;

        if (data.user) {
          setMessage('Account linked! Your data is now tied to this login.');
          onSuccess?.();
          router.refresh();
        } else {
          setMessage('Account linked!');
        }
      }

    } catch (err: unknown) {
      console.error("Auth Error:", err);
      let errorMessage = 'Authentication failed. Please try again.';
      if (err instanceof Error) {
          errorMessage = err.message;
          if (errorMessage?.includes('Email rate limit exceeded')) {
            setError('Too many attempts. Please wait a moment and try again.');
            errorMessage = '';
          } else if (errorMessage?.includes('Invalid login credentials')) {
            setError('Invalid email or password.');
            errorMessage = '';
          } else if (errorMessage?.includes('User already registered')) {
            setError('An account with this email already exists. Try logging in.');
            setMode('login');
            errorMessage = '';
          } else {
            setError(errorMessage);
          }
      } else {
         setError('An unexpected error occurred.');
      }

    } finally {
      setIsLoading(false);
    }
  };

  const isSignup = mode === 'signup';
  const isLinkMode = mode === 'link';
  const formId = `auth-form-${mode}`;
  const title = isLinkMode ? 'Link Account' : isSignup ? 'Create Account' : 'Welcome Back';
  const subtitle = isLinkMode
    ? 'Add email + password to keep your teams across devices.'
    : isSignup
      ? 'Enter your details to sign up.'
      : 'Enter your credentials to continue.';

  return (
    <div className="w-full p-6 md:p-8">
      <div className="text-center mb-6">
        <h2 className="text-xl text-[#1a1612] mb-1">{title}</h2>
        <p className="text-sm text-[#6b5f52]">{subtitle}</p>
      </div>

      <form onSubmit={handleAuth} id={formId} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`email-${mode}`} className="text-[#1a1612] text-sm font-medium">Email</Label>
          <input
            id={`email-${mode}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={isLoading}
            className="w-full px-3.5 py-2.5 bg-white text-[#1a1612] border border-[#c4b8a5] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#a35d3a]/30 focus:border-[#a35d3a] placeholder-[#a39485]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`password-${mode}`} className="text-[#1a1612] text-sm font-medium">Password</Label>
          <input
            id={`password-${mode}`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            disabled={isLoading}
            className="w-full px-3.5 py-2.5 bg-white text-[#1a1612] border border-[#c4b8a5] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#a35d3a]/30 focus:border-[#a35d3a] placeholder-[#a39485]"
          />
        </div>

        {message && <p className="text-sm text-center text-[#4a7c59] pt-1">{message}</p>}
        {error && <p className="text-sm text-center text-[#9b3c3c] pt-1">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-[#a35d3a] hover:bg-[#8a4e31] text-[#faf7f2] font-medium rounded text-sm disabled:opacity-50 transition-colors mt-2"
        >
          {isLoading ? 'Processing...' : (isLinkMode ? 'Link Account' : isSignup ? 'Sign Up' : 'Login')}
        </button>
      </form>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => {
            if (isLinkMode) {
              setMode('login');
            } else {
              setMode(isSignup ? 'login' : 'signup');
            }
            setError('');
            setMessage('');
          }}
          disabled={isLoading}
          className="text-sm text-[#6b5f52] hover:text-[#1a1612] transition-colors inline-btn"
        >
          {isLinkMode
            ? 'Already have an account? Login'
            : isSignup
              ? 'Already have an account? Login'
              : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
