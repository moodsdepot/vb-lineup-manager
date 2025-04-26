'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateTeamFormProps {
  onInitiateSubmit: () => boolean;
}

export default function CreateTeamForm({ onInitiateSubmit }: CreateTeamFormProps) {
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const canProceed = onInitiateSubmit();

    if (canProceed) {
      console.log("User logged in, proceeding with Create Team logic for name:", teamName);
      await new Promise(resolve => setTimeout(resolve, 500));
      setError('Create feature coming soon!');
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <Label htmlFor="create-team-name" className="sr-only">Team Name</Label>
        <Input
          id="create-team-name"
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter team name"
          className="w-full px-4 py-3 bg-blue-800/30 text-white border border-white/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent placeholder-white/40"
          maxLength={50}
          required
          disabled={isLoading}
        />
        {error && <p className="text-violet-300 text-sm mt-1">{error}</p>}
      </div>
      <Button
        type="submit"
        className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-violet-400 hover:from-violet-700 hover:to-violet-500 text-white font-satoshi font-bold rounded-md disabled:opacity-50 transition-all duration-300"
        disabled={isLoading}
      >
        {isLoading ? 'Checking...' : 'Create Team'}
      </Button>
    </form>
  );
}
