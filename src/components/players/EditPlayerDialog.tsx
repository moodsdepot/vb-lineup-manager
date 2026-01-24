'use client';

import { useState, useEffect } from 'react';
import type { PlayerToken } from '@/types/volleyball';

interface EditPlayerDialogProps {
  player: PlayerToken;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPlayer: PlayerToken) => void;
}

export default function EditPlayerDialog({ player, isOpen, onClose, onSave }: EditPlayerDialogProps) {
  const [name, setName] = useState(player.name || player.number);
  const [number, setNumber] = useState(player.number);
  const [position, setPosition] = useState(player.position);

  useEffect(() => {
    if (isOpen) {
      setName(player.name || player.number);
      setNumber(player.number);
      setPosition(player.position);
    }
  }, [isOpen, player]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...player,
      name,
      number,
      position,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1a1612]/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-[#faf7f2] p-5 rounded-md shadow-lg w-full max-w-sm border border-[#c4b8a5] modal-enter">
        <h2 className="text-lg font-semibold text-[#1a1612] mb-4">Edit Player</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1612] mb-1.5">Name/Number</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded border border-[#c4b8a5] bg-white text-[#1a1612] placeholder-[#a39485] focus:outline-none focus:ring-2 focus:ring-[#a35d3a]/30 focus:border-[#a35d3a]"
              placeholder="Enter name or number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1612] mb-1.5">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as PlayerToken['position'])}
              className="w-full px-3.5 py-2.5 rounded border border-[#c4b8a5] bg-white text-[#1a1612] focus:outline-none focus:ring-2 focus:ring-[#a35d3a]/30 focus:border-[#a35d3a]"
            >
              <option value="OH">Outside Hitter (OH)</option>
              <option value="MB">Middle Blocker (MB)</option>
              <option value="S">Setter (S)</option>
              <option value="OPP">Opposite (OPP)</option>
              <option value="L">Libero (L)</option>
              <option value="DS">Defensive Specialist (DS)</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded bg-[#d4cdc0] hover:bg-[#c4b8a5] text-[#1a1612] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded bg-[#a35d3a] hover:bg-[#8a4e31] text-[#faf7f2] font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 