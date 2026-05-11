"""
cairo_transport_system.py
=========================
Core foundation for the Cairo Transportation System (CSE112 Project).

Data Source: Project_Provided_Data.pdf
Teammates can subclass CairoTransportSystem or import the instance
`cts` at the bottom to run their own algorithms on top of this base.
"""

import networkx as nx
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional


# ---------------------------------------------------------------------------
# 1. DATA STRUCTURES
# ---------------------------------------------------------------------------

@dataclass
class Neighborhood:
    """Represents a Cairo neighborhood / district node."""
    node_id: str          # e.g. "1", "2", … "15", or "F1"–"F10"
    name: str
    population: int
    district_type: str    # Residential / Mixed / Business / Industrial / Government / Facility
    x: float              # longitude
    y: float              # latitude


@dataclass
class Road:
    """Represents a directed road edge with its static attributes."""
    from_id: str
    to_id: str
    distance_km: float
    capacity_veh_per_hour: int
    condition: int        # 1 (worst) – 10 (best)


@dataclass
class TrafficPattern:
    """Hourly traffic volumes for the four daily periods (vehicles/hour)."""
    morning_peak: int
    afternoon: int
    evening_peak: int
    night: int

    def as_dict(self) -> Dict[str, int]:
        return {
            "morning_peak": self.morning_peak,
            "afternoon":    self.afternoon,
            "evening_peak": self.evening_peak,
            "night":        self.night,
        }

    def peak_load_ratio(self, capacity: int) -> Dict[str, float]:
        """Return volume/capacity ratio for each period (saturation %)."""
        return {period: vol / capacity
                for period, vol in self.as_dict().items()}


# ---------------------------------------------------------------------------
# 2. RAW DATA  (parsed from Project_Provided_Data.pdf)
# ---------------------------------------------------------------------------

# -- Neighborhoods & Districts (ID, Name, Population, Type, X, Y) -----------
_NEIGHBORHOOD_ROWS: List[Tuple] = [
    ("1",  "Maadi",                       250_000, "Residential",  31.25, 29.96),
    ("2",  "Nasr City",                   500_000, "Mixed",         31.34, 30.06),
    ("3",  "Downtown Cairo",              100_000, "Business",      31.24, 30.04),
    ("4",  "New Cairo",                   300_000, "Residential",   31.47, 30.03),
    ("5",  "Heliopolis",                  200_000, "Mixed",         31.32, 30.09),
    ("6",  "Zamalek",                      50_000, "Residential",   31.22, 30.06),
    ("7",  "6th October City",            400_000, "Mixed",         30.98, 29.93),
    ("8",  "Giza",                        550_000, "Mixed",         31.21, 29.99),
    ("9",  "Mohandessin",                 180_000, "Business",      31.20, 30.05),
    ("10", "Dokki",                       220_000, "Mixed",         31.21, 30.03),
    ("11", "Shubra",                      450_000, "Residential",   31.24, 30.11),
    ("12", "Helwan",                      350_000, "Industrial",    31.33, 29.85),
    ("13", "New Administrative Capital",   50_000, "Government",    31.80, 30.02),
    ("14", "Al Rehab",                    120_000, "Residential",   31.49, 30.06),
    ("15", "Sheikh Zayed",                150_000, "Residential",   30.94, 30.01),
]

# -- Important Facilities (ID, Name, Type, X, Y) ----------------------------
_FACILITY_ROWS: List[Tuple] = [
    ("F1",  "Cairo International Airport", "Airport",      31.41, 30.11),
    ("F2",  "Ramses Railway Station",       "Transit Hub",  31.25, 30.06),
    ("F3",  "Cairo University",             "Education",    31.21, 30.03),
    ("F4",  "Al-Azhar University",          "Education",    31.26, 30.05),
    ("F5",  "Egyptian Museum",              "Tourism",      31.23, 30.05),
    ("F6",  "Cairo International Stadium",  "Sports",       31.30, 30.07),
    ("F7",  "Smart Village",               "Business",     30.97, 30.07),
    ("F8",  "Cairo Festival City",         "Commercial",   31.40, 30.03),
    ("F9",  "Qasr El Aini Hospital",        "Medical",      31.23, 30.03),
    ("F10", "Maadi Military Hospital",      "Medical",      31.25, 29.95),
]

# -- Existing Roads (FromID, ToID, Distance km, Capacity veh/h, Condition) --
_ROAD_ROWS: List[Tuple] = [
    ("1",  "3",  8.5,  3000, 7),
    ("1",  "8",  6.2,  2500, 6),
    ("2",  "3",  5.9,  2800, 8),
    ("2",  "5",  4.0,  3200, 9),
    ("3",  "5",  6.1,  3500, 7),
    ("3",  "6",  3.2,  2000, 8),
    ("3",  "9",  4.5,  2600, 6),
    ("3",  "10", 3.8,  2400, 7),
    ("4",  "2",  15.2, 3800, 9),
    ("4",  "14", 5.3,  3000, 10),
    ("5",  "11", 7.9,  3100, 7),
    ("6",  "9",  2.2,  1800, 8),
    ("7",  "8",  24.5, 3500, 8),
    ("7",  "15", 9.8,  3000, 9),
    ("8",  "10", 3.3,  2200, 7),
    ("8",  "12", 14.8, 2600, 5),
    ("9",  "10", 2.1,  1900, 7),
    ("10", "11", 8.7,  2400, 6),
    ("11", "F2", 3.6,  2200, 7),
    ("12", "1",  12.7, 2800, 6),
    ("13", "4",  45.0, 4000, 10),
    ("14", "13", 35.5, 3800, 9),
    ("15", "7",  9.8,  3000, 9),
    ("F1", "5",  7.5,  3500, 9),
    ("F1", "2",  9.2,  3200, 8),
    ("F2", "3",  2.5,  2000, 7),
    ("F7", "15", 8.3,  2800, 8),
    ("F8", "4",  6.1,  3000, 9),
]

# -- Traffic Flow Patterns (road_key, Morning, Afternoon, Evening, Night) ----
_TRAFFIC_ROWS: List[Tuple] = [
    ("1-3",   2800, 1500, 2600,  800),
    ("1-8",   2200, 1200, 2100,  600),
    ("2-3",   2700, 1400, 2500,  700),
    ("2-5",   3000, 1600, 2800,  650),
    ("3-5",   3200, 1700, 3100,  800),
    ("3-6",   1800, 1400, 1900,  500),
    ("3-9",   2400, 1300, 2200,  550),
    ("3-10",  2300, 1200, 2100,  500),
    ("4-2",   3600, 1800, 3300,  750),
    ("4-14",  2800, 1600, 2600,  600),
    ("5-11",  2900, 1500, 2700,  650),
    ("6-9",   1700, 1300, 1800,  450),
    ("7-8",   3200, 1700, 3000,  700),
    ("7-15",  2800, 1500, 2600,  600),
    ("8-10",  2000, 1100, 1900,  450),
    ("8-12",  2400, 1300, 2200,  500),
    ("9-10",  1800, 1200, 1700,  400),
    ("10-11", 2200, 1300, 2100,  500),
    ("11-F2", 2100, 1200, 2000,  450),
    ("12-1",  2600, 1400, 2400,  550),
    ("13-4",  3800, 2000, 3500,  800),
    ("14-13", 3600, 1900, 3300,  750),
    ("15-7",  2800, 1500, 2600,  600),
    ("F1-5",  3300, 2200, 3100, 1200),
    ("F1-2",  3000, 2000, 2800, 1100),
    ("F2-3",  1900, 1600, 1800,  900),
    ("F7-15", 2600, 1500, 2400,  550),
    ("F8-4",  2800, 1600, 2600,  600),
]


# ---------------------------------------------------------------------------
# 3. CairoTransportSystem  (Base Class)
# ---------------------------------------------------------------------------

class CairoTransportSystem:
    """
    Core foundation for the Cairo Transportation System.

    Attributes
    ----------
    neighborhoods : Dict[str, Neighborhood]
        All 15 districts + 10 facilities, keyed by node ID.
    roads : List[Road]
        All 28 existing road segments.
    graph : nx.DiGraph
        Directed weighted graph.  Edge weights = distance_km.
        Each edge also carries 'capacity' and 'condition' attributes.
    traffic : Dict[str, TrafficPattern]
        Traffic patterns keyed by "fromID-toID" strings.

    Extending the class
    -------------------
    Teammates should subclass CairoTransportSystem and add their
    algorithm methods.  All raw data is available via the attributes
    above; no re-parsing is needed.

    Example
    -------
    >>> cts = CairoTransportSystem()
    >>> cts.verify()
    >>> print(cts.neighborhoods["F1"].name)
    Cairo International Airport
    """

    def __init__(self):
        self.neighborhoods: Dict[str, Neighborhood] = {}
        self.roads: List[Road] = []
        self.graph: nx.DiGraph = nx.DiGraph()
        self.traffic: Dict[str, TrafficPattern] = {}

        self._load_neighborhoods()
        self._load_facilities()
        self._build_graph()
        self._load_traffic()

    # ------------------------------------------------------------------ #
    # 1. Data Loading                                                       #
    # ------------------------------------------------------------------ #

    def _load_neighborhoods(self) -> None:
        """Parse the 15 neighborhood/district records into self.neighborhoods."""
        for node_id, name, pop, ntype, x, y in _NEIGHBORHOOD_ROWS:
            self.neighborhoods[node_id] = Neighborhood(
                node_id=node_id,
                name=name,
                population=pop,
                district_type=ntype,
                x=x,
                y=y,
            )

    def _load_facilities(self) -> None:
        """Parse the 10 important-facility records into self.neighborhoods."""
        for node_id, name, ftype, x, y in _FACILITY_ROWS:
            # Facilities have no population count in the dataset → stored as 0
            self.neighborhoods[node_id] = Neighborhood(
                node_id=node_id,
                name=name,
                population=0,
                district_type=ftype,
                x=x,
                y=y,
            )

    # ------------------------------------------------------------------ #
    # 2. Graph Setup                                                        #
    # ------------------------------------------------------------------ #

    def _build_graph(self) -> None:
        """
        Build a directed weighted NetworkX graph from existing roads.

        Node attributes : name, population, district_type, x, y
        Edge attributes : weight (distance_km), capacity, condition
        """
        # Add every node with its metadata
        for node_id, nbhd in self.neighborhoods.items():
            self.graph.add_node(
                node_id,
                name=nbhd.name,
                population=nbhd.population,
                district_type=nbhd.district_type,
                x=nbhd.x,
                y=nbhd.y,
            )

        # Add bidirectional edges — all roads are two-way in Cairo.
        # The dataset only lists one direction per road; we mirror each edge so
        # that every pair of nodes can reach each other via the graph.
        for from_id, to_id, dist, cap, cond in _ROAD_ROWS:
            road = Road(
                from_id=from_id,
                to_id=to_id,
                distance_km=dist,
                capacity_veh_per_hour=cap,
                condition=cond,
            )
            self.roads.append(road)

            self.graph.add_edge(
                from_id,
                to_id,
                weight=dist,
                capacity=cap,
                condition=cond,
            )
            # Reverse direction (only add if not already defined in the dataset)
            if not self.graph.has_edge(to_id, from_id):
                self.graph.add_edge(
                    to_id,
                    from_id,
                    weight=dist,
                    capacity=cap,
                    condition=cond,
                )

    # ------------------------------------------------------------------ #
    # 3. Traffic Manager                                                    #
    # ------------------------------------------------------------------ #

    def _load_traffic(self) -> None:
        """
        Parse Traffic Flow Patterns into self.traffic.

        Key format  : "fromID-toID"  (e.g. "1-3", "F1-2")
        Value       : TrafficPattern(morning_peak, afternoon,
                                     evening_peak, night)
        """
        for road_key, morning, afternoon, evening, night in _TRAFFIC_ROWS:
            self.traffic[road_key] = TrafficPattern(
                morning_peak=morning,
                afternoon=afternoon,
                evening_peak=evening,
                night=night,
            )

    def get_traffic(self, from_id: str, to_id: str) -> Optional[TrafficPattern]:
        """
        Return the TrafficPattern for a road, or None if not found.

        Parameters
        ----------
        from_id : source node ID  (e.g. "3")
        to_id   : destination node ID  (e.g. "F2")
        """
        return self.traffic.get(f"{from_id}-{to_id}")

    def get_congestion_ratio(
        self,
        from_id: str,
        to_id: str,
        period: str = "morning_peak"
    ) -> Optional[float]:
        """
        Volume / Capacity ratio for the given road and time period.

        Parameters
        ----------
        from_id : source node ID
        to_id   : destination node ID
        period  : one of 'morning_peak', 'afternoon', 'evening_peak', 'night'

        Returns
        -------
        float between 0 and 1+ (>1 means over capacity), or None if unknown.
        """
        pattern = self.get_traffic(from_id, to_id)
        if pattern is None:
            return None
        edge_data = self.graph.get_edge_data(from_id, to_id)
        if edge_data is None:
            return None
        volume = pattern.as_dict().get(period, 0)
        return volume / edge_data["capacity"]

    # ------------------------------------------------------------------ #
    # 4. Convenience helpers (useful for teammate algorithms)               #
    # ------------------------------------------------------------------ #

    def get_node_name(self, node_id: str) -> str:
        """Return the human-readable name for a node ID."""
        return self.neighborhoods[node_id].name if node_id in self.neighborhoods else node_id

    def get_edge_weight(self, from_id: str, to_id: str) -> Optional[float]:
        """Return the distance (km) of a road, or None if it doesn't exist."""
        data = self.graph.get_edge_data(from_id, to_id)
        return data["weight"] if data else None

    def neighbors_of(self, node_id: str) -> List[str]:
        """Return the list of nodes directly reachable from node_id."""
        return list(self.graph.successors(node_id))

    # ------------------------------------------------------------------ #
    # 5. Verification                                                       #
    # ------------------------------------------------------------------ #

    def verify(self) -> None:
        """
        Print a summary proving the data loaded correctly.
        Checks node count, edge count, and spot-checks a few values.
        """
        print("=" * 55)
        print("  Cairo Transportation System — Load Verification")
        print("=" * 55)

        # Node / edge counts
        n_nodes = self.graph.number_of_nodes()
        n_edges = self.graph.number_of_edges()
        print(f"\n  Graph nodes  : {n_nodes}  (expected 25 — 15 districts + 10 facilities)")
        print(f"  Graph edges  : {n_edges}  (expected 28 existing roads)")
        print(f"  Traffic keys : {len(self.traffic)}  (expected 28 patterns)")

        # Node breakdown
        districts  = [n for n, d in self.neighborhoods.items() if not n.startswith("F")]
        facilities = [n for n, d in self.neighborhoods.items() if n.startswith("F")]
        print(f"\n  Districts loaded  : {len(districts)}")
        print(f"  Facilities loaded : {len(facilities)}")

        # Population sanity check
        total_pop = sum(
            nb.population for nb in self.neighborhoods.values() if nb.population > 0
        )
        print(f"  Total district population : {total_pop:,}")

        # Spot-check a road
        edge = self.graph.get_edge_data("1", "3")
        print(f"\n  Spot-check edge 1→3  : distance={edge['weight']} km, "
              f"capacity={edge['capacity']} veh/h, condition={edge['condition']}/10")

        # Spot-check traffic
        tp = self.get_traffic("1", "3")
        if tp:
            print(f"  Traffic  1→3 morning : {tp.morning_peak} veh/h  "
                  f"(congestion ratio = "
                  f"{self.get_congestion_ratio('1', '3', 'morning_peak'):.2f})")

        # Spot-check a facility
        airport = self.neighborhoods["F1"]
        print(f"\n  Facility F1          : {airport.name} "
              f"@ ({airport.x}, {airport.y})")

        # Quick connectivity check
        is_weakly_connected = nx.is_weakly_connected(self.graph)
        print(f"\n  Graph weakly connected : {is_weakly_connected}")
        print("\n" + "=" * 55)
        print("  ✓  Data loaded successfully — ready for algorithms!")
        print("=" * 55 + "\n")


# ---------------------------------------------------------------------------
# 4. Module-level singleton — teammates can simply `from cairo_transport_system import cts`
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    cts = CairoTransportSystem()
    cts.verify()

    # ── Quick demo: shortest path Downtown Cairo (3) → New Admin Capital (13) ──
    try:
        path = nx.dijkstra_path(cts.graph, "3", "13", weight="weight")
        length = nx.dijkstra_path_length(cts.graph, "3", "13", weight="weight")
        named = [cts.get_node_name(n) for n in path]
        print(f"  Shortest path  3 → 13 : {' → '.join(named)}")
        print(f"  Total distance         : {length:.1f} km\n")
    except nx.NetworkXNoPath:
        print("  No path found between node 3 and node 13.\n")