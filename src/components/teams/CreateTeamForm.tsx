'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateTeamForm() {
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Implement API call
      console.log('Creating team:', teamName);
      // router.push(`/team/${teamId}`);
    } catch (err) {
      setError('Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter team name"
          className="w-full px-3 py-2 border rounded-md text-sm"
          maxLength={30}
          disabled={isLoading}
        />
        {error && (
          <p className="text-destructive text-sm mt-1">{error}</p>
        )}
      </div>
      <button
        type="submit"
        className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        disabled={isLoading || teamName.length < 2}
      >
        {isLoading ? 'Creating...' : 'Create Team'}
      </button>
    </form>
  );
}
