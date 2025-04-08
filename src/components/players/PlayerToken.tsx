'use client';

import { useDrag } from 'react-dnd';
import { useRef } from 'react';
import { PlayerToken } from '@/types/volleyball';

interface PlayerTokenProps {
  player: PlayerToken;
  onMove: (x: number, y: number) => void;
  selected?: boolean;
}

export default function PlayerToken({ player, onMove, selected = false }: PlayerTokenProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'player',
    item: { id: player.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      const clientOffset = monitor.getClientOffset();
      
      if (clientOffset && ref.current) {
        const courtRect = ref.current.parentElement?.getBoundingClientRect();
        if (courtRect) {
          const x = ((clientOffset.x - courtRect.left) / courtRect.width) * 100;
          const y = ((clientOffset.y - courtRect.top) / courtRect.height) * 100;
          onMove(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
        }
      }
    },
  }), [player.id, onMove]);

  drag(ref);

  return (
    <div 
      ref={ref}
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2
        w-10 h-10 rounded-full 
        flex flex-col items-center justify-center
        bg-primary/90 text-primary-foreground
        font-bold text-lg
        shadow-lg cursor-move
        hover:scale-110 transition-all duration-150
        ${selected ? 'ring-2 ring-court-lines scale-110' : ''}
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
      style={{
        left: `${player.x}%`,
        top: `${player.y}%`,
      }}
    >
      <span>{player.number}</span>
      {player.position && (
        <span className="absolute -bottom-5 text-xs font-medium text-court-lines bg-background/80 px-1.5 py-0.5 rounded-full">
          {player.position}
        </span>
      )}
    </div>
  );
} 