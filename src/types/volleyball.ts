export interface PlayerToken {
  id: string;
  number: string;
  name?: string;  // Add optional name field
  position?: 'OH' | 'MB' | 'S' | 'OPP' | 'L' | 'DS';
  x: number;  // percentage from left (0-100)
  y: number;  // percentage from top (0-100)
} 