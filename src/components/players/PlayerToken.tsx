'use client';

import { useRef, useState, useCallback } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [lastTap, setLastTap] = useState(0);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);

  const getPercentPosition = useCallback((clientX: number, clientY: number) => {
    if (!ref.current?.parentElement) return null;
    const courtRect = ref.current.parentElement.getBoundingClientRect();
    const x = ((clientX - courtRect.left) / courtRect.width) * 100;
    const y = ((clientY - courtRect.top) / courtRect.height) * 100;
    // Clamp to court bounds
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y))
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    hasMoved.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    const pos = getPercentPosition(e.clientX, e.clientY);
    if (pos) setDragPos(pos);

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [getPercentPosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    // Check if we've moved enough to consider it a drag
    if (dragStartPos.current) {
      const dx = Math.abs(e.clientX - dragStartPos.current.x);
      const dy = Math.abs(e.clientY - dragStartPos.current.y);
      if (dx > 3 || dy > 3) {
        hasMoved.current = true;
      }
    }

    const pos = getPercentPosition(e.clientX, e.clientY);
    if (pos) setDragPos(pos);
  }, [isDragging, getPercentPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (hasMoved.current && dragPos) {
      onMove(dragPos.x, dragPos.y);
    } else {
      // It was a click, not a drag
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;

      if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
        onDoubleClick?.();
        setLastTap(0);
      } else {
        setLastTap(now);
        onClick?.();
      }
    }

    setDragPos(null);
    dragStartPos.current = null;
  }, [isDragging, dragPos, onMove, onClick, onDoubleClick, lastTap]);

  // Use drag position while dragging, otherwise use player position
  const displayX = dragPos?.x ?? player.x;
  const displayY = dragPos?.y ?? player.y;

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2
        w-11 h-11 rounded-full
        flex flex-col items-center justify-center
        bg-[#1e3a5f] text-white border-2 border-[#2563eb]
        font-bold text-base
        shadow-md cursor-move select-none touch-none
        hover:scale-105 active:scale-95
        ${isDragging ? 'opacity-80 scale-110 z-50' : 'opacity-100'}
        ${selected ? 'ring-2 ring-[#f59e0b] ring-offset-2 ring-offset-[#c9a66b] border-[#f59e0b]' : ''}
        ${isRotating && !isDragging ? 'transition-all duration-500 ease-in-out' : ''}
      `}
      style={{
        left: `${displayX}%`,
        top: `${displayY}%`,
      }}
    >
      <span>{player.name || player.number}</span>
      {player.position && (
        <span className="absolute -bottom-5 text-[10px] font-semibold text-white bg-[#1e3a5f]/90 px-1.5 py-0.5 rounded">
          {player.position}
        </span>
      )}
    </div>
  );
}
