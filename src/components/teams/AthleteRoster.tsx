'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { Athlete, VolleyballPosition } from '@/types/lineup-state';

interface AthleteRosterProps {
  teamId: string;
  canEdit?: boolean;
  onSelectAthlete?: (athlete: Athlete) => void;
  selectedAthleteId?: string | null;
}

export default function AthleteRoster({
  teamId,
  canEdit = true,
  onSelectAthlete,
  selectedAthleteId,
}: AthleteRosterProps) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    jersey_number: string;
    display_name: string;
    position: VolleyballPosition | '';
  }>({ jersey_number: '', display_name: '', position: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAthlete, setNewAthlete] = useState<{
    jersey_number: string;
    display_name: string;
    position: VolleyballPosition | '';
  }>({ jersey_number: '', display_name: '', position: '' });

  const fetchAthletes = useCallback(async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/athletes`);
      if (response.ok) {
        const data = await response.json();
        setAthletes(data.athletes || []);
      }
    } catch (error) {
      console.error('Error fetching athletes:', error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  const createAthlete = async () => {
    if (!newAthlete.jersey_number.trim()) {
      alert('Jersey number is required');
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/athletes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jersey_number: newAthlete.jersey_number,
          display_name: newAthlete.display_name || null,
          position: newAthlete.position || null,
        }),
      });

      if (response.ok) {
        setNewAthlete({ jersey_number: '', display_name: '', position: '' });
        setShowAddForm(false);
        fetchAthletes();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create athlete');
      }
    } catch (error) {
      console.error('Error creating athlete:', error);
      alert('Failed to create athlete');
    }
  };

  const startEdit = (athlete: Athlete) => {
    setEditingId(athlete.id);
    setEditForm({
      jersey_number: athlete.jersey_number,
      display_name: athlete.display_name || '',
      position: athlete.position || '',
    });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.jersey_number.trim()) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/athletes/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jersey_number: editForm.jersey_number,
          display_name: editForm.display_name || null,
          position: editForm.position || null,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        fetchAthletes();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update athlete');
      }
    } catch (error) {
      console.error('Error updating athlete:', error);
    }
  };

  const deleteAthlete = async (athleteId: string) => {
    if (!confirm('Remove this athlete from the roster?')) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/athletes/${athleteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAthletes();
      }
    } catch (error) {
      console.error('Error deleting athlete:', error);
    }
  };

  const positions: (VolleyballPosition | '')[] = ['', 'OH', 'MB', 'S', 'OPP', 'L', 'DS'];
  const positionColors: Record<string, string> = {
    OH: 'bg-blue-600',
    MB: 'bg-red-600',
    S: 'bg-yellow-600',
    OPP: 'bg-purple-600',
    L: 'bg-green-600',
    DS: 'bg-orange-600',
  };

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading roster...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Roster</h3>
        {canEdit && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Add athlete form */}
      {showAddForm && canEdit && (
        <div className="bg-gray-800 rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="#"
              value={newAthlete.jersey_number}
              onChange={(e) =>
                setNewAthlete({ ...newAthlete, jersey_number: e.target.value })
              }
              className="w-16 bg-gray-700"
            />
            <Input
              placeholder="Name"
              value={newAthlete.display_name}
              onChange={(e) =>
                setNewAthlete({ ...newAthlete, display_name: e.target.value })
              }
              className="flex-1 bg-gray-700"
            />
            <select
              value={newAthlete.position}
              onChange={(e) =>
                setNewAthlete({
                  ...newAthlete,
                  position: e.target.value as VolleyballPosition | '',
                })
              }
              className="bg-gray-700 text-white rounded px-2 text-sm"
            >
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos || 'Pos'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setShowAddForm(false)} size="sm" variant="ghost">
              Cancel
            </Button>
            <Button onClick={createAthlete} size="sm">
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Athletes list */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {athletes.length === 0 ? (
          <p className="text-gray-400 text-sm py-2">No athletes yet.</p>
        ) : (
          athletes.map((athlete) => (
            <div
              key={athlete.id}
              onClick={() => onSelectAthlete?.(athlete)}
              className={`flex items-center justify-between p-2 rounded-lg ${
                selectedAthleteId === athlete.id
                  ? 'bg-blue-600/30 border border-blue-500'
                  : 'bg-gray-800 hover:bg-gray-700'
              } ${onSelectAthlete ? 'cursor-pointer' : ''} transition-colors`}
            >
              {editingId === athlete.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editForm.jersey_number}
                    onChange={(e) =>
                      setEditForm({ ...editForm, jersey_number: e.target.value })
                    }
                    className="w-12 bg-gray-700 h-8 text-sm"
                  />
                  <Input
                    value={editForm.display_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, display_name: e.target.value })
                    }
                    className="flex-1 bg-gray-700 h-8 text-sm"
                  />
                  <select
                    value={editForm.position}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        position: e.target.value as VolleyballPosition | '',
                      })
                    }
                    className="bg-gray-700 text-white rounded px-2 h-8 text-sm"
                  >
                    {positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos || '-'}
                      </option>
                    ))}
                  </select>
                  <Button onClick={saveEdit} size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Check className="w-4 h-4 text-green-400" />
                  </Button>
                  <Button
                    onClick={() => setEditingId(null)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {athlete.jersey_number}
                    </span>
                    <span className="text-white">
                      {athlete.display_name || `#${athlete.jersey_number}`}
                    </span>
                    {athlete.position && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs text-white ${
                          positionColors[athlete.position] || 'bg-gray-600'
                        }`}
                      >
                        {athlete.position}
                      </span>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(athlete);
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAthlete(athlete.id);
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
