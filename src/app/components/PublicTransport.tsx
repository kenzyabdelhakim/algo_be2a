import { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { Bus, Train, Clock, RefreshCw, Loader2, DollarSign, TrendingUp, Wrench } from 'lucide-react';
import { 
  fetchNodes, 
  fetchTransitRoute, 
  getBusAllocation, 
  getRoadMaintenance,
  getTransitAnalysis,
  Node, 
  TransitResponse,
  BusAllocationResponse,
  RoadMaintenanceResponse,
  TransitAnalysisResponse
} from '../../services/api';

type TabType = 'routing' | 'busAllocation' | 'maintenance';

export function PublicTransport() {
  const [activeTab, setActiveTab] = useState<TabType>('routing');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeLabel, setRouteLabel] = useState<'best' | 'minTransfers'>('best');
  const [transitData, setTransitData] = useState<TransitResponse | null>(null);
  
  // Bus allocation state
  const [busAllocationData, setBusAllocationData] = useState<BusAllocationResponse | null>(null);
  const [fleet, setFleet] = useState(214);
  const [minPerRoute, setMinPerRoute] = useState(5);
  const [loadingBusAllocation, setLoadingBusAllocation] = useState(false);
  
  // Road maintenance state
  const [maintenanceData, setMaintenanceData] = useState<RoadMaintenanceResponse | null>(null);
  const [budget, setBudget] = useState(300);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  
  // Transit analysis state
  const [analysisData, setAnalysisData] = useState<TransitAnalysisResponse | null>(null);

  useEffect(() => {
    fetchNodes().then(setNodes).catch(console.error);
    // Load transit analysis on mount
    getTransitAnalysis().then(setAnalysisData).catch(console.error);
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

  const runBusAllocation = async () => {
    setLoadingBusAllocation(true);
    setError(null);
    
    try {
      const data = await getBusAllocation(fleet, minPerRoute);
      setBusAllocationData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize bus allocation');
      setBusAllocationData(null);
    } finally {
      setLoadingBusAllocation(false);
    }
  };

  const runMaintenance = async () => {
    setLoadingMaintenance(true);
    setError(null);
    
    try {
      const data = await getRoadMaintenance(budget);
      setMaintenanceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize road maintenance');
      setMaintenanceData(null);
    } finally {
      setLoadingMaintenance(false);
    }
  };

  const hops = transitData?.path ? Math.max(0, transitData.path.length - 1) : 0;
  const transferCount = Math.max(0, hops - 2);

  return (
    <div className="h-full flex gap-6">
      <div className="flex-1">
        <GlassCard className="h-full p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <Bus className="w-8 h-8 text-blue-400" />
            <h2 className="text-2xl">Public Transport Optimization</h2>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab('routing')}
              className={`px-4 py-2 transition-all ${
                activeTab === 'routing'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Route Planning
            </button>
            <button
              onClick={() => setActiveTab('busAllocation')}
              className={`px-4 py-2 transition-all ${
                activeTab === 'busAllocation'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Bus Allocation (DP)
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2 transition-all ${
                activeTab === 'maintenance'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Road Maintenance (DP)
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Route Planning Tab */}
          {activeTab === 'routing' && (
            <div className="space-y-4">
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => runTransit('time', 'best')}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && routeLabel === 'best' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading && routeLabel === 'best' ? 'Loading...' : 'Find Best Route'}
                </button>
                <button
                  type="button"
                  onClick={() => runTransit('hops', 'minTransfers')}
                  disabled={loading}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && routeLabel === 'minTransfers' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading && routeLabel === 'minTransfers' ? 'Loading...' : 'Min Transfers'}
                </button>
              </div>

              {showRoute && transitData?.path_names && (
                <GlassCard className="p-6 border-blue-400/30 animate-in fade-in duration-500">
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
              )}
            </div>
          )}

          {/* Bus Allocation Tab */}
          {activeTab === 'busAllocation' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Dynamic Programming (Resource Allocation Knapsack) to optimize bus fleet distribution across routes for maximum passenger throughput.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Total Fleet</label>
                  <input
                    type="number"
                    value={fleet}
                    onChange={(e) => setFleet(parseInt(e.target.value) || 214)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Min Per Route</label>
                  <input
                    type="number"
                    value={minPerRoute}
                    onChange={(e) => setMinPerRoute(parseInt(e.target.value) || 5)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-400/50 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={runBusAllocation}
                disabled={loadingBusAllocation}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingBusAllocation && <Loader2 className="w-5 h-5 animate-spin" />}
                {loadingBusAllocation ? 'Optimizing...' : 'Optimize Bus Allocation'}
              </button>

              {busAllocationData && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <GlassCard className="p-4 border-blue-400/30">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        <p className="text-sm text-gray-400">Improvement</p>
                      </div>
                      <p className="text-2xl">{busAllocationData.summary.improvement.toLocaleString()} pax/day</p>
                      <p className="text-sm text-green-400 mt-1">
                        +{busAllocationData.summary.improvementPercent}%
                      </p>
                    </GlassCard>

                    <GlassCard className="p-4 border-blue-400/30">
                      <div className="flex items-center gap-3 mb-2">
                        <Bus className="w-5 h-5 text-blue-400" />
                        <p className="text-sm text-gray-400">Optimized Throughput</p>
                      </div>
                      <p className="text-2xl">{busAllocationData.summary.optimizedTotalThroughput.toLocaleString()}</p>
                      <p className="text-sm text-gray-400 mt-1">passengers/day</p>
                    </GlassCard>
                  </div>

                  <GlassCard className="p-6">
                    <h4 className="mb-4">Route Allocations</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {busAllocationData.routes.map((route) => (
                        <div key={route.routeId} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-medium">{route.routeId}: {route.stopNames.join(' → ')}</p>
                              <p className="text-xs text-gray-400">
                                Demand: {route.dailyDemand.toLocaleString()} pax/day • RT: {route.roundTripMin} min
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-gray-400">Current: {route.currentBuses} buses</p>
                              <p className="text-gray-400">TP: {route.currentThroughput.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-blue-400">Optimized: {route.optimizedBuses} buses</p>
                              <p className="text-blue-400">TP: {route.optimizedThroughput.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className={route.throughputChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                                Change: {route.throughputChange >= 0 ? '+' : ''}{route.throughputChange.toLocaleString()}
                              </p>
                              <p className="text-gray-400">Headway: {route.optimizedHeadway.toFixed(1)}m</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                    <p className="text-sm text-blue-400">
                      ✓ DP Resource Allocation Knapsack • O(R × B × K) complexity
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Road Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Dynamic Programming (0-1 Knapsack) to select roads for repair within budget, maximizing total travel-time savings.
              </p>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Budget (Million EGP)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value) || 300)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-400/50 transition-all"
                />
              </div>

              <button
                onClick={runMaintenance}
                disabled={loadingMaintenance}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingMaintenance && <Loader2 className="w-5 h-5 animate-spin" />}
                {loadingMaintenance ? 'Optimizing...' : 'Optimize Road Maintenance'}
              </button>

              {maintenanceData && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <GlassCard className="p-4 border-blue-400/30">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-blue-400" />
                        <p className="text-sm text-gray-400">Total Cost</p>
                      </div>
                      <p className="text-2xl">{maintenanceData.summary.totalCost} M EGP</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Remaining: {maintenanceData.summary.remainingBudget} M EGP
                      </p>
                    </GlassCard>

                    <GlassCard className="p-4 border-blue-400/30">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <p className="text-sm text-gray-400">Time Saved</p>
                      </div>
                      <p className="text-2xl">{maintenanceData.summary.totalTimeSaved.toFixed(1)} min</p>
                      <p className="text-sm text-green-400 mt-1">
                        {maintenanceData.summary.numberOfRoads} roads selected
                      </p>
                    </GlassCard>
                  </div>

                  <GlassCard className="p-6">
                    <h4 className="mb-4">Selected Roads for Repair</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {maintenanceData.selectedRoads.map((road, index) => (
                        <div key={index} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">{road.fromName} → {road.toName}</p>
                              <p className="text-xs text-gray-400">
                                Condition: {road.condition}/10 • Distance: {road.distanceKm} km
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-blue-400">{road.repairCost} M EGP</p>
                              <p className="text-xs text-green-400">Saves {road.timeSavedMin.toFixed(1)} min</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                    <p className="text-sm text-blue-400">
                      ✓ DP 0-1 Knapsack • O(N × W) complexity • {maintenanceData.summary.totalCandidates} candidates evaluated
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>

      <div className="w-96">
        <GlassCard className="h-full p-6">
          <h3 className="mb-4">Transit Network</h3>
          <div className="h-[calc(100%-3rem)] overflow-y-auto space-y-4">
            {analysisData && (
              <>
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-400/30">
                  <h4 className="text-sm font-medium mb-3">System Overview</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bus Routes</span>
                      <span>{analysisData.summary.numberOfBusRoutes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Metro Lines</span>
                      <span>{analysisData.summary.numberOfMetroLines}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Buses</span>
                      <span>{analysisData.summary.totalBuses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Daily Passengers</span>
                      <span>{(analysisData.summary.totalMetroPassengers + analysisData.summary.totalBusDemand).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-400/30">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Train className="w-4 h-4" />
                    Metro Lines
                  </h4>
                  <div className="space-y-2">
                    {analysisData.metroLines.map((line) => (
                      <div key={line.lineId} className="text-xs">
                        <p className="font-medium">{line.name}</p>
                        <p className="text-gray-400">{line.dailyPassengers.toLocaleString()} pax/day</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-400/30">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Maintenance Opportunities
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Candidates</span>
                      <span>{analysisData.maintenance.totalCandidates}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Potential Cost</span>
                      <span>{analysisData.maintenance.totalPotentialCost} M EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time Savings</span>
                      <span>{analysisData.maintenance.totalPotentialTimeSaved.toFixed(0)} min</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
