'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console in development
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md mx-auto">
        <div className="bg-blue-950/70 backdrop-blur-lg border border-white/10 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Something went wrong!</h2>
          <p className="text-white/70 mb-6">
            Don&apos;t worry, it&apos;s not your fault. Please try again.
          </p>
          <button
            onClick={reset}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-satoshi font-bold rounded-md transition-all duration-300"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
} 