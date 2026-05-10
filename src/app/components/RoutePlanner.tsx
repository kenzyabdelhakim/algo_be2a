import { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Navigation, Clock, MapPin, Zap } from 'lucide-react';
import {
  fetchNodes,
  calculateDijkstraRoute,
  compareAlgorithms,
  Node,
  DijkstraResponse,
} from '../../services/api';
import { RouteMap } from './RouteMap';

export function RoutePlanner() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<DijkstraResponse | null>(null);
  const [compareHint, setCompareHint] = useState<string | null>(null);

  useEffect(() => {
    fetchNodes().then(setNodes).catch(console.error);
  }, []);

  const handleFindRoute = async () => {
    if (!source || !destination) {
      setError('Please select both source and destination');
      return;
    }

    setLoading(true);
    setError(null);
    setCompareHint(null);

    try {
      const data = await calculateDijkstraRoute(source, destination);
      setRouteData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate route');
      setRouteData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTryAlternative = async () => {
    if (!source || !destination) {
      setError('Please select both source and destination');
      return;
    }

    setLoading(true);
    setError(null);
    setCompareHint(null);

    try {
      const data = await compareAlgorithms(source, destination);
      setCompareHint(
        `${data.fastest} had the lowest execution time for this route.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare algorithms');
      setCompareHint(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex gap-6">
      <div className="flex-1">
        <GlassCard className="h-full p-6">
          <h2 className="text-2xl mb-6">Route Planning</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-400/50 transition-all"
              >
                <option value="">Select starting point</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({node.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Destination</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-400/50 transition-all"
              >
                <option value="">Select destination</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({node.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 mb-6">
            <button
              onClick={handleFindRoute}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Calculating...' : 'Find Best Route'}
            </button>
            <button
              type="button"
              onClick={handleTryAlternative}
              disabled={loading}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Try Alternative
            </button>
          </div>

          {compareHint && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl text-blue-300 text-sm">
              {compareHint}
            </div>
          )}

          {routeData && (
            <div className="space-y-3 animate-in fade-in duration-500">
              <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Estimated Time</p>
                    <p className="text-xl">{routeData.summary.estimatedTime} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Navigation className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Distance</p>
                    <p className="text-xl">{routeData.summary.totalDistance} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Algorithm Used</p>
                    <p className="text-xl">{routeData.algorithm}</p>
                  </div>
                </div>
              </div>

              <GlassCard className="p-4">
                <h4 className="mb-3">Route Details</h4>
                <div className="space-y-2">
                  {routeData.path.map((step, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${step.isOrigin ? 'text-green-400' : step.isDestination ? 'text-red-400' : 'text-blue-400'}`} />
                          <span>{step.nodeName}</span>
                        </div>
                        {step.cumulativeDistance !== undefined && (
                          <span className="text-sm text-gray-400">
                            {step.segmentDistance?.toFixed(1)} km • {step.cumulativeDistance.toFixed(1)} km total
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="w-96">
        <GlassCard className="h-full p-6">
          <h3 className="mb-4">Map Preview</h3>
          <div className="h-[calc(100%-3rem)] rounded-xl border border-white/10 overflow-hidden">
            {routeData && routeData.path.some((s) => s.lat && s.lon) ? (
              <RouteMap
                path={routeData.path}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                <p className="text-gray-400">Route visualization</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
