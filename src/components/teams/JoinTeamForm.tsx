'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinTeamForm() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Implement API call
      console.log('Joining team with code:', code);
      // router.push(`/team/${teamId}`);
    } catch (err) {
      setError('Invalid team code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter team code"
          className="w-full px-3 py-2 border rounded-md text-sm"
          maxLength={6}
          disabled={isLoading}
        />
        {error && (
          <p className="text-destructive text-sm mt-1">{error}</p>
        )}
      </div>
      <button
        type="submit"
        className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        disabled={isLoading || code.length < 4}
      >
        {isLoading ? 'Joining...' : 'Join Team'}
      </button>
    </form>
  );
}
