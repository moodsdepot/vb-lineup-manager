'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { ShareLinkValidation } from '@/types/lineup-state';

type ShareState =
  | { status: 'loading' }
  | { status: 'invalid'; error: string }
  | { status: 'valid'; validation: ShareLinkValidation; isAuthenticated: boolean };

export default function ShareLinkPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [state, setState] = useState<ShareState>({ status: 'loading' });
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function validateAndCheckAuth() {
      try {
        // Validate the share link
        const validateResponse = await fetch('/api/share-links/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const validation: ShareLinkValidation = await validateResponse.json();

        if (!validation.valid) {
          setState({ status: 'invalid', error: validation.error || 'Invalid share link' });
          return;
        }

        // Check if user is authenticated
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        setState({
          status: 'valid',
          validation,
          isAuthenticated: !!user,
        });
      } catch (error) {
        console.error('Error validating share link:', error);
        setState({ status: 'invalid', error: 'Failed to validate share link' });
      }
    }

    validateAndCheckAuth();
  }, [token]);

  const handleAccept = async () => {
    if (state.status !== 'valid') return;

    setAccepting(true);
    try {
      const response = await fetch('/api/share-links/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Redirect to the resource
        if (state.validation.resource_type === 'team') {
          router.push(`/court/${state.validation.resource_id}`);
        } else if (state.validation.resource_type === 'lineup') {
          router.push(`/lineup/${state.validation.resource_id}`);
        }
      } else {
        alert(result.error || 'Failed to accept share link');
      }
    } catch (error) {
      console.error('Error accepting share link:', error);
      alert('Failed to accept share link');
    } finally {
      setAccepting(false);
    }
  };

  const handleLogin = () => {
    // Store the share token for after login
    sessionStorage.setItem('pendingShareToken', token);
    router.push('/login');
  };

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating share link...</p>
        </div>
      </div>
    );
  }

  if (state.status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 p-6 bg-white rounded-lg shadow-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Share Link</h1>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Valid share link
  const { validation, isAuthenticated } = state;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🏐</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            You&apos;ve been invited!
          </h1>
          <p className="text-gray-600">
            Someone has shared a{' '}
            {validation.resource_type === 'team' ? 'team' : 'lineup'} with you as a{' '}
            <span className="font-medium">{validation.role}</span>.
          </p>
        </div>

        {isAuthenticated ? (
          <div className="space-y-4">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? 'Joining...' : 'Accept Invitation'}
            </button>
            <p className="text-sm text-gray-500 text-center">
              You&apos;ll be added to the team with {validation.role} access.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleLogin}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In to Accept
            </button>
            <p className="text-sm text-gray-500 text-center">
              You need to sign in to accept this invitation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
