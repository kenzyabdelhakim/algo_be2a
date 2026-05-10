import { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { AlertTriangle, Phone, MapPin, Clock, Activity } from 'lucide-react';
import { fetchNodes, findNearestHospital, Node, EmergencyResponse } from '../../services/api';

export function Emergency() {
  const [location, setLocation] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emergencyData, setEmergencyData] = useState<EmergencyResponse | null>(null);

  useEffect(() => {
    fetchNodes().then(setNodes).catch(console.error);
  }, []);

  const handleActivateEmergency = async () => {
    if (!location) {
      setError('Please select your current location');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await findNearestHospital(location);
      setEmergencyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find nearest hospital');
      setEmergencyData(null);
    } finally {
      setLoading(false);
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
                <AlertTriangle className="w-6 h-6" />
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
                <div className="space-y-2">
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

              {emergencyData.alternativeHospitals.length > 0 && (
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
          <div className="h-[calc(100%-3rem)] bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl border border-red-400/20 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-3 text-red-400" />
              <p className="text-gray-400">Emergency route visualization</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
