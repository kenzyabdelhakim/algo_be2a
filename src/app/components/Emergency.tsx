import { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { AlertTriangle, Phone, MapPin, Clock, Activity, Loader2 } from 'lucide-react';
import { fetchNodes, findNearestHospitalWithCoordinates, fetchNearbyHospitals, Node, EmergencyResponse, Hospital } from '../../services/api';
import { RouteMap } from './RouteMap';

export function Emergency() {
  const [location, setLocation] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emergencyData, setEmergencyData] = useState<EmergencyResponse | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    fetchNodes().then(setNodes).catch(console.error);
  }, []);

  const handleActivateEmergency = async () => {
    if (!location) {
      setError('Please select your current location');
      return;
    }

    setLoading(true);
    setLoadingHospitals(true);
    setError(null);
    setHospitals([]);
    setEmergencyData(null);
    
    try {
      // Get selected location coordinates
      const selectedNode = nodes.find(n => n.id === location);
      if (!selectedNode) {
        throw new Error('Selected location not found');
      }

      const { lat, lon } = selectedNode.coordinates;

      // Fetch nearby hospitals from Overpass API
      const nearbyHospitals = await fetchNearbyHospitals(lat, lon, 5);
      
      if (nearbyHospitals.length === 0) {
        setError('No hospitals found within 5km radius. Try a different location.');
        setLoadingHospitals(false);
        setLoading(false);
        return;
      }

      setHospitals(nearbyHospitals);
      setLoadingHospitals(false);

      // Find fastest route using A* algorithm
      const data = await findNearestHospitalWithCoordinates(location, nearbyHospitals);
      setEmergencyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find nearest hospital');
      setEmergencyData(null);
      setHospitals([]);
    } finally {
      setLoading(false);
      setLoadingHospitals(false);
    }
  };

  return (
    <div className="h-full flex gap-6">
      <div className="flex-1">
        <GlassCard className="h-full p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <h2 className="text-2xl">Emergency Mode</h2>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Current Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-red-400/50 transition-all"
            >
              <option value="">Select your location</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.id})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {loadingHospitals && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl text-blue-400 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching for nearby hospitals via OpenStreetMap...
            </div>
          )}

          {hospitals.length > 0 && !emergencyData && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-400/30 rounded-xl text-green-400 text-sm">
              Found {hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''} within 5km radius
            </div>
          )}

          <div className="mb-8">
            <button
              onClick={handleActivateEmergency}
              disabled={loading}
              className={`w-full px-8 py-6 rounded-2xl transition-all duration-300 ${
                emergencyData
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-red-500/50 animate-pulse'
                  : 'bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 border border-red-400/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-center gap-3">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
                <span className="text-xl">
                  {loading ? 'Finding Hospital...' : emergencyData ? 'Emergency Mode Active' : 'Activate Emergency'}
                </span>
              </div>
            </button>
          </div>

          {emergencyData && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <GlassCard className="p-6 border-red-400/30">
                <h3 className="mb-4 text-red-400">Emergency Information</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Nearest Hospital</p>
                      <p className="text-lg">{emergencyData.nearestHospital.name}</p>
                      <p className="text-sm text-gray-400">{emergencyData.summary.totalDistance} km away</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-red-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Response Time</p>
                      <p className="text-lg">{emergencyData.summary.totalTime} minutes</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-red-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Emergency Contact</p>
                      <p className="text-lg">+1 (555) 123-4567</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-red-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Route Status</p>
                      <p className="text-lg text-green-400">Clear path established</p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <h4 className="mb-3">Route to Hospital</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {emergencyData.path.map((step, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${step.isOrigin ? 'text-green-400' : step.isDestination ? 'text-red-400' : 'text-yellow-400'}`} />
                          <span>{step.nodeName}</span>
                        </div>
                        {step.cumulativeTime !== undefined && (
                          <div className="text-right text-sm text-gray-400">
                            <div>{step.segmentTime?.toFixed(1)} min</div>
                            {step.congestion !== undefined && (
                              <div className="text-xs">Congestion: {step.congestion}%</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {emergencyData.alternativeHospitals && emergencyData.alternativeHospitals.length > 0 && (
                <GlassCard className="p-4">
                  <h4 className="mb-3">Alternative Hospitals</h4>
                  <div className="space-y-2">
                    {emergencyData.alternativeHospitals.map((hospital, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span>{hospital.name}</span>
                          <span className="text-sm text-gray-400">{hospital.travelTime} min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              <div className="p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-xl">
                <p className="text-sm text-yellow-400">
                  Traffic lights along the route have been synchronized for priority passage
                </p>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="w-96">
        <GlassCard className="h-full p-6">
          <h3 className="mb-4">Emergency Route</h3>
          <div className="h-[calc(100%-3rem)] bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl border border-red-400/20 overflow-hidden">
            {emergencyData && emergencyData.path.length > 0 ? (
              <EmergencyMap 
                path={emergencyData.path} 
                hospitals={hospitals}
                selectedHospital={emergencyData.nearestHospital}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-3 text-red-400" />
                  <p className="text-gray-400">Emergency route visualization</p>
                  {loadingHospitals && (
                    <p className="text-sm text-blue-400 mt-2">Loading hospitals...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// Emergency Map Component with hospital markers
function EmergencyMap({ 
  path, 
  hospitals, 
  selectedHospital 
}: { 
  path: any[]; 
  hospitals: Hospital[];
  selectedHospital: { id: string; name: string; lat?: number; lon?: number };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);

  const validSteps = path.filter(
    (s): s is any & { lat: number; lon: number } =>
      typeof s.lat === 'number' && typeof s.lon === 'number'
  );

  useEffect(() => {
    if (!containerRef.current) return;

    import('leaflet').then((L) => {
      // Fix default icon asset paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current && containerRef.current) {
        const initialCenter: [number, number] =
          validSteps.length > 0
            ? [validSteps[0].lat, validSteps[0].lon]
            : [30.0444, 31.2357];

        mapRef.current = L.map(containerRef.current, {
          center: initialCenter,
          zoom: 12,
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

      if (validSteps.length < 1) return;

      // Draw all hospitals as markers
      hospitals.forEach((hospital) => {
        const isSelected = hospital.id === selectedHospital.id;
        
        L.circleMarker([hospital.lat, hospital.lon], {
          radius: isSelected ? 10 : 7,
          fillColor: isSelected ? '#ef4444' : '#f87171',
          color: '#fff',
          weight: isSelected ? 3 : 2,
          fillOpacity: isSelected ? 1 : 0.6,
        })
          .bindTooltip(
            `${hospital.name}${isSelected ? ' (Selected)' : ''}<br/>${hospital.distance?.toFixed(2)} km away`,
            { permanent: false, direction: 'top' }
          )
          .addTo(map);
      });

      // Draw route polyline
      if (validSteps.length >= 2) {
        const latLngs: [number, number][] = validSteps.map((s) => [s.lat, s.lon]);

        L.polyline(latLngs, {
          color: '#ef4444',
          weight: 4,
          opacity: 0.9,
        }).addTo(map);

        // Source marker (green)
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

        // Intermediate waypoints
        validSteps.slice(1, -1).forEach((step) => {
          L.circleMarker([step.lat, step.lon], {
            radius: 5,
            fillColor: '#fbbf24',
            color: '#fff',
            weight: 1.5,
            fillOpacity: 0.85,
          })
            .bindTooltip(step.nodeName, { permanent: false, direction: 'top' })
            .addTo(map);
        });

        // Fit map to show all markers
        const allPoints: [number, number][] = [
          ...latLngs,
          ...hospitals.map(h => [h.lat, h.lon] as [number, number])
        ];
        map.fitBounds(L.latLngBounds(allPoints), { padding: [24, 24] });
      }
    });
  }, [path, hospitals, selectedHospital, validSteps]);

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

// Add missing import
import { useRef } from 'react';
