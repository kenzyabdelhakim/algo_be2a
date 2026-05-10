import { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Activity, Clock, Route, TrendingUp } from 'lucide-react';
import { fetchDashboardStats } from '../../services/api';

export function Dashboard() {
  const [stats, setStats] = useState<
    Array<{
      label: string;
      value: string;
      icon: typeof Activity;
      color: string;
    }>
  >([
    { label: 'Traffic Density', value: '—', icon: Activity, color: 'from-blue-500 to-cyan-500' },
    { label: 'Avg Travel Time', value: '—', icon: Clock, color: 'from-purple-500 to-pink-500' },
    { label: 'Active Routes', value: '—', icon: Route, color: 'from-green-500 to-emerald-500' },
    { label: 'Efficiency Gain', value: '—', icon: TrendingUp, color: 'from-orange-500 to-red-500' },
  ]);

  useEffect(() => {
    fetchDashboardStats()
      .then((d) => {
        setStats([
          {
            label: 'Traffic Density',
            value: `${d.trafficDensityPercent}%`,
            icon: Activity,
            color: 'from-blue-500 to-cyan-500',
          },
          {
            label: 'Avg Travel Time',
            value: `${d.avgTravelTimeMin} min`,
            icon: Clock,
            color: 'from-purple-500 to-pink-500',
          },
          {
            label: 'Active Routes',
            value: d.activeRoutes.toLocaleString(),
            icon: Route,
            color: 'from-green-500 to-emerald-500',
          },
          {
            label: 'Efficiency Gain',
            value: `+${d.efficiencyGainPercent}%`,
            icon: TrendingUp,
            color: 'from-orange-500 to-red-500',
          },
        ]);
      })
      .catch(() => {
        /* keep placeholders — minimal error surface */
      });
  }, []);

  return (
    <div className="h-full flex gap-6">
      <div className="flex-1 flex flex-col gap-6">
        <GlassCard className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-full h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-white/10 flex items-center justify-center mb-4">
              <div className="text-gray-400">
                <svg className="w-32 h-32 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-lg">Interactive Map View</p>
                <p className="text-sm mt-2">Real-time traffic visualization</p>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg transition-all">
                Zoom In
              </button>
              <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg transition-all">
                Zoom Out
              </button>
              <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg transition-all">
                Layers
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="w-80 space-y-4">
        <h3 className="text-lg mb-4">Live Data</h3>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={index} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-2">{stat.label}</p>
                  <p className="text-3xl">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${stat.color} rounded-full`} style={{ width: '70%' }} />
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
