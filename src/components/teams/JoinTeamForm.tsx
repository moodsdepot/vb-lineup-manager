'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JoinTeamFormProps {
  onInitiateSubmit: () => boolean; 
}

export default function JoinTeamForm({ onInitiateSubmit }: JoinTeamFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 
    setIsLoading(true);

    const canProceed = onInitiateSubmit(); 

    if (canProceed) {
      console.log("User logged in, proceeding with Join Team logic for code:", code);
      await new Promise(resolve => setTimeout(resolve, 500)); 
      setError('Join feature coming soon!');
      setIsLoading(false); 
    } else {
      setIsLoading(false); 
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <Label htmlFor="join-team-code" className="sr-only">Team Code</Label>
        <Input
          id="join-team-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter team code"
          className="w-full px-4 py-3 bg-blue-800/30 text-white border border-white/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/40"
          maxLength={6}
          required
          disabled={isLoading}
        />
        {error && <p className="text-blue-300 text-sm mt-1">{error}</p>}
      </div>
      <Button
        type="submit"
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-satoshi font-bold rounded-md disabled:opacity-50 transition-all duration-300"
        disabled={isLoading}
      >
        {isLoading ? 'Checking...' : 'Join Team'}
      </Button>
    </form>
  );
}
