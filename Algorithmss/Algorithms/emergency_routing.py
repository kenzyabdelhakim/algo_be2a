"""
emergency_router.py
===================
Emergency Response Planning for the Cairo Transportation System.

Implements EmergencyRouter, which uses A* search to find the fastest
route from any node to the nearest medical facility (F9 or F10).

Travel-time weight
------------------
For each directed road segment:

    congestion_ratio = morning_peak_volume / road_capacity     (0 → 1+)
    effective_speed  = FREE_FLOW_SPEED × max(1 - congestion_ratio, 0.10)
    travel_time_min  = (distance_km / effective_speed) × 60

Speed degrades linearly with congestion, floored at 10 % of free-flow
speed so over-capacity roads remain traversable (just very slow).

Heuristic
---------
Admissible Euclidean heuristic using decimal-degree coordinates converted
to km via a cos(lat) correction:

    Δlat_km ≈ Δlat_deg × 111.0
    Δlon_km ≈ Δlon_deg × 111.0 × cos(mean_lat_rad)
    h(n)    = straight_line_km / FREE_FLOW_SPEED_KMH × 60  (minutes)

Because the heuristic assumes free-flow speed on a straight line it is
always ≤ the true travel time, so A* returns an optimal path.

Dataset note — inferred hospital approach roads
-----------------------------------------------
The project dataset (Project_Provided_Data.pdf) does not include any
directed roads *into* the two medical facilities (F9 / F10).  Rather
than making the hospitals unreachable, EmergencyRouter infers short
approach roads from their geometrically nearest connected neighbours:

    F9  ← Downtown Cairo [3]   :  ~1.6 km   (capacity 1 500 veh/h)
    F10 ← Maadi [1]            :  ~1.1 km   (capacity 1 500 veh/h)

These approach segments are added to the graph at construction time and
tagged with inferred=True so they are easy to identify.  Teammates
should replace them with real road data once it is available.

Usage
-----
    python emergency_router.py
or
    from emergency_router import EmergencyRouter
    er = EmergencyRouter()
    er.find_fastest_hospital("7")     # from 6th October City
"""

import math
import heapq
from typing import Dict, List, Optional, Tuple

from cairo_transport_system import CairoTransportSystem, Neighborhood, TrafficPattern

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

FREE_FLOW_SPEED_KMH: float = 60.0

MEDICAL_FACILITIES: List[str] = ["F9", "F10"]

# Inferred approach roads: (from_node, to_hospital, dist_km, capacity)
# Nearest connected node determined by Euclidean coordinate distance.
_INFERRED_APPROACHES: List[Tuple[str, str, float, int]] = [
    ("3",  "F9",  1.6, 1500),   # Downtown Cairo → Qasr El Aini Hospital
    ("1",  "F10", 1.1, 1500),   # Maadi           → Maadi Military Hospital
]


# ---------------------------------------------------------------------------
# EmergencyRouter
# ---------------------------------------------------------------------------

class EmergencyRouter(CairoTransportSystem):
    """
    Extends CairoTransportSystem with emergency-routing capabilities.

    On construction the class adds short inferred approach roads to F9
    and F10 (see module docstring) so A* can reach both hospitals.

    Core public method
    ------------------
    find_fastest_hospital(start_node_id)
        Runs A* from start_node_id to every medical facility and prints
        the full breakdown for the fastest route found.
    """

    def __init__(self):
        super().__init__()
        self._add_inferred_approaches()

    # ------------------------------------------------------------------ #
    # Inferred approach roads                                              #
    # ------------------------------------------------------------------ #

    def _add_inferred_approaches(self) -> None:
        """
        Add directed edges from nearest neighbours into F9 and F10.
        Tagged inferred=True; carry a light synthetic traffic pattern
        representing a hospital side-street.
        """
        for from_id, to_id, dist, cap in _INFERRED_APPROACHES:
            self.graph.add_edge(
                from_id,
                to_id,
                weight=dist,
                capacity=cap,
                condition=8,
                inferred=True,
            )
            key = f"{from_id}-{to_id}"
            if key not in self.traffic:
                self.traffic[key] = TrafficPattern(
                    morning_peak=500,
                    afternoon=300,
                    evening_peak=450,
                    night=100,
                )

    # ------------------------------------------------------------------ #
    # Travel-time weight per segment                                       #
    # ------------------------------------------------------------------ #

    def _travel_time_minutes(self, from_id: str, to_id: str) -> float:
        """
        Morning-peak travel time (minutes) for road from_id → to_id.

        1. Read distance_km and capacity from the graph edge.
        2. Read morning-peak volume from the traffic dictionary.
        3. Compute congestion ratio → effective speed → travel time.
        """
        edge = self.graph.get_edge_data(from_id, to_id)
        if edge is None:
            return math.inf

        distance_km: float = edge["weight"]
        capacity: int       = edge["capacity"]

        pattern = self.get_traffic(from_id, to_id)
        morning_volume: int = pattern.morning_peak if pattern else 0

        congestion_ratio: float = morning_volume / capacity
        speed_factor: float     = max(1.0 - congestion_ratio, 0.10)
        effective_speed: float  = FREE_FLOW_SPEED_KMH * speed_factor

        return (distance_km / effective_speed) * 60.0   # minutes

    # ------------------------------------------------------------------ #
    # Admissible heuristic                                                 #
    # ------------------------------------------------------------------ #

    def _heuristic(self, node_id: str, goal_id: str) -> float:
        """
        Straight-line travel time (minutes) between node_id and goal_id.

        Uses a cos(lat) correction to convert decimal-degree offsets to km.
        Optimistically assumes free-flow speed, guaranteeing admissibility.
        """
        n: Neighborhood = self.neighborhoods[node_id]
        g: Neighborhood = self.neighborhoods[goal_id]

        lat_mid_rad  = math.radians((n.y + g.y) / 2.0)
        delta_lat_km = (g.y - n.y) * 111.0
        delta_lon_km = (g.x - n.x) * 111.0 * math.cos(lat_mid_rad)

        straight_km = math.sqrt(delta_lat_km ** 2 + delta_lon_km ** 2)
        return (straight_km / FREE_FLOW_SPEED_KMH) * 60.0

    # ------------------------------------------------------------------ #
    # A* core                                                              #
    # ------------------------------------------------------------------ #

    def _astar(
        self,
        start: str,
        goal: str,
    ) -> Tuple[Optional[List[str]], float]:
        """
        A* search on the directed travel-time graph.

        Returns
        -------
        (path, cost)
            path – list of node IDs from start to goal (inclusive).
            cost – total travel time in minutes.
            Returns (None, inf) if no path exists.
        """
        open_heap: List[Tuple[float, float, str, List[str]]] = []
        start_h = self._heuristic(start, goal)
        heapq.heappush(open_heap, (start_h, 0.0, start, [start]))

        best_g: Dict[str, float] = {start: 0.0}

        while open_heap:
            f, g, current, path = heapq.heappop(open_heap)

            if current == goal:
                return path, g

            if g > best_g.get(current, math.inf):
                continue

            for neighbor in self.graph.successors(current):
                edge_cost = self._travel_time_minutes(current, neighbor)
                new_g     = g + edge_cost

                if new_g < best_g.get(neighbor, math.inf):
                    best_g[neighbor] = new_g
                    new_f = new_g + self._heuristic(neighbor, goal)
                    heapq.heappush(
                        open_heap,
                        (new_f, new_g, neighbor, path + [neighbor])
                    )

        return None, math.inf

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def find_fastest_hospital(self, start_node_id: str) -> None:
        """
        Find and print the fastest emergency route (morning-peak traffic)
        from start_node_id to the nearest medical facility (F9 or F10).

        Parameters
        ----------
        start_node_id : str
            Any valid node ID (e.g. "3", "7", "F1").
        """
        if start_node_id not in self.graph:
            print(f"  ✗  Node '{start_node_id}' not found in the graph.")
            return

        start_name = self.get_node_name(start_node_id)

        print("=" * 65)
        print("  🚑  Emergency Response Routing  (Morning Peak Traffic)")
        print("=" * 65)
        print(f"  Origin : {start_name}  [{start_node_id}]")
        print()

        results: List[Tuple[float, List[str], str]] = []

        for hospital_id in MEDICAL_FACILITIES:
            hospital_name = self.get_node_name(hospital_id)
            path, cost = self._astar(start_node_id, hospital_id)

            if path is None:
                print(f"  ✗  No route reachable → {hospital_name} [{hospital_id}]")
            else:
                print(f"  → {hospital_name} [{hospital_id}]  :  {cost:.1f} min")
                results.append((cost, path, hospital_id))

        print()

        if not results:
            print("  ✗  No hospital is reachable from this location.")
            print("=" * 65)
            return

        results.sort(key=lambda x: x[0])
        best_cost, best_path, best_goal = results[0]
        goal_name = self.get_node_name(best_goal)

        # ── Route breakdown ───────────────────────────────────────────── #
        print(f"  ✓  FASTEST ROUTE  →  {goal_name}  [{best_goal}]")
        print(f"     Total travel time : {best_cost:.1f} minutes")
        print()
        print("  Path (neighbourhood names):")
        named_path = [self.get_node_name(n) for n in best_path]
        print("    " + "  →  ".join(named_path))
        print()
        print("  Step-by-step breakdown:")
        print("  " + "─" * 61)

        cumulative = 0.0
        for i, node_id in enumerate(best_path):
            node_name = self.get_node_name(node_id)
            if i == 0:
                print(f"    [ORIGIN]  {node_name}  [{node_id}]")
            else:
                prev_id   = best_path[i - 1]
                seg_time  = self._travel_time_minutes(prev_id, node_id)
                seg_dist  = self.get_edge_weight(prev_id, node_id) or 0.0
                cong      = self.get_congestion_ratio(prev_id, node_id, "morning_peak") or 0.0
                cumulative += seg_time

                edge_data = self.graph.get_edge_data(prev_id, node_id) or {}
                note      = "  ⚠ inferred road" if edge_data.get("inferred") else ""

                tag = "  [DEST]" if node_id in MEDICAL_FACILITIES else "        "
                print(f"    {tag}  {node_name}  [{node_id}]")
                print(
                    f"             ↑  {seg_dist:.1f} km  |  {seg_time:.1f} min  "
                    f"|  congestion {cong:.0%}  "
                    f"|  cumulative {cumulative:.1f} min{note}"
                )

        print("  " + "─" * 61)
        total_dist = sum(
            self.get_edge_weight(best_path[i], best_path[i + 1]) or 0.0
            for i in range(len(best_path) - 1)
        )
        print(f"  Total hops     : {len(best_path) - 1}")
        print(f"  Total distance : {total_dist:.1f} km")
        print(f"  Total time     : {best_cost:.1f} minutes")
        print("=" * 65 + "\n")


# ---------------------------------------------------------------------------
# Demo
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    er = EmergencyRouter()
    er.verify()

    test_cases = [
        ("3",  "Downtown Cairo → nearest hospital"),
        ("7",  "6th October City → nearest hospital"),
        ("13", "New Administrative Capital → nearest hospital"),
        ("F1", "Cairo Airport → nearest hospital"),
        ("11", "Shubra → nearest hospital"),
        ("4",  "New Cairo → nearest hospital"),
    ]

    for node_id, description in test_cases:
        print(f"\n{'#' * 65}")
        print(f"# SCENARIO: {description}")
        print(f"{'#' * 65}\n")
        er.find_fastest_hospital(node_id)