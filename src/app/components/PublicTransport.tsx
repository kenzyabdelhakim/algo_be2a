import { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Bus, Train, Clock, RefreshCw } from 'lucide-react';
import { fetchNodes, fetchTransitRoute, Node, TransitResponse } from '../../services/api';

export function PublicTransport() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeLabel, setRouteLabel] = useState<'best' | 'minTransfers'>('best');
  const [transitData, setTransitData] = useState<TransitResponse | null>(null);

  useEffect(() => {
    fetchNodes().then(setNodes).catch(console.error);
  }, []);

  const runTransit = async (mode: 'time' | 'hops', label: 'best' | 'minTransfers') => {
    if (!from || !to) {
      setError('Please select both starting point and destination');
      return;
    }
    if (from === to) {
      setError('Please choose two different locations');
      return;
    }

    setLoading(true);
    setError(null);
    setRouteLabel(label);

    try {
      const data = await fetchTransitRoute(from, to, mode);
      if (data.status !== 'success') {
        setError(data.message ?? 'Could not compute route');
        setShowRoute(false);
        setTransitData(null);
        return;
      }
      setTransitData(data);
      setShowRoute(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load route');
      setShowRoute(false);
      setTransitData(null);
    } finally {
      setLoading(false);
    }
  };

  const hops = transitData?.path ? Math.max(0, transitData.path.length - 1) : 0;
  const transferCount = Math.max(0, hops - 2);

  return (
    <div className="h-full flex gap-6">
      <div className="flex-1">
        <GlassCard className="h-full p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bus className="w-8 h-8 text-blue-400" />
            <h2 className="text-2xl">Public Transport</h2>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">From</label>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
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
              <label className="block text-sm text-gray-400 mb-2">To</label>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
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
              type="button"
              onClick={() => runTransit('time', 'best')}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && routeLabel === 'best' ? 'Loading...' : 'Find Best Route'}
            </button>
            <button
              type="button"
              onClick={() => runTransit('hops', 'minTransfers')}
              disabled={loading}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && routeLabel === 'minTransfers' ? 'Loading...' : 'Min Transfers'}
            </button>
          </div>

          {showRoute && transitData?.path_names && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <GlassCard className="p-6 border-blue-400/30">
                <h3 className="mb-4">Recommended Route</h3>

                <div className="space-y-4">
                  {transitData.path_names.map((name, index) => {
                    const isFirst = index === 0;
                    const isLast = index === transitData.path_names!.length - 1;
                    return (
                      <div key={`${name}-${index}`} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isFirst
                                ? 'bg-blue-500/20 border border-blue-400/30'
                                : isLast
                                  ? 'bg-green-500/20 border border-green-400/30'
                                  : 'bg-purple-500/20 border border-purple-400/30'
                            }`}
                          >
                            {isFirst ? (
                              <Bus className="w-5 h-5 text-blue-400" />
                            ) : isLast ? (
                              <Train className="w-5 h-5 text-green-400" />
                            ) : (
                              <RefreshCw className="w-5 h-5 text-purple-400" />
                            )}
                          </div>
                          {!isLast && (
                            <div
                              className={`w-0.5 h-12 ${
                                index === 0 ? 'bg-blue-400/30' : 'bg-purple-400/30'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="mb-1">{name}</p>
                          {!isLast && transitData.path_names![index + 1] && (
                            <p className="text-sm text-gray-400">
                              {name} → {transitData.path_names![index + 1]}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Transfers</p>
                      <p className="text-lg">{transferCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-gray-400">Total Time</p>
                      <p className="text-lg">
                        {transitData.total_time_min != null
                          ? `${Math.round(transitData.total_time_min)} min`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="w-96">
        <GlassCard className="h-full p-6">
          <h3 className="mb-4">Transit Map</h3>
          <div className="h-[calc(100%-3rem)] bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-white/10 flex items-center justify-center">
            <div className="text-center">
              <Bus className="w-16 h-16 mx-auto mb-3 text-blue-400" />
              <p className="text-gray-400">Public transport network</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
