// src/components/court/VolleyballCourt.tsx
import React from 'react';

export default function VolleyballCourt() {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <svg 
          viewBox="0 0 300 300" 
          className="w-full h-auto volleyball-court"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Court background with gradient */}
          <defs>
            <linearGradient id="courtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--court-wood-dark)" />
              <stop offset="30%" stopColor="var(--court-wood-light)" />
              <stop offset="70%" stopColor="var(--court-wood-light)" />
              <stop offset="100%" stopColor="var(--court-wood-dark)" />
            </linearGradient>
          </defs>

          {/* Main court */}
          <rect 
            x="25" y="50" 
            width="250" height="225" 
            fill="url(#courtGradient)"
            stroke="var(--court-lines)" 
            strokeWidth="2" 
          />
  
          {/* Opponent's court section */}
          <rect 
            x="25" y="25" 
            width="250" height="25" 
            fill="url(#courtGradient)"
            stroke="var(--court-lines)" 
            strokeWidth="2" 
          />

          {/* Net - made more prominent */}
          <line 
            x1="25" y1="50" 
            x2="275" y2="50" 
            stroke="var(--court-lines)" 
            strokeWidth="3" 
            strokeDasharray="8 6" 
          />
  
          {/* Zones 1–6 with improved visibility */}
          {[
            { x: 192, y: 163, label: "1" },
            { x: 108, y: 163, label: "6" },
            { x: 25, y: 163, label: "5" },
            { x: 192, y: 50, label: "2" },
            { x: 108, y: 50, label: "3" },
            { x: 25, y: 50, label: "4" },
          ].map((zone, i) => (
            <g key={i}>
              <rect
                x={zone.x}
                y={zone.y}
                width="83"
                height="112"
                fill="transparent"
                stroke="var(--court-lines)"
                strokeWidth="1.5"
                opacity="0.7"
              />
              <text
                x={zone.x + 41.5}
                y={zone.y + 56}
                fontSize="16"
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="var(--court-lines)"
                className="font-semibold"
              >
                {zone.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }
  