'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LIBERIA_CENTER, getCountyCentroid } from '../lib/liberia-counties';

interface InsightRow {
  label: string;
  count: number;
}

/**
 * Heat-zone participation map. Plots one circle marker per county at its
 * approximate centroid (not precise administrative boundaries — see
 * lib/liberia-counties.ts), sized and colored by signature/vote count.
 * Only aggregated county-level counts are ever rendered — no individual
 * pins, no per-person location data.
 */
export function HeatZoneMap({ rows, heightClassName = 'h-80' }: { rows: InsightRow[]; heightClassName?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const points = rows
    .map((row) => {
      const centroid = getCountyCentroid(row.label);
      return centroid ? { ...row, centroid } : null;
    })
    .filter((p): p is InsightRow & { centroid: [number, number] } => p !== null);

  if (!mounted) {
    return <div className={`${heightClassName} animate-pulse rounded-2xl bg-zinc-100 dark:bg-neutral-800`} />;
  }

  if (points.length === 0) {
    return (
      <div className={`flex ${heightClassName} items-center justify-center rounded-2xl bg-zinc-50 text-sm text-zinc-400 dark:bg-neutral-800 dark:text-neutral-500`}>
        No county-level data to plot yet.
      </div>
    );
  }

  const max = Math.max(...points.map((p) => p.count), 1);

  return (
    <div className={`${heightClassName} overflow-hidden rounded-2xl border border-zinc-200 dark:border-neutral-700`}>
      <MapContainer
        center={LIBERIA_CENTER}
        zoom={7}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {points.map((p) => {
          const intensity = p.count / max;
          const radius = 8 + intensity * 22;
          return (
            <CircleMarker
              key={p.label}
              center={p.centroid}
              radius={radius}
              pathOptions={{
                color: '#059669',
                fillColor: '#10b981',
                fillOpacity: 0.35 + intensity * 0.45,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -radius]}>
                <span className="font-semibold">{p.label}</span>: {p.count.toLocaleString()}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
