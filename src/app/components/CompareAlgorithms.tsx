import { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { GitCompare, Clock, Activity, Cpu } from 'lucide-react';
import { fetchNodes, compareAlgorithms, Node, CompareResponse } from '../../services/api';

export function CompareAlgorithms() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);

  useEffect(() => {
    fetchNodes().then(setNodes).catch(console.error);
  }, []);

  const handleCompare = async () => {
    if (!source || !destination) {
      setError('Please select both source and destination');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await compareAlgorithms(source, destination);
      setCompareData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare algorithms');
      setCompareData(null);
    } finally {
      setLoading(false);
    }
  };

  const getAlgorithmColor = (name: string) => {
    switch (name) {
      case 'Dijkstra':
        return 'from-blue-500 to-cyan-500';
      case 'A*':
        return 'from-purple-500 to-pink-500';
      case 'Bellman-Ford':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="h-full">
      <GlassCard className="h-full p-6">
        <div className="flex items-center gap-3 mb-6">
          <GitCompare className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl">Algorithm Comparison</h2>
        </div>

        <p className="text-gray-400 mb-6">
          Compare performance metrics of different pathfinding algorithms on the same graph.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Source Node</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-400/50 transition-all"
            >
              <option value="">Select source</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Target Node</label>
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

        <button
          onClick={handleCompare}
          disabled={loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl transition-all shadow-lg shadow-blue-500/20 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Comparing...' : 'Compare Algorithms'}
        </button>

        {compareData && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="grid grid-cols-3 gap-4">
              {compareData.results.map((algo, index) => (
                <GlassCard key={index} className={`p-6 border-blue-400/30`}>
                  <div className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${getAlgorithmColor(algo.algorithm)} bg-opacity-20 mb-4`}>
                    <span>{algo.algorithm}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">Execution Time</p>
                        <p className="text-lg">{algo.executionTime.toFixed(2)}ms</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">Nodes Visited</p>
                        <p className="text-lg">{algo.nodesVisited}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">Path Length</p>
                        <p className="text-lg">{algo.pathLength.toFixed(1)} km</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            <GlassCard className="p-6">
              <h4 className="mb-4">Performance Analysis</h4>
              <div className="space-y-4">
                {compareData.results.map((algo, index) => {
                  const fastest = compareData.results.reduce((min, curr) => 
                    curr.executionTime < min.executionTime ? curr : min
                  );
                  const percentage = (algo.executionTime / fastest.executionTime) * 100;
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">{algo.algorithm}</span>
                        <span className="text-sm text-gray-400">
                          {algo === fastest ? 'Fastest' : `${((percentage - 100)).toFixed(0)}% slower`}
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${getAlgorithmColor(algo.algorithm)}`} 
                          style={{ width: `${Math.min(percentage, 100)}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            <div className="p-4 bg-green-500/10 border border-green-400/30 rounded-xl">
              <p className="text-sm text-green-400">
                Recommendation: {compareData.fastest} algorithm provides the best performance for this route
              </p>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
