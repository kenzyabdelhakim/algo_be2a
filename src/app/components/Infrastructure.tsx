import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Network, DollarSign, Link } from 'lucide-react';
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
        <GlassCard className="h-full p-6">
          <div className="flex items-center gap-3 mb-6">
            <Network className="w-8 h-8 text-purple-400" />
            <h2 className="text-2xl">Infrastructure Optimization (MST)</h2>
          </div>

          <p className="text-gray-400 mb-6">
            Optimize road network using Minimum Spanning Tree algorithms to minimize infrastructure costs while maintaining connectivity.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleOptimize}
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl transition-all shadow-lg shadow-purple-500/20 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Optimizing...' : 'Optimize Network'}
          </button>

          {infrastructureData && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4 border-purple-400/30">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                    <p className="text-sm text-gray-400">Total Cost</p>
                  </div>
                  <p className="text-2xl">{infrastructureData.summary.totalCost} M EGP</p>
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
                            {road.distance} km • Capacity: {road.capacity} veh/h
                          </p>
                        </div>
                        <span className="text-sm text-purple-400">{road.cost} M EGP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                <p className="text-sm text-blue-400">
                  Processed by Python Engine • Kruskal's Algorithm for Strong Connectivity
                </p>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="w-96">
        <GlassCard className="h-full p-6">
          <h3 className="mb-4">Network Graph</h3>
          <div className="h-[calc(100%-3rem)] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-white/10 flex items-center justify-center">
            <div className="text-center">
              <Network className="w-16 h-16 mx-auto mb-3 text-purple-400" />
              <p className="text-gray-400">MST visualization</p>
              <p className="text-sm text-gray-500 mt-2">Minimum spanning tree</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
