// src/components/court/VolleyballCourt.tsx
'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useState, useRef } from 'react';
import type { PlayerToken as PlayerTokenType } from '@/types/volleyball';
import PlayerTokenComponent from '@/components/players/PlayerToken';
import EditPlayerDialog from '@/components/players/EditPlayerDialog';
import DrawingCanvas from './DrawingCanvas';

// Define the default court positions that players will rotate into
const DEFAULT_POSITIONS = [
  { x: 33, y: 45 },  // Position 4
  { x: 50, y: 45 },  // Position 3
  { x: 67, y: 45 },  // Position 2
  { x: 67, y: 75 },  // Position 1
  { x: 50, y: 75 },  // Position 6
  { x: 33, y: 75 },  // Position 5
];

export default function VolleyballCourt() {
  const [players, setPlayers] = useState<PlayerTokenType[]>([
    { id: '1', number: "10", position: "MB", x: 33, y: 45 },  // Position 4
    { id: '2', number: "14", position: "S", x: 50, y: 45 },   // Position 3
    { id: '3', number: "7", position: "OH", x: 67, y: 45 },   // Position 2
    { id: '4', number: "4", position: "OPP", x: 67, y: 75 },  // Position 1
    { id: '5', number: "12", position: "L", x: 50, y: 75 },   // Position 6
    { id: '6', number: "2", position: "OH", x: 33, y: 75 },   // Position 5
  ]);

  const [editingPlayer, setEditingPlayer] = useState<PlayerTokenType | null>(null);
  const [swapMode, setSwapMode] = useState<{
    active: boolean;
    firstPlayer?: PlayerTokenType;
  }>({ active: false });

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Yellow', value: '#ffd700' },
    { name: 'Red', value: '#ff4444' },
    { name: 'Blue', value: '#4444ff' },
  ];

  const handleRotation = () => {
    setPlayers(prevPlayers => {
      // Create a map of current positions to players
      const positionMap = new Map();
      
      // Find which player is in each position
      prevPlayers.forEach(player => {
        // Find the closest default position
        const closestPosition = DEFAULT_POSITIONS.reduce((closest, pos, index) => {
          const distance = Math.sqrt(
            Math.pow(player.x - pos.x, 2) + Math.pow(player.y - pos.y, 2)
          );
          if (distance < closest.distance) {
            return { index, distance };
          }
          return closest;
        }, { index: 0, distance: Infinity });

        positionMap.set(closestPosition.index, player);
      });

      // Create new array with rotated positions
      return DEFAULT_POSITIONS.map((pos, index) => {
        // Find which player should move to this position
        const prevIndex = (index + 5) % 6; // Move backwards to get previous position
        const player = positionMap.get(prevIndex);
        
        if (!player) {
          // Fallback if no player found (shouldn't happen)
          return prevPlayers[index];
        }

        return {
          ...player,
          x: pos.x,
          y: pos.y,
        };
      });
    });
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
      setSwapMode({ active: true, firstPlayer: player });
    } else if (swapMode.firstPlayer?.id !== player.id) {
      // Complete the swap
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

  const handleClearDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    setIsDrawing(false);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full max-w-2xl mx-auto space-y-4">
        {/* Buttons with higher z-index */}
        <div className="relative z-[100] flex justify-between items-center">
          <button
            onClick={() => setSwapMode({ active: false })}
            className={`px-4 py-2 rounded-lg ${
              swapMode.active 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-secondary text-secondary-foreground'
            }`}
            disabled={editingPlayer !== null}
          >
            {swapMode.active ? 'Cancel Swap' : 'Swap Players'}
          </button>
          
          <button
            onClick={handleRotation}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg 
                     hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <svg 
              className="w-5 h-5" 
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => isDrawing ? handleClearDrawing() : setIsDrawing(true)}
              className={`px-4 py-2 rounded-lg ${
                isDrawing 
                  ? 'bg-destructive text-destructive-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {isDrawing ? 'Clear Drawing' : 'Draw'}
            </button>
            
            {isDrawing && (
              <div className="flex gap-1">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setDrawingColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      drawingColor === color.value ? 'border-primary' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="relative court-container">
          <svg 
            viewBox="0 0 300 300" 
            className="w-full h-full volleyball-court z-10"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Court background with wooden texture gradient */}
            <defs>
              <linearGradient id="woodGrain" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#deb887', stopOpacity: 0.9 }} />
                <stop offset="50%" style={{ stopColor: '#d2691e', stopOpacity: 0.9 }} />
                <stop offset="100%" style={{ stopColor: '#deb887', stopOpacity: 0.9 }} />
              </linearGradient>
            </defs>

            {/* Main court */}
            <rect 
              x="25" y="50" 
              width="250" height="225" 
              fill="url(#woodGrain)"
              stroke="#333" 
              strokeWidth="2" 
            />
    
            {/* Opponent's court section */}
            <rect 
              x="25" y="25" 
              width="250" height="25" 
              fill="url(#woodGrain)"
              stroke="#333" 
              strokeWidth="2" 
            />

            {/* Net */}
            <line 
              x1="25" y1="50" 
              x2="275" y2="50" 
              stroke="#fff" 
              strokeWidth="3" 
              strokeDasharray="8 6" 
            />

            {/* 10-foot (attack) line */}
            <line 
              x1="25" y1="125" 
              x2="275" y2="125" 
              stroke="#333" 
              strokeWidth="1.5" 
              strokeDasharray="2 2"
            />

            {/* Position numbers - more subtle */}
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
                fill="rgba(139, 69, 19, 0.3)"  // Dark brown with low opacity
                className="select-none"
              >
                {pos.label}
              </text>
            ))}

            {/* Court side markers */}
            <circle cx="25" cy="50" r="4" fill="#333" />
            <circle cx="275" cy="50" r="4" fill="#333" />
          </svg>

          {/* Player Tokens */}
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

          {/* Drawing Canvas */}
          {isDrawing && <DrawingCanvas isDrawing={isDrawing} color={drawingColor} />}
        </div>

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
    </DndProvider>
  );
}
  