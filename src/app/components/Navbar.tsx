import { Search, Settings, User } from 'lucide-react';

export function Navbar() {
  return (
    <div className="h-16 border-b border-white/10 bg-[#0a0a1e]/80 backdrop-blur-xl">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter source and destination..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 ml-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-400/30 rounded-xl">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-400">Connected to Python Engine</span>
          </div>

          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>

          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <User className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
