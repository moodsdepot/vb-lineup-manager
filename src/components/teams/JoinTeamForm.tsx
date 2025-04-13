'use client';

import { useState } from 'react';

export default function JoinTeamForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('This feature is coming soon!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter team code"
          className="w-full px-4 py-3 bg-blue-800/30 text-white border border-white/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-white/40"
          maxLength={6}
        />
        {error && (
          <p className="text-blue-300 text-sm mt-1">{error}</p>
        )}
      </div>
      <button
        type="submit"
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-satoshi font-bold rounded-md disabled:opacity-50 transition-all duration-300"
      >
        Join Team
      </button>
    </form>
  );
}
