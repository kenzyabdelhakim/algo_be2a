import { useEffect, useRef } from 'react';
import type { PathStep } from '../../services/api';

interface RouteMapProps {
  path: PathStep[];
  className?: string;
}

/**
 * Renders a Leaflet map with a polyline and start/end markers for the given
 * path steps. Uses CartoDB Dark Matter tiles to match the app's dark theme.
 * Leaflet is loaded via plain import so we stay in the existing bundle.
 */
export function RouteMap({ path, className = '' }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);

  const validSteps = path.filter(
    (s): s is PathStep & { lat: number; lon: number } =>
      typeof s.lat === 'number' && typeof s.lon === 'number'
  );

  useEffect(() => {
    if (!containerRef.current) return;

    // Lazy-import Leaflet so SSR is not a concern and bundle stays lean.
    import('leaflet').then((L) => {
      // Fix default icon asset paths that Vite breaks.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current && containerRef.current) {
        const initialCenter: [number, number] =
          validSteps.length > 0
            ? [validSteps[0].lat, validSteps[0].lon]
            : [30.0444, 31.2357]; // Cairo fallback

        mapRef.current = L.map(containerRef.current, {
          center: initialCenter,
          zoom: 12,
          zoomControl: true,
          attributionControl: false,
        });

        // CartoDB Dark Matter — matches the dark UI theme.
        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          { subdomains: 'abcd', maxZoom: 19 }
        ).addTo(mapRef.current);
      }

      const map = mapRef.current!;

      // Remove any previous layers (polyline + markers) but keep tile layer.
      map.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
      });

      if (validSteps.length < 2) return;

      const latLngs: [number, number][] = validSteps.map((s) => [s.lat, s.lon]);

      // Route polyline — blue/purple to match app palette.
      L.polyline(latLngs, {
        color: '#818cf8',
        weight: 4,
        opacity: 0.9,
      }).addTo(map);

      // Source marker — green.
      const sourceStep = validSteps[0];
      L.circleMarker([sourceStep.lat, sourceStep.lon], {
        radius: 9,
        fillColor: '#4ade80',
        color: '#fff',
        weight: 2,
        fillOpacity: 1,
      })
        .bindTooltip(sourceStep.nodeName, { permanent: false, direction: 'top' })
        .addTo(map);

      // Destination marker — red.
      const destStep = validSteps[validSteps.length - 1];
      L.circleMarker([destStep.lat, destStep.lon], {
        radius: 9,
        fillColor: '#f87171',
        color: '#fff',
        weight: 2,
        fillOpacity: 1,
      })
        .bindTooltip(destStep.nodeName, { permanent: false, direction: 'top' })
        .addTo(map);

      // Intermediate waypoints — smaller blue dots.
      validSteps.slice(1, -1).forEach((step) => {
        L.circleMarker([step.lat, step.lon], {
          radius: 5,
          fillColor: '#60a5fa',
          color: '#fff',
          weight: 1.5,
          fillOpacity: 0.85,
        })
          .bindTooltip(step.nodeName, { permanent: false, direction: 'top' })
          .addTo(map);
      });

      // Fit map to the polyline with a bit of padding.
      map.fitBounds(L.latLngBounds(latLngs), { padding: [24, 24] });
    });
  // Re-run whenever the path changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  // Cleanup map instance on unmount.
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ background: '#1a1a2e' }}
    />
  );
}
