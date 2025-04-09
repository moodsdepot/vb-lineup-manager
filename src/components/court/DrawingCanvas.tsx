'use client';

import { useRef, useEffect } from 'react';

interface DrawingCanvasProps {
  isDrawing: boolean;
  color: string;
}

export default function DrawingCanvas({ isDrawing, color }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the court element
    const court = document.querySelector('.court-container');
    if (!court) return;

    // Match the court size and position
    const courtRect = court.getBoundingClientRect();
    canvas.style.width = `${courtRect.width}px`;
    canvas.style.height = `${courtRect.height}px`;
    canvas.width = courtRect.width;
    canvas.height = courtRect.height;
    
    // Position the canvas exactly over the court
    canvas.style.top = `${courtRect.top}px`;
    canvas.style.left = `${courtRect.left}px`;

    // Set initial canvas properties
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 8; // Increased thickness
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  const startDraw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    lastPosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    isDrawingRef.current = true;
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !isDrawingRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 8; // Increased thickness
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    lastPosRef.current = currentPos;
  };

  const stopDraw = () => {
    isDrawingRef.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute"
      style={{
        pointerEvents: isDrawing ? 'auto' : 'none',
        cursor: isDrawing ? 'crosshair' : 'default',
        position: 'fixed', // Use fixed positioning
        zIndex: 50, // High z-index but not over buttons
      }}
      onMouseDown={startDraw}
      onMouseMove={draw}
      onMouseUp={stopDraw}
      onMouseLeave={stopDraw}
    />
  );
} 