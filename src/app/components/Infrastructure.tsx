import { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { Network, DollarSign, Link, Loader2 } from 'lucide-react';
import { getInfrastructurePlan, InfrastructureResponse } from '../../services/api';

export function Infrastructure() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infrastructureData, setInfrastructureData] = useState<InfrastructureResponse | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getInfrastructurePlan();
      setInfrastructureData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize network');
      setInfrastructureData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex gap-6">
      <div className="flex-1">
        <GlassCard className="h-full p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <Network className="w-8 h-8 text-purple-400" />
            <h2 className="text-2xl">Infrastructure Optimization (MST)</h2>
          </div>

          <p className="text-gray-400 mb-6">
            Optimize road network using Kruskal's Minimum Spanning Tree algorithm to minimize infrastructure costs while achieving strong connectivity.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleOptimize}
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl transition-all shadow-lg shadow-purple-500/20 mb-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Optimizing Network...' : 'Optimize Network'}
          </button>

          {infrastructureData && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4 border-purple-400/30">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                    <p className="text-sm text-gray-400">Total Cost</p>
                  </div>
                  <p className="text-2xl">{infrastructureData.summary.totalCost.toLocaleString()} M EGP</p>
                  <p className="text-sm text-green-400 mt-1">Optimized for strong connectivity</p>
                </GlassCard>

                <GlassCard className="p-4 border-purple-400/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Link className="w-5 h-5 text-purple-400" />
                    <p className="text-sm text-gray-400">Selected Roads</p>
                  </div>
                  <p className="text-2xl">{infrastructureData.summary.numberOfRoads}</p>
                  <p className="text-sm text-gray-400 mt-1">New roads to build</p>
                </GlassCard>
              </div>

              <GlassCard className="p-6">
                <h4 className="mb-4">Optimization Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span>Algorithm Used</span>
                    <span className="text-purple-400">{infrastructureData.algorithm}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span>Active Nodes</span>
                    <span className="text-purple-400">{infrastructureData.summary.activeNodes}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span>Total Edges</span>
                    <span className="text-purple-400">{infrastructureData.summary.totalEdges}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span>Strongly Connected</span>
                    <span className={infrastructureData.summary.isStronglyConnected ? 'text-green-400' : 'text-yellow-400'}>
                      {infrastructureData.summary.isStronglyConnected ? 'Yes' : 'Partial'}
                    </span>
                  </div>
                  {infrastructureData.summary.numberOfSCCs && (
                    <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                      <span>Connected Components</span>
                      <span className="text-purple-400">{infrastructureData.summary.numberOfSCCs}</span>
                    </div>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h4 className="mb-4">Selected Roads to Build</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {infrastructureData.selectedRoads.map((road, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{road.fromName} → {road.toName}</p>
                          <p className="text-xs text-gray-400">
                            {road.distance} km • Capacity: {road.capacity.toLocaleString()} veh/h
                          </p>
                        </div>
                        <span className="text-sm text-purple-400">{road.cost.toLocaleString()} M EGP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                <p className="text-sm text-blue-400">
                  ✓ Processed by Python Engine • Kruskal's Algorithm for Strong Connectivity
                </p>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="w-96">
        <GlassCard className="h-full p-6">
          <h3 className="mb-4">Network Visualization</h3>
          <div className="h-[calc(100%-3rem)] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-white/10 overflow-hidden">
            {infrastructureData && infrastructureData.selectedRoads.length > 0 ? (
              <InfrastructureMap data={infrastructureData} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Network className="w-16 h-16 mx-auto mb-3 text-purple-400" />
                  <p className="text-gray-400">MST visualization</p>
                  <p className="text-sm text-gray-500 mt-2">Click "Optimize Network" to see results</p>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// Infrastructure Map Component
function InfrastructureMap({ data }: { data: InfrastructureResponse }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    import('leaflet').then((L) => {
      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current && containerRef.current) {
        mapRef.current = L.map(containerRef.current, {
          center: [30.0444, 31.2357], // Cairo
          zoom: 11,
          zoomControl: true,
          attributionControl: false,
        });

        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          { subdomains: 'abcd', maxZoom: 19 }
        ).addTo(mapRef.current);
      }

      const map = mapRef.current!;

      // Remove previous layers
      map.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
      });

      const allPoints: [number, number][] = [];

      // Draw selected roads (new roads to build)
      data.selectedRoads.forEach((road) => {
        if (road.fromLat && road.fromLon && road.toLat && road.toLon) {
          const from: [number, number] = [road.fromLat, road.fromLon];
          const to: [number, number] = [road.toLat, road.toLon];
          
          allPoints.push(from, to);

          // Draw road as purple line
          L.polyline([from, to], {
            color: '#a855f7',
            weight: 3,
            opacity: 0.8,
            dashArray: '10, 5', // Dashed line for new roads
          })
            .bindTooltip(
              `${road.fromName} → ${road.toName}<br/>Cost: ${road.cost} M EGP<br/>Distance: ${road.distance} km`,
              { permanent: false }
            )
            .addTo(map);

          // Add endpoint markers
          L.circleMarker(from, {
            radius: 6,
            fillColor: '#c084fc',
            color: '#fff',
            weight: 2,
            fillOpacity: 0.9,
          })
            .bindTooltip(road.fromName, { permanent: false })
            .addTo(map);

          L.circleMarker(to, {
            radius: 6,
            fillColor: '#c084fc',
            color: '#fff',
            weight: 2,
            fillOpacity: 0.9,
          })
            .bindTooltip(road.toName, { permanent: false })
            .addTo(map);
        }
      });

      // Mark hospitals with red markers
      if (data.hospitals) {
        data.hospitals.forEach((hospital) => {
          const pos: [number, number] = [hospital.lat, hospital.lon];
          allPoints.push(pos);

          L.circleMarker(pos, {
            radius: 8,
            fillColor: '#ef4444',
            color: '#fff',
            weight: 2,
            fillOpacity: 1,
          })
            .bindTooltip(`🏥 ${hospital.name}`, { permanent: false })
            .addTo(map);
        });
      }

      // Mark critical facilities with blue markers
      if (data.facilities) {
        data.facilities.forEach((facility) => {
          const pos: [number, number] = [facility.lat, facility.lon];
          allPoints.push(pos);

          L.circleMarker(pos, {
            radius: 7,
            fillColor: '#3b82f6',
            color: '#fff',
            weight: 2,
            fillOpacity: 0.9,
          })
            .bindTooltip(`📍 ${facility.name}`, { permanent: false })
            .addTo(map);
        });
      }

      // Fit map to show all points
      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [24, 24] });
      }
    });
  }, [data]);

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
      className="w-full h-full"
      style={{ background: '#1a1a2e' }}
    />
  );
}
