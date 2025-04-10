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

    const resizeCanvas = () => {
      const courtContainer = canvas.parentElement;
      if (!courtContainer) return;
      
      // Match canvas size to court container
      canvas.width = courtContainer.clientWidth;
      canvas.height = courtContainer.clientHeight;

      // Set initial canvas properties
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
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
      className="absolute inset-0 w-full h-full"
      style={{
        pointerEvents: isDrawing ? 'auto' : 'none',
        cursor: isDrawing ? 'crosshair' : 'default',
        zIndex: 15,
      }}
      onMouseDown={startDraw}
      onMouseMove={draw}
      onMouseUp={stopDraw}
      onMouseLeave={stopDraw}
    />
  );
} 