'use client';

import { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  isDrawing: boolean;
  color: string;
}

export default function DrawingCanvas({ isDrawing, color }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

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
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    lastPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setIsDrawingActive(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingActive || !canvasRef.current || !lastPos.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    lastPos.current = currentPos;
  };

  const handleMouseUp = () => {
    setIsDrawingActive(false);
    lastPos.current = null;
  };

  // Touch event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      lastPos.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
      setIsDrawingActive(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDrawingActive || !lastPos.current) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentPos = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = color;
      ctx.stroke();

      lastPos.current = currentPos;
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDrawing, isDrawingActive, color]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="absolute inset-0 w-full h-full"
      style={{
        pointerEvents: isDrawing ? 'auto' : 'none',
        cursor: isDrawing ? 'crosshair' : 'default',
        zIndex: 15,
      }}
    />
  );
} 