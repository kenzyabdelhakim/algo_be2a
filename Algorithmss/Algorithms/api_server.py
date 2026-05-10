"""
api_server.py
=============
Flask REST API server for the Cairo Transportation System.

Provides endpoints for:
- Dijkstra shortest path routing
- A* emergency routing to nearest hospital
- MST infrastructure planning
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Force UTF-8 output on Windows so Unicode chars in print() don't crash the server
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding and sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import statistics

from cairo_transport_system import CairoTransportSystem
from emergency_routing import EmergencyRouter
from infrastructure_mst import InfrastructurePlanner
from transit_optimization import TransitOptimizer
import networkx as nx

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize the systems
cts = CairoTransportSystem()
emergency_router = EmergencyRouter()
infrastructure_planner = InfrastructurePlanner()
transit_optimizer = TransitOptimizer()


@app.route('/api/dashboard', methods=['GET'])
def dashboard_stats():
    """Aggregate metrics derived from the live transport graph for the UI dashboard."""
    try:
        g = cts.graph
        n = g.number_of_nodes()
        e = g.number_of_edges()
        possible = n * (n - 1) if n > 1 else 1
        density_pct = round(100.0 * e / possible, 1)

        weights = [float(d.get('weight', 1.0)) for _, _, d in g.edges(data=True)]
        avg_edge_km = statistics.mean(weights) if weights else 0.0
        # Match /api/dijkstra-style travel-time scaling (city average speed 40 km/h).
        avg_travel_min = max(5, int(round((avg_edge_km * 2.8 / 40.0) * 60)))
        eff = min(45, max(8, int(40 - density_pct / 2.5)))

        return jsonify({
            "success": True,
            "trafficDensityPercent": min(99.0, density_pct),
            "avgTravelTimeMin": avg_travel_min,
            "activeRoutes": e,
            "efficiencyGainPercent": eff,
        })
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500


@app.route('/api/transit', methods=['POST'])
def transit_route():
    """
    Public-transport style routing using the memoized weighted shortest path,
    or an unweighted fewest-hop path (min transfers / min intermediate nodes).
    """
    data = request.get_json() or {}
    source = data.get('source')
    destination = data.get('destination')
    mode = (data.get('mode') or 'time').lower()
    time_of_day = data.get('time_of_day') or 'morning'

    if not source or not destination:
        return jsonify({"error": "Source and destination are required"}), 400

    if source not in cts.graph or destination not in cts.graph:
        return jsonify({"error": "Invalid source or destination node"}), 400

    period = 'morning_peak'

    try:
        if mode == 'hops':
            try:
                path = nx.shortest_path(cts.graph, source, destination)
            except nx.NetworkXNoPath:
                return jsonify({"error": "No path exists between source and destination"}), 404

            total_time = 0.0
            total_dist = 0.0
            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                total_time += transit_optimizer._edge_time(u, v, period)
                total_dist += float(cts.get_edge_weight(u, v) or 0.0)

            names = [cts.get_node_name(p) for p in path]
            return jsonify({
                "status": "success",
                "path": path,
                "path_names": names,
                "total_time_min": round(total_time, 2),
                "total_distance_km": round(total_dist, 2),
                "time_of_day": period,
                "mode": "hops",
                "message": " → ".join(names),
            })

        result = transit_optimizer.memoized_shortest_path(source, destination, time_of_day)
        st = result.get('status')
        if st == 'error':
            return jsonify({"error": result.get('message', 'Invalid request')}), 400
        if st == 'no_path':
            return jsonify({"error": result.get('message', 'No path found')}), 404

        out = dict(result)
        out['mode'] = 'time'
        return jsonify(out)

    except Exception as ex:
        return jsonify({"error": str(ex)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "ok", 
        "message": "Cairo Transport API is running",
        "nodes": len(cts.graph.nodes()),
        "edges": cts.graph.number_of_edges()
    })


@app.route('/api/nodes', methods=['GET'])
def get_nodes():
    """Get all available nodes (neighborhoods and facilities)."""
    nodes = []
    for node_id in cts.graph.nodes():
        node_data = cts.neighborhoods.get(node_id)
        if node_data:
            nodes.append({
                "id": node_id,
                "name": node_data.name,
                "type": node_data.district_type,
                "population": node_data.population,
                "coordinates": {
                    "lat": node_data.y,
                    "lon": node_data.x
                }
            })
    return jsonify(nodes)


@app.route('/api/dijkstra', methods=['POST'])
def dijkstra_route():
    """
    Calculate shortest path using Dijkstra's algorithm.
    
    Request body:
    {
        "source": "node_id",
        "destination": "node_id"
    }
    """
    data = request.get_json()
    source = data.get('source')
    destination = data.get('destination')
    
    if not source or not destination:
        return jsonify({"error": "Source and destination are required"}), 400
    
    if source not in cts.graph or destination not in cts.graph:
        return jsonify({"error": "Invalid source or destination node"}), 400
    
    try:
        # Calculate shortest path using Dijkstra
        path = nx.dijkstra_path(cts.graph, source, destination, weight='weight')
        path_length = nx.dijkstra_path_length(cts.graph, source, destination, weight='weight')
        
        # Build detailed path information
        path_details = []
        total_distance = 0
        
        for i in range(len(path)):
            node_id = path[i]
            node_name = cts.get_node_name(node_id)
            node_data = cts.neighborhoods.get(node_id)
            
            step = {
                "nodeId": node_id,
                "nodeName": node_name,
                "isOrigin": i == 0,
                "isDestination": i == len(path) - 1,
                "lat": node_data.y if node_data else None,
                "lon": node_data.x if node_data else None,
            }
            
            if i > 0:
                prev_id = path[i - 1]
                edge_weight = cts.get_edge_weight(prev_id, node_id) or 0.0
                total_distance += edge_weight
                
                step["segmentDistance"] = round(edge_weight, 2)
                step["cumulativeDistance"] = round(total_distance, 2)
            
            path_details.append(step)
        
        # Calculate estimated time (assuming average speed of 40 km/h in city)
        estimated_time_minutes = (total_distance / 40.0) * 60
        
        return jsonify({
            "success": True,
            "algorithm": "Dijkstra",
            "path": path_details,
            "summary": {
                "totalDistance": round(total_distance, 2),
                "estimatedTime": round(estimated_time_minutes, 1),
                "numberOfHops": len(path) - 1
            }
        })
        
    except nx.NetworkXNoPath:
        return jsonify({"error": "No path exists between source and destination"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/emergency', methods=['POST'])
def emergency_route():
    """
    Find fastest route to nearest hospital using A* algorithm.
    
    Request body:
    {
        "location": "node_id"
    }
    """
    data = request.get_json()
    location = data.get('location')
    
    if not location:
        return jsonify({"error": "Location is required"}), 400
    
    if location not in emergency_router.graph:
        return jsonify({"error": "Invalid location node"}), 400
    
    try:
        # Find routes to all hospitals
        from emergency_routing import MEDICAL_FACILITIES
        
        results = []
        for hospital_id in MEDICAL_FACILITIES:
            path, cost = emergency_router._astar(location, hospital_id)
            
            if path is not None:
                results.append({
                    "hospitalId": hospital_id,
                    "hospitalName": emergency_router.get_node_name(hospital_id),
                    "travelTime": round(cost, 1),
                    "path": path
                })
        
        if not results:
            return jsonify({"error": "No hospital is reachable from this location"}), 404
        
        # Sort by travel time and get the fastest
        results.sort(key=lambda x: x["travelTime"])
        fastest = results[0]
        
        # Build detailed path information
        path_details = []
        cumulative_time = 0
        total_distance = 0
        
        for i in range(len(fastest["path"])):
            node_id = fastest["path"][i]
            node_name = emergency_router.get_node_name(node_id)
            node_data = cts.neighborhoods.get(node_id)
            
            step = {
                "nodeId": node_id,
                "nodeName": node_name,
                "isOrigin": i == 0,
                "isDestination": i == len(fastest["path"]) - 1,
                "lat": node_data.y if node_data else None,
                "lon": node_data.x if node_data else None,
            }
            
            if i > 0:
                prev_id = fastest["path"][i - 1]
                seg_time = emergency_router._travel_time_minutes(prev_id, node_id)
                seg_dist = emergency_router.get_edge_weight(prev_id, node_id) or 0.0
                cong = emergency_router.get_congestion_ratio(prev_id, node_id, "morning_peak") or 0.0
                
                cumulative_time += seg_time
                total_distance += seg_dist
                
                step["segmentTime"] = round(seg_time, 1)
                step["segmentDistance"] = round(seg_dist, 2)
                step["cumulativeTime"] = round(cumulative_time, 1)
                step["congestion"] = round(cong * 100, 0)
            
            path_details.append(step)
        
        return jsonify({
            "success": True,
            "algorithm": "A*",
            "nearestHospital": {
                "id": fastest["hospitalId"],
                "name": fastest["hospitalName"]
            },
            "path": path_details,
            "summary": {
                "totalDistance": round(total_distance, 2),
                "totalTime": round(fastest["travelTime"], 1),
                "numberOfHops": len(fastest["path"]) - 1
            },
            "alternativeHospitals": [
                {
                    "id": h["hospitalId"],
                    "name": h["hospitalName"],
                    "travelTime": h["travelTime"]
                }
                for h in results[1:3]  # Include up to 2 alternatives
            ]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/infrastructure', methods=['GET'])
def infrastructure_plan():
    """
    Get infrastructure planning using MST (Kruskal's algorithm).
    
    Returns the minimum set of roads needed for strong connectivity.
    """
    try:
        # Run the infrastructure planning
        selected_roads, total_cost, aug_graph = infrastructure_planner.kruskal_augment()
        
        # Format the selected roads
        roads = []
        for from_id, to_id, dist, cap, cost in selected_roads:
            roads.append({
                "fromId": from_id,
                "fromName": infrastructure_planner.get_node_name(from_id),
                "toId": to_id,
                "toName": infrastructure_planner.get_node_name(to_id),
                "distance": round(dist, 2),
                "capacity": cap,
                "cost": cost
            })
        
        # Check connectivity status
        active = set()
        for u, v in aug_graph.edges():
            active.add(u)
            active.add(v)
        aug_sub = aug_graph.subgraph(active).copy()
        
        core_nodes = set(str(i) for i in range(1, 16)) | {"F2", "F7"}
        core_in_graph = core_nodes & active
        core_sub = aug_sub.subgraph(core_in_graph).copy()
        core_sc = nx.is_strongly_connected(core_sub)
        
        return jsonify({
            "success": True,
            "algorithm": "Kruskal's MST",
            "selectedRoads": roads,
            "summary": {
                "totalCost": total_cost,
                "numberOfRoads": len(roads),
                "isStronglyConnected": core_sc,
                "activeNodes": len(active),
                "totalEdges": aug_sub.number_of_edges()
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/compare', methods=['POST'])
def compare_algorithms():
    """
    Compare different pathfinding algorithms on the same route.
    
    Request body:
    {
        "source": "node_id",
        "destination": "node_id"
    }
    """
    data = request.get_json()
    source = data.get('source')
    destination = data.get('destination')
    
    if not source or not destination:
        return jsonify({"error": "Source and destination are required"}), 400
    
    if source not in cts.graph or destination not in cts.graph:
        return jsonify({"error": "Invalid source or destination node"}), 400
    
    try:
        import time
        
        results = []
        
        # Dijkstra
        start_time = time.perf_counter()
        dijkstra_path = nx.dijkstra_path(cts.graph, source, destination, weight='weight')
        dijkstra_time = (time.perf_counter() - start_time) * 1000  # Convert to ms
        dijkstra_length = nx.dijkstra_path_length(cts.graph, source, destination, weight='weight')
        
        results.append({
            "algorithm": "Dijkstra",
            "executionTime": round(dijkstra_time, 2),
            "pathLength": round(dijkstra_length, 2),
            "nodesVisited": len(dijkstra_path),
            "path": dijkstra_path
        })
        
        # A* (using emergency router's heuristic)
        start_time = time.perf_counter()
        astar_path = nx.astar_path(
            cts.graph, 
            source, 
            destination, 
            heuristic=lambda n1, n2: emergency_router._heuristic(n1, n2),
            weight='weight'
        )
        astar_time = (time.perf_counter() - start_time) * 1000
        astar_length = nx.astar_path_length(
            cts.graph,
            source,
            destination,
            heuristic=lambda n1, n2: emergency_router._heuristic(n1, n2),
            weight='weight'
        )
        
        results.append({
            "algorithm": "A*",
            "executionTime": round(astar_time, 2),
            "pathLength": round(astar_length, 2),
            "nodesVisited": len(astar_path),
            "path": astar_path
        })
        
        # Bellman-Ford
        start_time = time.perf_counter()
        bellman_path = nx.bellman_ford_path(cts.graph, source, destination, weight='weight')
        bellman_time = (time.perf_counter() - start_time) * 1000
        bellman_length = nx.bellman_ford_path_length(cts.graph, source, destination, weight='weight')
        
        results.append({
            "algorithm": "Bellman-Ford",
            "executionTime": round(bellman_time, 2),
            "pathLength": round(bellman_length, 2),
            "nodesVisited": len(bellman_path),
            "path": bellman_path
        })
        
        # Find the fastest algorithm
        fastest = min(results, key=lambda x: x["executionTime"])
        
        return jsonify({
            "success": True,
            "results": results,
            "fastest": fastest["algorithm"],
            "summary": {
                "source": cts.get_node_name(source),
                "destination": cts.get_node_name(destination)
            }
        })
        
    except nx.NetworkXNoPath:
        return jsonify({"error": "No path exists between source and destination"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("=" * 60)
    print("  Cairo Transportation System API Server")
    print("=" * 60)
    print("  Starting server on http://localhost:5000")
    print("  Available endpoints:")
    print("    GET  /api/health          - Health check")
    print("    GET  /api/nodes           - Get all nodes")
    print("    POST /api/dijkstra        - Dijkstra routing")
    print("    POST /api/emergency       - A* emergency routing")
    print("    GET  /api/infrastructure  - MST infrastructure planning")
    print("    POST /api/compare         - Compare algorithms")
    print("    GET  /api/dashboard       - Dashboard aggregate stats")
    print("    POST /api/transit         - Transit / fewest-hop routing")
    print("=" * 60)
    app.run(debug=True, port=5000, host='0.0.0.0')
