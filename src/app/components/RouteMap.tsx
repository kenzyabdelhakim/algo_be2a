import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { PathStep } from '../../services/api';

const LINE_SOURCE = 'route-map-line';
const POINTS_SOURCE = 'route-map-points';
const HOSP_SOURCE = 'route-map-hospitals';

const DEFAULT_CENTER: mapboxgl.LngLatLike = [31.2357, 30.0444];

export interface RouteMapHospitalOverlay {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance?: number;
}

export interface RouteMapProps {
  path: PathStep[];
  className?: string;
  /** Optional hospital markers (Emergency Mode). */
  hospitals?: RouteMapHospitalOverlay[];
  selectedHospitalId?: string;
  /** Polyline color (hex). */
  routeColor?: string;
  /** Color for intermediate path vertices when kind is waypoint. */
  intermediatePointColor?: string;
}

/**
 * Mapbox GL route visualization (dark style). Matches Dashboard Mapbox usage.
 * Falls back to an inline notice when `VITE_MAPBOX_ACCESS_TOKEN` is unset.
 */
export function RouteMap({
  path,
  className = '',
  hospitals = [],
  selectedHospitalId,
  routeColor = '#818cf8',
  intermediatePointColor = '#60a5fa',
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [styleReady, setStyleReady] = useState(false);

  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

  useEffect(() => {
    if (!token?.trim() || !containerRef.current) return;

    mapboxgl.accessToken = token.trim();

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: DEFAULT_CENTER,
      zoom: 11,
      attributionControl: true,
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource(LINE_SOURCE, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        },
      });

      map.addLayer({
        id: 'route-map-line-layer',
        type: 'line',
        source: LINE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': routeColor,
          'line-width': 4,
          'line-opacity': 0.92,
        },
      });

      map.addSource(POINTS_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'route-map-points-layer',
        type: 'circle',
        source: POINTS_SOURCE,
        paint: {
          'circle-radius': [
            'match',
            ['get', 'kind'],
            'origin',
            9,
            'destination',
            9,
            5,
          ],
          'circle-color': ['get', 'fill'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addSource(HOSP_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'route-map-hospitals-layer',
        type: 'circle',
        source: HOSP_SOURCE,
        paint: {
          'circle-radius': [
            'case',
            ['==', ['get', 'selected'], true],
            11,
            7,
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'selected'], true],
            '#ef4444',
            '#f87171',
          ],
          'circle-opacity': [
            'case',
            ['==', ['get', 'selected'], true],
            1,
            0.55,
          ],
          'circle-stroke-width': [
            'case',
            ['==', ['get', 'selected'], true],
            3,
            2,
          ],
          'circle-stroke-color': '#ffffff',
        },
      });

      const showPopup = (
        lngLat: mapboxgl.LngLatLike,
        html: string
      ) => {
        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: '280px' })
          .setLngLat(lngLat)
          .setHTML(html)
          .addTo(map);
      };

      ['route-map-points-layer', 'route-map-hospitals-layer'].forEach((layerId) => {
        map.on('click', layerId, (e) => {
          const f = e.features?.[0];
          if (!f?.geometry || f.geometry.type !== 'Point') return;
          const coords = f.geometry.coordinates as [number, number];
          const name =
            (f.properties?.name as string) ??
            (f.properties?.title as string) ??
            'Location';
          const dist = f.properties?.distanceKm;
          const extra =
            layerId === 'route-map-hospitals-layer' &&
            dist !== undefined &&
            dist !== null &&
            `${dist}` !== ''
              ? `<div style="font-size:12px;opacity:0.85;margin-top:4px">${Number(dist).toFixed(2)} km</div>`
              : '';
          showPopup(coords, `<strong>${name}</strong>${extra}`);
        });

        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });

      setStyleReady(true);
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
      setStyleReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map created once per token/container
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!styleReady || !map?.getLayer('route-map-line-layer')) return;

    map.setPaintProperty('route-map-line-layer', 'line-color', routeColor);

    const steps = path.filter(
      (s): s is PathStep & { lat: number; lon: number } =>
        typeof s.lat === 'number' && typeof s.lon === 'number'
    );

    const coords = steps.map((s) => [s.lon, s.lat] as [number, number]);

    const lineSource = map.getSource(LINE_SOURCE) as mapboxgl.GeoJSONSource;
    lineSource.setData({
      type: 'Feature',
      properties: {},
      geometry:
        coords.length >= 2
          ? { type: 'LineString', coordinates: coords }
          : { type: 'LineString', coordinates: [] },
    });

    const pointFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];
    steps.forEach((step, i) => {
      let kind: string;
      let fill: string;
      if (i === 0) {
        kind = 'origin';
        fill = '#4ade80';
      } else if (i === steps.length - 1) {
        kind = 'destination';
        fill = '#f87171';
      } else {
        kind = 'waypoint';
        fill = intermediatePointColor;
      }
      pointFeatures.push({
        type: 'Feature',
        properties: {
          kind,
          fill,
          name: step.nodeName,
        },
        geometry: {
          type: 'Point',
          coordinates: [step.lon, step.lat],
        },
      });
    });

    const pointsSource = map.getSource(POINTS_SOURCE) as mapboxgl.GeoJSONSource;
    pointsSource.setData({
      type: 'FeatureCollection',
      features: pointFeatures,
    });

    const hospFeatures: GeoJSON.Feature<GeoJSON.Point>[] = hospitals.map((h) => ({
      type: 'Feature',
      properties: {
        name: h.name,
        selected: h.id === selectedHospitalId,
        distanceKm: h.distance,
      },
      geometry: {
        type: 'Point',
        coordinates: [h.lon, h.lat],
      },
    }));

    const hospSource = map.getSource(HOSP_SOURCE) as mapboxgl.GeoJSONSource;
    hospSource.setData({
      type: 'FeatureCollection',
      features: hospFeatures,
    });

    const bounds = new mapboxgl.LngLatBounds();

    coords.forEach((c) => bounds.extend(c));
    hospitals.forEach((h) => bounds.extend([h.lon, h.lat]));

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 500 });
    } else if (steps.length === 1) {
      map.easeTo({
        center: coords[0],
        zoom: 13,
        duration: 400,
      });
    } else {
      map.easeTo({ center: DEFAULT_CENTER, zoom: 11, duration: 400 });
    }
  }, [
    styleReady,
    path,
    hospitals,
    selectedHospitalId,
    routeColor,
    intermediatePointColor,
  ]);

  if (!token?.trim()) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-amber-500/10 p-4 text-center text-sm text-amber-100/90 ${className}`}
      >
        <p className="font-medium">Mapbox token missing</p>
        <p className="text-xs text-amber-100/70">
          Set <code className="rounded bg-black/30 px-1">VITE_MAPBOX_ACCESS_TOKEN</code> in{' '}
          <code className="rounded bg-black/30 px-1">.env.local</code>
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ background: '#1a1a2e', minHeight: '120px' }}
    />
  );
}
