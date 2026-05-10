# Backend Integration Guide

## Overview

The Smart Traffic Dashboard UI has been successfully connected to the Python backend algorithms. The frontend now fetches real data from the Flask API server instead of using mock data.

## Architecture

### Backend (Python Flask)
- **Location**: `Algorithmss/Algorithms/api_server.py`
- **Port**: `http://localhost:5000`
- **Framework**: Flask with Flask-CORS

### Frontend (React + TypeScript)
- **Location**: `src/`
- **Port**: `http://localhost:5175`
- **Framework**: React with Vite

### API Service Layer
- **Location**: `src/services/api.ts`
- Handles all HTTP requests to the backend
- Provides TypeScript types for API responses

## Running the Application

### 1. Start the Backend Server

```bash
python Algorithmss/Algorithms/api_server.py
```

The backend will start on `http://localhost:5000`

### 2. Start the Frontend Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5175`

### 3. Access the Application

Open your browser and navigate to `http://localhost:5175`

## API Endpoints

### GET /api/health
Health check endpoint to verify backend is running.

### GET /api/nodes
Returns all available nodes (neighborhoods and facilities) in the Cairo transportation system.

### POST /api/dijkstra
Calculate shortest path using Dijkstra's algorithm.

**Request Body:**
```json
{
  "source": "node_id",
  "destination": "node_id"
}
```

### POST /api/emergency
Find fastest route to nearest hospital using A* algorithm.

**Request Body:**
```json
{
  "location": "node_id"
}
```

**Note**: User only selects their current location. The backend automatically finds and returns the nearest hospital.

### GET /api/infrastructure
Get infrastructure planning using MST (Kruskal's algorithm).

Returns the minimum set of roads needed for strong connectivity with total cost.

### POST /api/compare
Compare different pathfinding algorithms (Dijkstra, A*, Bellman-Ford) on the same route.

**Request Body:**
```json
{
  "source": "node_id",
  "destination": "node_id"
}
```

## Components Updated

### 1. Route Planner (`src/app/components/RoutePlanner.tsx`)
- Connected to `/api/dijkstra` endpoint
- Uses dropdown selects populated with real nodes from backend
- Displays real route data including distance, time, and path details

### 2. Emergency (`src/app/components/Emergency.tsx`)
- Connected to `/api/emergency` endpoint
- User selects only their current location
- Backend automatically finds nearest hospital using A* algorithm
- Displays route details with congestion information

### 3. Compare Algorithms (`src/app/components/CompareAlgorithms.tsx`)
- Connected to `/api/compare` endpoint
- Compares Dijkstra, A*, and Bellman-Ford algorithms
- Shows real execution times and performance metrics

### 4. Infrastructure (`src/app/components/Infrastructure.tsx`)
- Connected to `/api/infrastructure` endpoint
- Uses Kruskal's MST algorithm for government/emergency planning
- Displays selected roads to build with costs and connectivity status

## Key Features

### No UI Changes
- All existing colors, layouts, buttons, animations, fonts, and spacing remain unchanged
- Only the data source changed from static/mock to real backend APIs

### Real Algorithm Integration
- **Dijkstra**: Shortest path routing between any two nodes
- **A***: Emergency routing with heuristic optimization to nearest hospital
- **MST (Kruskal's)**: Infrastructure planning for strong network connectivity
- **Algorithm Comparison**: Real-time performance comparison

### Error Handling
- Loading states during API calls
- Error messages displayed to users
- Graceful fallbacks if backend is unavailable

### Data Flow
1. User interacts with UI (selects nodes, clicks buttons)
2. Frontend calls API service functions
3. API service makes HTTP requests to Flask backend
4. Backend runs algorithms and returns results
5. Frontend displays real data in existing UI components

## Dependencies

### Backend
- Flask
- Flask-CORS
- NetworkX (for graph algorithms)
- Python 3.x

### Frontend
- React
- TypeScript
- Vite
- Existing UI libraries (unchanged)

## Notes

- The backend uses the Cairo Transportation System data from `Project_Provided_Data.pdf`
- All algorithms are implemented in Python and exposed via REST API
- The frontend maintains its exact visual design and user experience
- CORS is enabled to allow frontend-backend communication during development
