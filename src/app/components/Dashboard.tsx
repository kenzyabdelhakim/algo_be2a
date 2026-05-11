import { useEffect, useRef, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Activity, Clock, Route, TrendingUp } from 'lucide-react';
import { fetchDashboardStats } from '../../services/api';
import {
  TrafficHeatMap,
  type TrafficHeatMapHandle,
} from './TrafficHeatMap';

export function Dashboard() {
  const heatMapRef = useRef<TrafficHeatMapHandle>(null);
  const [heatmapOn, setHeatmapOn] = useState(true);
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
            <div className="mb-4 h-96 w-full overflow-hidden rounded-xl border border-white/10">
              <TrafficHeatMap ref={heatMapRef} className="h-full w-full min-h-[24rem]" />
            </div>
            <p className="mb-3 text-sm text-gray-500">
              Traffic density heatmap (Mapbox) · Cairo area · demo points — swap GeoJSON for your API data.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                className="rounded-lg border border-blue-400/30 bg-blue-500/20 px-4 py-2 transition-all hover:bg-blue-500/30"
                onClick={() => heatMapRef.current?.zoomIn()}
              >
                Zoom In
              </button>
              <button
                type="button"
                className="rounded-lg border border-blue-400/30 bg-blue-500/20 px-4 py-2 transition-all hover:bg-blue-500/30"
                onClick={() => heatMapRef.current?.zoomOut()}
              >
                Zoom Out
              </button>
              <button
                type="button"
                className="rounded-lg border border-blue-400/30 bg-blue-500/20 px-4 py-2 transition-all hover:bg-blue-500/30"
                onClick={() => {
                  const visible = heatMapRef.current?.toggleHeatmapVisibility();
                  if (typeof visible === 'boolean') setHeatmapOn(visible);
                }}
              >
                Heatmap: {heatmapOn ? 'On' : 'Off'}
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
