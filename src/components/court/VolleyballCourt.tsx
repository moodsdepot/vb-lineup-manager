// src/components/court/VolleyballCourt.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import type { PlayerToken as PlayerTokenType, BenchPlayer } from '@/types/volleyball';
import PlayerTokenComponent from '@/components/players/PlayerToken';
import EditPlayerDialog from '@/components/players/EditPlayerDialog';
import DrawingCanvas from './DrawingCanvas';
import { getSupabaseBrowserClient } from '@/lib/supabase';

const DEFAULT_POSITIONS = [
  { x: 33, y: 45 },  // Position 4 (front left)
  { x: 50, y: 45 },  // Position 3 (front middle)
  { x: 67, y: 45 },  // Position 2 (front right)
  { x: 67, y: 75 },  // Position 1 (back right - serving)
  { x: 50, y: 75 },  // Position 6 (back middle)
  { x: 33, y: 75 },  // Position 5 (back left)
];

const POSITION_OPTIONS: { value: PlayerTokenType['position']; label: string }[] = [
  { value: 'OH', label: 'OH' },
  { value: 'MB', label: 'MB' },
  { value: 'S', label: 'S' },
  { value: 'OPP', label: 'OPP' },
  { value: 'L', label: 'L' },
  { value: 'DS', label: 'DS' },
];

interface VolleyballCourtProps {
  teamId: string;
  initialPlayers: PlayerTokenType[];
  lineupId: string | null | undefined;
}

export default function VolleyballCourt({ teamId, initialPlayers, lineupId: initialLineupId }: VolleyballCourtProps) {
  const [players, setPlayers] = useState<PlayerTokenType[]>(initialPlayers);
  const [bench, setBench] = useState<BenchPlayer[]>([]);
  const [benchEnabled, setBenchEnabled] = useState(false);
  const [currentLineupId, setCurrentLineupId] = useState<string | null | undefined>(initialLineupId);
  const [editingPlayer, setEditingPlayer] = useState<PlayerTokenType | null>(null);
  const [swapMode, setSwapMode] = useState<{
    active: boolean;
    firstPlayer?: PlayerTokenType;
    benchPlayer?: BenchPlayer;
    source?: 'court' | 'bench';
  }>({ active: false });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#dc2626');
  const [isSaving, setIsSaving] = useState(false);
  const [showAddBenchPlayer, setShowAddBenchPlayer] = useState(false);
  const [newBenchNumber, setNewBenchNumber] = useState('');
  const [newBenchName, setNewBenchName] = useState('');
  const [newBenchPosition, setNewBenchPosition] = useState<PlayerTokenType['position']>('OH');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDemoMode = teamId === 'demo' || !teamId || !teamId.includes('-');

  useEffect(() => {
    setPlayers(initialPlayers);
    setCurrentLineupId(initialLineupId);
  }, [initialPlayers, initialLineupId]);

  const colors = [
    { name: 'Red', value: '#dc2626' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'White', value: '#ffffff' },
  ];

  const handleRotation = () => {
    if (benchEnabled && bench.length > 0) {
      // Bench-enabled rotation:
      // 1. Player at position 2 (index 2) exits to bench
      // 2. First bench player enters at position 1 (index 3 - serving position)
      // 3. Remaining players rotate forward

      const currentPlayers = [...players];
      const currentBench = [...bench];

      // Get player at position 2 (front right) - they exit to bench
      const exitingPlayer = currentPlayers[2];

      // Get first bench player to enter
      const enteringPlayer = currentBench[0];

      // Update bench: remove first player, add exiting player to end
      const newBench = [
        ...currentBench.slice(1),
        {
          id: exitingPlayer.id,
          number: exitingPlayer.number,
          name: exitingPlayer.name,
          position: exitingPlayer.position,
        }
      ];

      // Perform rotation
      const rotated: PlayerTokenType[] = [
        { ...currentPlayers[5], x: DEFAULT_POSITIONS[0].x, y: DEFAULT_POSITIONS[0].y }, // 5 -> 4
        { ...currentPlayers[0], x: DEFAULT_POSITIONS[1].x, y: DEFAULT_POSITIONS[1].y }, // 4 -> 3
        { ...currentPlayers[1], x: DEFAULT_POSITIONS[2].x, y: DEFAULT_POSITIONS[2].y }, // 3 -> 2
        { // Bench player enters at position 1 (serving)
          id: enteringPlayer.id,
          number: enteringPlayer.number,
          name: enteringPlayer.name,
          position: enteringPlayer.position,
          x: DEFAULT_POSITIONS[3].x,
          y: DEFAULT_POSITIONS[3].y,
        },
        { ...currentPlayers[3], x: DEFAULT_POSITIONS[4].x, y: DEFAULT_POSITIONS[4].y }, // 1 -> 6
        { ...currentPlayers[4], x: DEFAULT_POSITIONS[5].x, y: DEFAULT_POSITIONS[5].y }, // 6 -> 5
      ];

      setPlayers(rotated);
      setBench(newBench);
    } else {
      // Standard 6-player rotation (no bench)
      setPlayers(prevPlayers => {
        const rotated = [...prevPlayers];
        const lastPlayer = rotated.pop()!;
        rotated.unshift(lastPlayer);

        return rotated.map((player, index) => ({
          ...player,
          x: DEFAULT_POSITIONS[index].x,
          y: DEFAULT_POSITIONS[index].y,
        }));
      });
    }
  };

  const handleToggleBench = () => {
    // Just toggle visibility - don't clear bench players
    setBenchEnabled(!benchEnabled);
  };

  const handleClearBench = () => {
    setBench([]);
  };

  const handleAddBenchPlayer = () => {
    if (!newBenchNumber.trim()) return;

    const newPlayer: BenchPlayer = {
      id: `bench-${Date.now()}`,
      number: newBenchNumber.trim(),
      name: newBenchName.trim() || undefined,
      position: newBenchPosition,
    };

    setBench(prev => [...prev, newPlayer]);
    setNewBenchNumber('');
    setNewBenchName('');
    setNewBenchPosition('OH');
    setShowAddBenchPlayer(false);
  };

  const handleRemoveBenchPlayer = (playerId: string) => {
    setBench(prev => prev.filter(p => p.id !== playerId));
  };

  const handlePlayerMove = (id: string, x: number, y: number) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === id ? { ...player, x, y } : player
      )
    );
  };

  const handlePlayerEdit = (player: PlayerTokenType) => {
    setSwapMode({ active: false });
    setEditingPlayer(player);
  };

  const handleSavePlayer = (updatedPlayer: PlayerTokenType) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(p =>
        p.id === updatedPlayer.id ? updatedPlayer : p
      )
    );
    setEditingPlayer(null);
  };

  const handlePlayerClick = (player: PlayerTokenType) => {
    if (editingPlayer) return;

    if (!swapMode.active) {
      // Start swap mode with court player
      setSwapMode({ active: true, firstPlayer: player, source: 'court' });
    } else if (swapMode.source === 'bench' && swapMode.benchPlayer) {
      // Bench player selected first, now swapping with court player
      const benchPlayer = swapMode.benchPlayer;

      // Remove bench player from bench
      setBench(prev => prev.filter(p => p.id !== benchPlayer.id));

      // Add court player to bench
      setBench(prev => [...prev, {
        id: player.id,
        number: player.number,
        name: player.name,
        position: player.position,
      }]);

      // Replace court player with bench player at same position
      setPlayers(prevPlayers => prevPlayers.map(p => {
        if (p.id === player.id) {
          return {
            id: benchPlayer.id,
            number: benchPlayer.number,
            name: benchPlayer.name,
            position: benchPlayer.position,
            x: p.x,
            y: p.y,
          };
        }
        return p;
      }));

      setSwapMode({ active: false });
    } else if (swapMode.firstPlayer?.id !== player.id) {
      // Both are court players - swap positions
      setPlayers(prevPlayers => {
        return prevPlayers.map(p => {
          if (p.id === swapMode.firstPlayer?.id) {
            return { ...p, x: player.x, y: player.y };
          }
          if (p.id === player.id) {
            return { ...p, x: swapMode.firstPlayer!.x, y: swapMode.firstPlayer!.y };
          }
          return p;
        });
      });

      setSwapMode({ active: false });
    }
  };

  const handleBenchPlayerClick = (benchPlayer: BenchPlayer) => {
    if (editingPlayer) return;

    if (!swapMode.active) {
      // Start swap mode with bench player
      setSwapMode({ active: true, benchPlayer, source: 'bench' });
    } else if (swapMode.source === 'court' && swapMode.firstPlayer) {
      // Court player selected first, now swapping with bench player
      const courtPlayer = swapMode.firstPlayer;

      // Remove bench player from bench
      setBench(prev => prev.filter(p => p.id !== benchPlayer.id));

      // Add court player to bench
      setBench(prev => [...prev, {
        id: courtPlayer.id,
        number: courtPlayer.number,
        name: courtPlayer.name,
        position: courtPlayer.position,
      }]);

      // Replace court player with bench player at same position
      setPlayers(prevPlayers => prevPlayers.map(p => {
        if (p.id === courtPlayer.id) {
          return {
            id: benchPlayer.id,
            number: benchPlayer.number,
            name: benchPlayer.name,
            position: benchPlayer.position,
            x: p.x,
            y: p.y,
          };
        }
        return p;
      }));

      setSwapMode({ active: false });
    } else if (swapMode.source === 'bench' && swapMode.benchPlayer?.id !== benchPlayer.id) {
      // Both are bench players - swap order in bench
      setBench(prev => {
        const idx1 = prev.findIndex(p => p.id === swapMode.benchPlayer?.id);
        const idx2 = prev.findIndex(p => p.id === benchPlayer.id);
        const newBench = [...prev];
        [newBench[idx1], newBench[idx2]] = [newBench[idx2], newBench[idx1]];
        return newBench;
      });

      setSwapMode({ active: false });
    }
  };

  const handleClearDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    setIsDrawing(false);
  };

  const handleSaveLineup = async () => {
    if (isDemoMode) {
      alert("Saving is disabled in demo mode.");
      return;
    }
    setIsSaving(true);
    const supabase = getSupabaseBrowserClient();

    const lineupData = {
      team_id: teamId,
      players: players,
      name: 'Default Lineup',
      updated_at: new Date().toISOString(),
    };

    try {
      let resultError;
      let resultData;

      if (currentLineupId) {
        const { data, error } = await supabase
          .from('lineups')
          .update({
              players: lineupData.players,
              name: lineupData.name,
              updated_at: lineupData.updated_at
            })
          .eq('id', currentLineupId)
          .select('id')
          .single();
        resultError = error;
        resultData = data;

      } else {
        const { data, error } = await supabase
          .from('lineups')
          .insert({
              team_id: lineupData.team_id,
              players: lineupData.players,
              name: lineupData.name,
              updated_at: lineupData.updated_at,
              created_at: new Date().toISOString()
            })
          .select('id')
          .single();
        resultError = error;
        resultData = data;
        if (!error && resultData?.id) {
             setCurrentLineupId(resultData.id);
        }
      }

      if (resultError) throw resultError;

      alert('Lineup saved successfully!');

    } catch (err: unknown) {
      console.error("Error saving lineup:", err);
      const message = err instanceof Error ? err.message : 'Unknown error saving lineup.';
      alert(`Failed to save lineup: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-3 py-4">
      {/* Instructions */}
      <div className="px-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6b5f52]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a35d3a]"></span>
            Tap to swap{benchEnabled ? ' (court or bench)' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a35d3a]"></span>
            Double-tap to edit
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 flex flex-wrap items-center gap-2">
        <button
          onClick={handleSaveLineup}
          disabled={isSaving || isDemoMode}
          className="h-9 px-3.5 bg-[#a35d3a] hover:bg-[#8a4e31] text-[#faf7f2] rounded text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={handleRotation}
          disabled={benchEnabled && bench.length === 0}
          className="h-9 px-3 bg-[#d4cdc0] hover:bg-[#c4b8a5] text-[#1a1612] rounded flex items-center justify-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Rotate
        </button>

        <button
          onClick={() => isDrawing ? handleClearDrawing() : setIsDrawing(true)}
          className="h-9 px-3 bg-[#d4cdc0] hover:bg-[#c4b8a5] text-[#1a1612] rounded text-sm font-medium transition-colors"
        >
          {isDrawing ? 'Clear' : 'Draw'}
        </button>

        {/* Bench Toggle */}
        <button
          onClick={handleToggleBench}
          className={`h-9 px-3 rounded text-sm font-medium transition-colors ${
            benchEnabled
              ? 'bg-[#1e3a5f] text-white hover:bg-[#2563eb]'
              : 'bg-[#d4cdc0] hover:bg-[#c4b8a5] text-[#1a1612]'
          }`}
        >
          {benchEnabled ? 'Bench On' : 'Bench Off'}
        </button>

        {swapMode.active && (
          <button
            onClick={() => setSwapMode({ active: false })}
            className="h-9 px-3 bg-[#9b3c3c] hover:bg-[#7d2f2f] text-[#faf7f2] rounded text-sm font-medium transition-colors"
            disabled={editingPlayer !== null}
          >
            Cancel
          </button>
        )}

        {isDrawing && (
          <div className="flex gap-1 ml-auto">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => setDrawingColor(color.value)}
                className={`w-7 h-7 rounded border-2 transition-all ${
                  drawingColor === color.value ? 'border-[#a35d3a] scale-110' : 'border-[#c4b8a5]'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* Court - always full width */}
      <div className="relative court-container mx-4">
        <svg
          viewBox="0 0 300 300"
          className="w-full h-full rounded z-10"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="courtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4a056" />
              <stop offset="50%" stopColor="#c48b3c" />
              <stop offset="100%" stopColor="#b87a2e" />
            </linearGradient>
            <linearGradient id="shineOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
            </linearGradient>
          </defs>

          <rect
            x="25" y="50"
            width="250" height="225"
            fill="url(#courtGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          <rect
            x="25" y="50"
            width="250" height="225"
            fill="url(#shineOverlay)"
          />

          <rect
            x="25" y="25"
            width="250" height="25"
            fill="#a67c3d"
            stroke="#8b5a2b"
            strokeWidth="2"
          />

          <rect
            x="27" y="52"
            width="246" height="221"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
          />

          <line
            x1="25" y1="50"
            x2="275" y2="50"
            stroke="#ffffff"
            strokeWidth="4"
          />

          <line
            x1="27" y1="125"
            x2="273" y2="125"
            stroke="#ffffff"
            strokeWidth="2"
          />

          <line x1="150" y1="52" x2="150" y2="62" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="150" y1="263" x2="150" y2="273" stroke="#ffffff" strokeWidth="1.5" />

          {[
            { x: 225, y: 200, label: "1" },
            { x: 150, y: 200, label: "6" },
            { x: 75, y: 200, label: "5" },
            { x: 225, y: 85, label: "2" },
            { x: 150, y: 85, label: "3" },
            { x: 75, y: 85, label: "4" },
          ].map((pos, i) => (
            <text
              key={i}
              x={pos.x}
              y={pos.y}
              fontSize="16"
              textAnchor="middle"
              alignmentBaseline="middle"
              fill="rgba(255, 255, 255, 0.25)"
              className="select-none"
            >
              {pos.label}
            </text>
          ))}

          <circle cx="25" cy="50" r="4" fill="#e5e5e5" stroke="#999" strokeWidth="1" />
          <circle cx="275" cy="50" r="4" fill="#e5e5e5" stroke="#999" strokeWidth="1" />
        </svg>

        <div className="absolute inset-0">
          {players.map((player) => (
            <PlayerTokenComponent
              key={player.id}
              player={player}
              onMove={(x, y) => handlePlayerMove(player.id, x, y)}
              onClick={() => handlePlayerClick(player)}
              onDoubleClick={() => handlePlayerEdit(player)}
              selected={swapMode.firstPlayer?.id === player.id}
            />
          ))}
        </div>

        {isDrawing && <DrawingCanvas isDrawing={isDrawing} color={drawingColor} />}
      </div>

      {/* Bench Panel - appears below court, same width */}
      {benchEnabled && (
        <div className="mx-4 bg-[#e8e2d8] rounded border border-[#c4b8a5] p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[#1a1612]">Bench</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#6b5f52]">{bench.length} sub{bench.length !== 1 ? 's' : ''}</span>
              {bench.length > 0 && (
                <button
                  onClick={handleClearBench}
                  className="text-xs text-[#9b3c3c] hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Bench Players - horizontal scroll on mobile */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {bench.length === 0 ? (
              <p className="text-xs text-[#a39485] py-4 w-full text-center">No subs added. Tap &quot;+ Add Sub&quot; to add players.</p>
            ) : (
              bench.map((player, index) => (
                <div
                  key={player.id}
                  className="flex-shrink-0 flex flex-col items-center"
                >
                  {/* Player token style circle - clickable for swap */}
                  <button
                    onClick={() => handleBenchPlayerClick(player)}
                    className={`relative w-11 h-11 rounded-full flex flex-col items-center justify-center font-bold text-base shadow-md cursor-pointer transition-transform hover:scale-105 ${
                      swapMode.benchPlayer?.id === player.id
                        ? 'bg-[#1e3a5f] text-white border-2 border-[#f59e0b] ring-2 ring-[#f59e0b] ring-offset-2 ring-offset-[#e8e2d8]'
                        : index === 0
                          ? 'bg-[#1e3a5f] text-white border-2 border-[#f59e0b]'
                          : 'bg-[#1e3a5f] text-white border-2 border-[#2563eb]'
                    }`}
                  >
                    <span>{player.name || player.number}</span>
                    {player.position && (
                      <span className="absolute -bottom-5 text-[10px] font-semibold text-white bg-[#1e3a5f]/90 px-1.5 py-0.5 rounded">
                        {player.position}
                      </span>
                    )}
                  </button>

                  {/* Labels below token */}
                  <div className="mt-6 text-center">
                    {index === 0 && !swapMode.active && (
                      <span className="text-[9px] font-medium text-[#a35d3a] uppercase">Next up</span>
                    )}
                    {swapMode.benchPlayer?.id === player.id && (
                      <span className="text-[9px] font-medium text-[#f59e0b] uppercase">Selected</span>
                    )}
                    <button
                      onClick={() => handleRemoveBenchPlayer(player.id)}
                      className="block mt-1 text-[10px] text-[#9b3c3c] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Player Form */}
          {showAddBenchPlayer ? (
            <div className="mt-3 pt-3 border-t border-[#c4b8a5]">
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Jersey #"
                  value={newBenchNumber}
                  onChange={(e) => setNewBenchNumber(e.target.value)}
                  className="w-20 px-2 py-1.5 text-sm rounded border border-[#c4b8a5] bg-white text-[#1a1612]"
                  maxLength={4}
                />
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={newBenchName}
                  onChange={(e) => setNewBenchName(e.target.value)}
                  className="flex-1 min-w-[100px] px-2 py-1.5 text-sm rounded border border-[#c4b8a5] bg-white text-[#1a1612]"
                  maxLength={20}
                />
                <select
                  value={newBenchPosition}
                  onChange={(e) => setNewBenchPosition(e.target.value as PlayerTokenType['position'])}
                  className="w-20 px-2 py-1.5 text-sm rounded border border-[#c4b8a5] bg-white text-[#1a1612]"
                >
                  {POSITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddBenchPlayer}
                  disabled={!newBenchNumber.trim()}
                  className="px-4 py-1.5 text-sm bg-[#a35d3a] hover:bg-[#8a4e31] text-white rounded font-medium disabled:opacity-50"
                >
                  Add to Bench
                </button>
                <button
                  onClick={() => {
                    setShowAddBenchPlayer(false);
                    setNewBenchNumber('');
                    setNewBenchName('');
                    setNewBenchPosition('OH');
                  }}
                  className="px-4 py-1.5 text-sm bg-[#d4cdc0] hover:bg-[#c4b8a5] text-[#1a1612] rounded font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddBenchPlayer(true)}
              className="mt-2 w-full py-2 text-sm bg-[#d4cdc0] hover:bg-[#c4b8a5] text-[#1a1612] rounded font-medium transition-colors"
            >
              + Add Sub
            </button>
          )}
        </div>
      )}

      {editingPlayer && (
        <EditPlayerDialog
          player={editingPlayer}
          isOpen={true}
          onClose={() => {
            setEditingPlayer(null);
            setSwapMode({ active: false });
          }}
          onSave={handleSavePlayer}
        />
      )}
    </div>
  );
}
