# Quick Start Guide

## Prerequisites
- Python 3.x installed
- Node.js and npm installed
- Flask and Flask-CORS installed (`pip install flask flask-cors`)

## Start the Application

### Step 1: Start Backend Server
Open a terminal and run:
```bash
python Algorithmss/Algorithms/api_server.py
```

You should see:
```
============================================================
  Cairo Transportation System API Server
============================================================
  Starting server on http://localhost:5000
```

### Step 2: Start Frontend Server
Open another terminal and run:
```bash
npm run dev
```

You should see:
```
  VITE v6.3.5  ready in XXX ms
  ➜  Local:   http://localhost:5175/
```

### Step 3: Open Browser
Navigate to: **http://localhost:5175**

## Using the Application

### 1. Route Planner (Dijkstra)
- Click "Route Planner" in the sidebar
- Select a source node from the dropdown
- Select a destination node from the dropdown
- Click "Find Best Route"
- View the calculated route with distance and time

### 2. Emergency Mode (A*)
- Click "Emergency" in the sidebar
- Select your current location from the dropdown
- Click "Activate Emergency"
- The system automatically finds the nearest hospital
- View the route with congestion information

### 3. Compare Algorithms
- Click "Compare" in the sidebar
- Select source and destination nodes
- Click "Compare Algorithms"
- View real-time performance comparison of Dijkstra, A*, and Bellman-Ford

### 4. Infrastructure Planning (MST)
- Click "Infrastructure" in the sidebar
- Click "Optimize Network"
- View the minimum set of roads needed for connectivity
- See total cost and selected roads

## Troubleshooting

### Backend not responding
- Check if Python server is running on port 5000
- Verify Flask and Flask-CORS are installed
- Check terminal for error messages

### Frontend not loading
- Check if Vite dev server is running on port 5175
- Run `npm install` if dependencies are missing
- Clear browser cache and reload

### CORS errors
- Ensure Flask-CORS is installed
- Backend should show "Access-Control-Allow-Origin: *" in responses

### No data showing
- Verify both servers are running
- Check browser console for errors (F12)
- Verify backend is accessible at http://localhost:5000/api/health

## API Endpoints

All endpoints are available at `http://localhost:5000/api/`

- `GET /health` - Health check
- `GET /nodes` - Get all nodes
- `POST /dijkstra` - Calculate shortest path
- `POST /emergency` - Find nearest hospital
- `GET /infrastructure` - Get infrastructure plan
- `POST /compare` - Compare algorithms

## Notes

- The UI design remains exactly as it was
- All data is now fetched from the backend
- Loading states show during API calls
- Error messages display if something goes wrong
- Both servers must be running for the app to work
