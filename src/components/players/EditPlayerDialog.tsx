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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-lg font-bold mb-4">Edit Player</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name/Number</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded border bg-background"
              placeholder="Enter name or number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as PlayerToken['position'])}
              className="w-full p-2 rounded border bg-background"
            >
              <option value="OH">Outside Hitter (OH)</option>
              <option value="MB">Middle Blocker (MB)</option>
              <option value="S">Setter (S)</option>
              <option value="OPP">Opposite (OPP)</option>
              <option value="L">Libero (L)</option>
              <option value="DS">Defensive Specialist (DS)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-secondary hover:bg-secondary/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 