import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const HEAT_SOURCE_ID = 'traffic-heat-source';
const HEAT_LAYER_ID = 'traffic-heatmap';

function buildTrafficHeatData(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  const hotspots: { lon: number; lat: number; spread: number; weight: number }[] =
    [
      { lon: 31.2357, lat: 30.0444, spread: 0.022, weight: 10 },
      { lon: 31.2, lat: 30.062, spread: 0.016, weight: 7 },
      { lon: 31.276, lat: 30.032, spread: 0.018, weight: 8 },
      { lon: 31.17, lat: 30.09, spread: 0.014, weight: 6 },
    ];

  for (const h of hotspots) {
    for (let i = 0; i < 85; i++) {
      features.push({
        type: 'Feature',
        properties: { intensity: h.weight * Math.random() },
        geometry: {
          type: 'Point',
          coordinates: [
            h.lon + (Math.random() - 0.5) * h.spread,
            h.lat + (Math.random() - 0.5) * h.spread,
          ],
        },
      });
    }
  }
  for (let i = 0; i < 140; i++) {
    features.push({
      type: 'Feature',
      properties: { intensity: Math.random() * 4 },
      geometry: {
        type: 'Point',
        coordinates: [
          31.14 + Math.random() * 0.22,
          29.94 + Math.random() * 0.16,
        ],
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

export type TrafficHeatMapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  /** @returns whether the heatmap layer is visible after toggle */
  toggleHeatmapVisibility: () => boolean;
};

type TrafficHeatMapProps = {
  className?: string;
};

export const TrafficHeatMap = forwardRef<TrafficHeatMapHandle, TrafficHeatMapProps>(
  function TrafficHeatMap({ className = '' }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

    useImperativeHandle(ref, () => ({
      zoomIn: () => mapRef.current?.zoomIn({ duration: 300 }),
      zoomOut: () => mapRef.current?.zoomOut({ duration: 300 }),
      toggleHeatmapVisibility: () => {
        const map = mapRef.current;
        if (!map?.getLayer(HEAT_LAYER_ID)) return false;
        const hidden =
          map.getLayoutProperty(HEAT_LAYER_ID, 'visibility') === 'none';
        const next = hidden ? 'visible' : 'none';
        map.setLayoutProperty(HEAT_LAYER_ID, 'visibility', next);
        return next === 'visible';
      },
    }));

    useEffect(() => {
      if (!token?.trim() || !containerRef.current) return;

      mapboxgl.accessToken = token.trim();

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [31.2357, 30.0444],
        zoom: 11,
        attributionControl: true,
      });

      mapRef.current = map;

      map.on('load', () => {
        map.addSource(HEAT_SOURCE_ID, {
          type: 'geojson',
          data: buildTrafficHeatData(),
        });

        map.addLayer({
          id: HEAT_LAYER_ID,
          type: 'heatmap',
          source: HEAT_SOURCE_ID,
          maxzoom: 18,
          paint: {
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'intensity'],
              0,
              0,
              10,
              1,
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8,
              1,
              14,
              2.5,
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(59, 130, 246, 0)',
              0.25,
              'rgba(56, 189, 248, 0.55)',
              0.5,
              'rgba(168, 85, 247, 0.75)',
              0.75,
              'rgba(236, 72, 153, 0.9)',
              1,
              'rgba(248, 113, 113, 1)',
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8,
              12,
              14,
              28,
            ],
            'heatmap-opacity': 0.85,
          },
        });
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    }, [token]);

    if (!token?.trim()) {
      return (
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-6 text-center text-amber-100/90 ${className}`}
        >
          <p className="text-sm font-medium">Mapbox token missing</p>
          <p className="text-xs text-amber-100/70">
            Add <code className="rounded bg-black/30 px-1">VITE_MAPBOX_ACCESS_TOKEN</code> to{' '}
            <code className="rounded bg-black/30 px-1">.env.local</code> and restart the dev server.
          </p>
        </div>
      );
    }

    return <div ref={containerRef} className={className} />;
  }
);
