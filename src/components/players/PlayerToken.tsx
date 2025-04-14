'use client';

import { useDrag } from 'react-dnd';
import { useRef, useState } from 'react';
import type { PlayerToken } from '@/types/volleyball';

interface PlayerTokenProps {
  player: PlayerToken;
  onMove: (x: number, y: number) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  selected?: boolean;
  isRotating?: boolean;
}

export default function PlayerTokenComponent({ 
  player, 
  onMove, 
  onClick, 
  onDoubleClick,
  selected = false,
  isRotating = false
}: PlayerTokenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [lastTap, setLastTap] = useState(0);

  // Handle mouse clicks for web
  const handleClick = (e: React.MouseEvent) => {
    onClick?.();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onDoubleClick?.();
  };

  // Handle touch events for mobile
  const handleTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      onDoubleClick?.();
      setLastTap(0);
    } else {
      setLastTap(now);
      onClick?.();
    }
  };

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'player',
    item: { id: player.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      monitor.getDropResult();
      const didDrop = monitor.didDrop();
      if (!didDrop && ref.current) {
        // Handle case when dropped outside valid drop target
        const courtRect = ref.current.parentElement!.getBoundingClientRect();
        const dropOffset = monitor.getClientOffset();
        if (dropOffset) {
          const x = ((dropOffset.x - courtRect.left) / courtRect.width) * 100;
          const y = ((dropOffset.y - courtRect.top) / courtRect.height) * 100;
          onMove(x, y);
        }
      }
    },
  }), [player.id, onMove]);

  drag(ref);

  return (
    <div 
      ref={ref}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onTouchEnd={handleTouchEnd}
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2
        w-10 h-10 rounded-full 
        flex flex-col items-center justify-center
        bg-primary/90 text-primary-foreground
        font-bold text-lg
        shadow-lg cursor-move
        hover:scale-110 hover:duration-100
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${isRotating ? 'transition-all duration-500 ease-in-out' : ''}
        transition-transform duration-300
      `}
      style={{
        left: `${player.x}%`,
        top: `${player.y}%`,
      }}
    >
      <span>{player.name || player.number}</span>
      {player.position && (
        <span className="absolute -bottom-5 text-xs font-medium text-court-lines bg-background/80 px-1.5 py-0.5 rounded-full">
          {player.position}
        </span>
      )}
    </div>
  );
} 