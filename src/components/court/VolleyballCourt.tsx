// src/components/court/VolleyballCourt.tsx
import React from 'react';

export default function VolleyballCourt() {
    return (
      <div className="w-full max-w-2xl mx-auto mt-4 px-4">
        <svg 
          viewBox="0 0 300 400" 
          className="w-full h-auto border rounded-lg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Court background */}
          <rect x="25" y="25" width="250" height="350" fill="#f9f9f9" stroke="#ccc" strokeWidth="2" />
  
          {/* Net */}
          <line x1="25" y1="200" x2="275" y2="200" stroke="#000" strokeWidth="2" strokeDasharray="6 4" />
  
          {/* Zones 1–6 */}
          {[
            { x: 192, y: 283, label: "1" },  // Back right
            { x: 108, y: 283, label: "6" },  // Back center
            { x: 25, y: 283, label: "5" },   // Back left
            { x: 192, y: 200, label: "2" },  // Front right
            { x: 108, y: 200, label: "3" },  // Front center
            { x: 25, y: 200, label: "4" },   // Front left
          ].map((zone, i) => (
            <g key={i}>
              <rect
                x={zone.x}
                y={zone.y}
                width="83"
                height="83"
                fill="transparent"
                stroke="#999"
                strokeWidth="1"
              />
              <text
                x={zone.x + 41.5}
                y={zone.y + 41.5}
                fontSize="14"
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="#333"
              >
                {zone.label}
              </text>
            </g>
          ))}

          {/* Opponent's court */}
          <rect x="25" y="25" width="250" height="175" fill="transparent" stroke="#999" strokeWidth="1" />
        </svg>
      </div>
    );
  }
  