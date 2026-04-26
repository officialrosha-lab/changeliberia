'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '../lib/useWebSocket';

interface Hotspot {
  name: string;
  latitude: number;
  longitude: number;
  intensity: number;
  petitions: number;
}

export function PulseMap() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([
    { name: 'Monrovia', latitude: 6.3183, longitude: -10.8085, intensity: 0.85, petitions: 42 },
    { name: 'Sinkor', latitude: 6.31, longitude: -10.81, intensity: 0.60, petitions: 30 },
    { name: 'Lofa', latitude: 7.5833, longitude: -10.0833, intensity: 0.40, petitions: 20 },
  ]);

  const { getPulseMap, onPulseMapData, onNewSignature } = useWebSocket();

  // Request pulse map data on mount
  useEffect(() => {
    getPulseMap();
  }, [getPulseMap]);

  // Listen for pulse map updates
  useEffect(() => {
    const unsubscribe = onPulseMapData((data) => {
      if (data.hotspots) {
        setHotspots(data.hotspots);
      }
    });

    return unsubscribe;
  }, [onPulseMapData]);

  // Listen for new signatures to update intensities
  useEffect(() => {
    const unsubscribe = onNewSignature((data) => {
      if (data.county) {
        setHotspots(prev =>
          prev.map(h =>
            h.name.toLowerCase() === data.county.toLowerCase()
              ? { ...h, intensity: Math.min(1, h.intensity + 0.02), petitions: h.petitions + 1 }
              : h
          )
        );
      }
    });

    return unsubscribe;
  }, [onNewSignature]);

  return (
    <div className="absolute inset-0 pointer-events-none opacity-20">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        {/* Background reference map boundaries */}
        <circle cx="40" cy="50" r="8" fill="none" stroke="#22C55E" strokeWidth="0.2" opacity="0.2" />
        
        {/* Hotspot pulsing circles */}
        {hotspots.map((hotspot, idx) => {
          // Convert geographic coordinates to SVG viewBox coordinates
          // Liberia is roughly between 4-8°N, 8-12°W
          const x = ((hotspot.longitude + 12) / 4) * 100;
          const y = ((8 - hotspot.latitude) / 4) * 100;
          const radius = hotspot.intensity * 8;

          return (
            <g key={`${hotspot.name}-${idx}`}>
              {/* Outer pulsing ring */}
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill="none"
                stroke="#22C55E"
                strokeWidth="0.5"
                opacity={hotspot.intensity * 0.6}
                className="animate-pulse"
              />
              {/* Inner solid circle */}
              <circle
                cx={x}
                cy={y}
                r={radius * 0.6}
                fill="#22C55E"
                opacity={hotspot.intensity * 0.4}
                className="animate-pulse"
                style={{
                  animationDuration: `${2 + idx * 0.5}s`,
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}