# Quick Reference Guide

## Running the Application

### Start Backend:
```bash
cd algo_be2a-main/Algorithmss/Algorithms
python api_server.py
```
**URL**: http://localhost:5000

### Start Frontend:
```bash
cd algo_be2a-main
npm run dev
```
**URL**: http://localhost:5173

---

## Features Overview

### 1. Dashboard
- Real-time traffic statistics
- Active routes count
- Average travel time
- Efficiency metrics

### 2. Route Planner
- Dijkstra's shortest path
- Source/destination selection
- Step-by-step directions
- Distance and time estimates

### 3. Emergency Mode
- A* algorithm to nearest hospital
- Overpass API integration
- Real hospitals from OpenStreetMap
- Interactive map with route
- Alternative hospitals

### 4. Infrastructure Planning
- **Algorithm**: Kruskal's MST
- **Purpose**: Strong connectivity
- **Input**: None (uses existing graph)
- **Output**: Selected roads, total cost
- **Visualization**: Map with new roads

### 5. Public Transport - Route Planning
- **Algorithm**: Memoized Dijkstra (DP-3)
- **Purpose**: Optimal route finding
- **Input**: Source, destination
- **Output**: Route with transfers and time
- **Modes**: Time-optimized, Hop-optimized

### 6. Public Transport - Bus Allocation
- **Algorithm**: DP Resource Knapsack (DP-1)
- **Purpose**: Maximize passenger throughput
- **Input**: Fleet size, min per route
- **Output**: Optimal bus distribution
- **Metrics**: Throughput improvement, headway

### 7. Public Transport - Road Maintenance
- **Algorithm**: DP 0-1 Knapsack (DP-2)
- **Purpose**: Maximize time savings
- **Input**: Budget (Million EGP)
- **Output**: Selected roads for repair
- **Metrics**: Time saved, cost used

### 8. Compare Algorithms
- Dijkstra vs A* vs Bellman-Ford
- Execution time comparison
- Path length comparison
- Performance metrics

---

## API Endpoints

### Core Endpoints:
```
GET  /api/health                    - Health check
GET  /api/nodes                     - Get all nodes
GET  /api/dashboard                 - Dashboard stats
```

### Routing Endpoints:
```
POST /api/dijkstra                  - Dijkstra routing
POST /api/emergency                 - A* emergency routing
POST /api/emergency-dynamic         - A* with Overpass API
POST /api/compare                   - Compare algorithms
```

### Optimization Endpoints:
```
GET  /api/infrastructure            - MST infrastructure
POST /api/transit                   - Route planning
POST /api/transit/bus-allocation    - Bus fleet optimization
POST /api/transit/road-maintenance  - Road maintenance
GET  /api/transit/analysis          - Transit overview
```

---

## Backend Classes

### CairoTransportSystem
**File**: `cairo_transport_system.py`  
**Purpose**: Base graph and data management  
**Methods**:
- `get_node_name()` - Get node display name
- `get_edge_weight()` - Get road distance
- `get_traffic()` - Get traffic pattern
- `get_congestion_ratio()` - Calculate congestion

### InfrastructurePlanner
**File**: `infrastructure_mst.py`  
**Purpose**: MST-based infrastructure planning  
**Methods**:
- `kruskal_augment()` - Kruskal's algorithm
- `plan_infrastructure()` - Full planning pipeline

### EmergencyRouter
**File**: `emergency_routing.py`  
**Purpose**: Emergency response routing  
**Methods**:
- `find_fastest_hospital()` - A* to nearest hospital
- `_astar()` - Core A* implementation
- `_heuristic()` - Euclidean heuristic

### TransitOptimizer
**File**: `transit_optimization.py`  
**Purpose**: Transit system optimization  
**Methods**:
- `dp_bus_allocation()` - DP-1: Bus fleet
- `dp_road_maintenance()` - DP-2: Road repair
- `memoized_shortest_path()` - DP-3: Route planning
- `run_full_analysis()` - Complete analysis

---

## Data Structures

### Node (Neighborhood):
```python
{
  "id": "3",
  "name": "Downtown Cairo",
  "type": "commercial",
  "population": 500000,
  "coordinates": {
    "lat": 30.0444,
    "lon": 31.2357
  }
}
```

### Road (Edge):
```python
{
  "from_id": "1",
  "to_id": "3",
  "distance_km": 12.5,
  "capacity": 3500,
  "condition": 8
}
```

### Traffic Pattern:
```python
{
  "morning_peak": 2800,
  "afternoon": 1800,
  "evening_peak": 2500,
  "night": 800
}
```

---

## Algorithm Complexity

| Algorithm | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| Dijkstra | O((V+E) log V) | O(V) |
| A* | O((V+E) log V) | O(V) |
| Bellman-Ford | O(VE) | O(V) |
| Kruskal's MST | O(E log E) | O(V) |
| DP Bus Allocation | O(R × B × K) | O(R × B) |
| DP Road Maintenance | O(N × W) | O(N × W) |
| DP Route Planning | O(1) cached | O(cache_size) |

Where:
- V = vertices (nodes)
- E = edges (roads)
- R = routes
- B = buses
- K = max extra buses
- N = candidate roads
- W = budget

---

## Common Tasks

### Test Infrastructure Optimization:
```bash
curl http://localhost:5000/api/infrastructure
```

### Test Bus Allocation:
```bash
curl -X POST http://localhost:5000/api/transit/bus-allocation \
  -H "Content-Type: application/json" \
  -d '{"fleet": 214, "minPerRoute": 5}'
```

### Test Road Maintenance:
```bash
curl -X POST http://localhost:5000/api/transit/road-maintenance \
  -H "Content-Type: application/json" \
  -d '{"budget": 300}'
```

### Test Route Planning:
```bash
curl -X POST http://localhost:5000/api/transit \
  -H "Content-Type: application/json" \
  -d '{"source": "1", "destination": "3", "mode": "time"}'
```

---

## Troubleshooting

### Backend not starting:
```bash
# Check Python version
python --version  # Should be 3.8+

# Install dependencies
pip install flask flask-cors networkx
```

### Frontend not starting:
```bash
# Install dependencies
npm install

# Clear cache
npm run build
```

### CORS errors:
- Backend has CORS enabled
- Check if backend is running on port 5000
- Check if frontend is using correct API URL

### Map not displaying:
- Check browser console for errors
- Verify Leaflet is loaded
- Check coordinates are valid

---

## Project Structure

```
algo_be2a-main/
├── Algorithmss/Algorithms/
│   ├── api_server.py                 # Flask API server
│   ├── cairo_transport_system.py     # Base system
│   ├── infrastructure_mst.py         # MST algorithm
│   ├── transit_optimization.py       # DP algorithms
│   ├── emergency_routing.py          # A* algorithm
│   └── dijkstra_service.py          # Dijkstra
├── src/
│   ├── services/
│   │   └── api.ts                   # API client
│   └── app/components/
│       ├── Dashboard.tsx            # Dashboard
│       ├── RoutePlanner.tsx         # Route planning
│       ├── Emergency.tsx            # Emergency mode
│       ├── Infrastructure.tsx       # MST planning
│       ├── PublicTransport.tsx      # Transit optimization
│       └── CompareAlgorithms.tsx    # Algorithm comparison
└── Documentation/
    ├── BACKEND_INTEGRATION_COMPLETE.md
    ├── INTEGRATION_SUMMARY.md
    ├── OVERPASS_INTEGRATION.md
    └── QUICK_REFERENCE.md (this file)
```

---

## Key Metrics

### Cairo Transportation Network:
- **Nodes**: 25 (15 districts + 10 facilities)
- **Active Nodes**: 19 (with edges)
- **Edges**: 28 existing roads
- **Potential Roads**: 15 candidates
- **Bus Routes**: 10
- **Metro Lines**: 3
- **Total Buses**: 214
- **Daily Passengers**: 3.8M (metro + bus)

### Optimization Results:
- **Infrastructure Cost**: 1,600 M EGP
- **Roads to Build**: 5
- **Bus Throughput Gain**: +15,000 pax/day
- **Maintenance Budget**: 300 M EGP
- **Roads to Repair**: 4
- **Time Saved**: 45.2 minutes

---

## Support

### Documentation:
- `README.md` - Project overview
- `QUICK_START.md` - Getting started
- `BACKEND_INTEGRATION_COMPLETE.md` - Technical details
- `INTEGRATION_SUMMARY.md` - Executive summary

### Code Comments:
- All backend files have detailed docstrings
- All algorithms explained in comments
- Complexity analysis included

---

**Last Updated**: May 11, 2026  
**Version**: 2.0  
**Status**: Production Ready ✅
