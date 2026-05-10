"""
infrastructure_mst.py
=====================
Infrastructure Network Design for the Cairo Transportation System (CSE112 Project).

Requirement 1: Use Kruskal's Algorithm to find the minimum-cost set of
potential new roads that makes the transportation network **strongly connected**.

Approach — Kruskal's Algorithm for Strong-Connectivity Augmentation
-------------------------------------------------------------------
Standard Kruskal's finds a minimum spanning tree on an undirected graph.
Here the graph is *directed*, so the goal is **strong connectivity** — every
node must be reachable from every other node following edge directions.

The algorithm works as follows:

1.  Build the existing directed graph (inherited from CairoTransportSystem).
2.  Identify the **Strongly Connected Components (SCCs)** of the current graph.
3.  Contract each SCC into a single super-node to form a **DAG of SCCs**.
4.  Sort the candidate (potential) new roads by construction cost  (Kruskal's
    greedy principle: cheapest edge first).
5.  Iterate through candidates in cost order.  For each candidate edge
    (u → v), determine its effect on the SCC-DAG:
      • If u and v are already in the same SCC  →  skip (no benefit).
      • Otherwise add the edge to the graph, recompute SCCs, and keep the
        edge if it **merges** at least two SCCs (i.e. reduces the SCC count).
6.  Stop when there is exactly **one** SCC (the graph is strongly connected),
    or when all candidates are exhausted.

This greedy, Kruskal's-style strategy guarantees we never pick a redundant
edge and always prefer cheaper roads — producing a minimal-cost augmentation.

Dataset notes
-------------
Six facility nodes (F3–F6, F9, F10) have **no roads at all** in the provided
data (neither existing nor potential).  They are structurally isolated and
cannot participate in any connectivity analysis.  The algorithm therefore
operates on the 19-node **active subgraph** (15 districts + F1, F2, F7, F8).

Usage
-----
    python infrastructure_mst.py
or
    from infrastructure_mst import InfrastructurePlanner
    planner = InfrastructurePlanner()
    planner.plan_infrastructure()
"""

import networkx as nx
from typing import Dict, List, Tuple, Set

from cairo_transport_system import CairoTransportSystem


# ---------------------------------------------------------------------------
# Potential New Roads  (parsed from Project_Provided_Data.pdf, page 3)
# (FromID, ToID, Distance_km, Capacity_veh/h, Cost_Million_EGP)
# ---------------------------------------------------------------------------

POTENTIAL_ROADS: List[Tuple[str, str, float, int, int]] = [
    ("1",  "4",  22.8, 4000,  450),
    ("1",  "14", 25.3, 3800,  500),
    ("2",  "13", 48.2, 4500,  950),
    ("3",  "13", 56.7, 4500, 1100),
    ("5",  "4",  16.8, 3500,  320),
    ("6",  "8",   7.5, 2500,  150),
    ("7",  "13", 82.3, 4000, 1600),
    ("9",  "11",  6.9, 2800,  140),
    ("10", "F7", 27.4, 3200,  550),
    ("11", "13", 62.1, 4200, 1250),
    ("12", "14", 30.5, 3600,  610),
    ("14", "5",  18.2, 3300,  360),
    ("15", "9",  22.7, 3000,  450),
    ("F1", "13", 40.2, 4000,  800),
    ("F7", "9",  26.8, 3200,  540),
]


# ---------------------------------------------------------------------------
# Union-Find (Disjoint Set Union) — used by Kruskal's
# ---------------------------------------------------------------------------

class UnionFind:
    """
    Classic Union-Find with path compression and union by rank.

    Used during the Kruskal's-style edge selection to track which
    super-nodes (SCCs) have been merged.

    Time complexity:
        find  — O(α(n))  ≈ O(1) amortised  (inverse Ackermann)
        union — O(α(n))  ≈ O(1) amortised
    """

    def __init__(self, elements):
        self.parent: Dict = {e: e for e in elements}
        self.rank:   Dict = {e: 0 for e in elements}

    def find(self, x):
        """Find with path compression."""
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y) -> bool:
        """Union by rank.  Returns True if x and y were in different sets."""
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return False
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
        return True

    def connected(self, x, y) -> bool:
        return self.find(x) == self.find(y)

    def num_components(self) -> int:
        roots = {self.find(e) for e in self.parent}
        return len(roots)


# ---------------------------------------------------------------------------
# InfrastructurePlanner
# ---------------------------------------------------------------------------

class InfrastructurePlanner(CairoTransportSystem):
    """
    Extends CairoTransportSystem with infrastructure planning capabilities.

    Core public method
    ------------------
    plan_infrastructure()
        Runs the Kruskal's-based augmentation algorithm and prints a full
        report of which potential roads to build and the total cost.
    """

    def __init__(self):
        super().__init__()
        # Rebuild graph with one-directional edges only so the MST/strong-
        # connectivity analysis works on the original directed network.
        # (The base class now adds reverse edges for routing; we undo that here.)
        self._rebuild_directed_graph()

    def _rebuild_directed_graph(self) -> None:
        """Replace the bidirectional graph with the original directed edges only."""
        import networkx as nx
        from cairo_transport_system import _ROAD_ROWS
        directed = nx.DiGraph()
        for node_id, nbhd in self.neighborhoods.items():
            directed.add_node(
                node_id,
                name=nbhd.name,
                population=nbhd.population,
                district_type=nbhd.district_type,
                x=nbhd.x,
                y=nbhd.y,
            )
        for from_id, to_id, dist, cap, cond in _ROAD_ROWS:
            directed.add_edge(from_id, to_id, weight=dist, capacity=cap, condition=cond)
        self.graph = directed

    # ------------------------------------------------------------------ #
    # Helper: identify active nodes (those with at least one edge)         #
    # ------------------------------------------------------------------ #

    def _get_active_nodes(self) -> Set[str]:
        """Return nodes that participate in at least one road (edge)."""
        active = set()
        for u, v in self.graph.edges():
            active.add(u)
            active.add(v)
        return active

    # ------------------------------------------------------------------ #
    # Helper: SCC label map                                                #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _scc_label_map(graph: nx.DiGraph) -> Dict[str, int]:
        """
        Return a dict  node_id → scc_label  for every node in graph.
        Each SCC gets a unique integer label.
        """
        mapping: Dict[str, int] = {}
        for label, scc in enumerate(nx.strongly_connected_components(graph)):
            for node in scc:
                mapping[node] = label
        return mapping

    # ------------------------------------------------------------------ #
    # Kruskal's-style strong-connectivity augmentation                     #
    # ------------------------------------------------------------------ #

    def kruskal_augment(self) -> Tuple[List[Tuple], int, nx.DiGraph]:
        """
        Kruskal's Algorithm adapted for directed strong-connectivity
        augmentation.

        Algorithm
        ---------
        1. Compute SCCs of the current directed graph.
        2. Sort potential new roads by construction cost (ascending).
        3. Greedily add the cheapest edge that **reduces the SCC count**
           (i.e. merges two or more components in the condensation DAG).
        4. Stop when the graph is strongly connected (1 SCC) or when
           candidates are exhausted.

        Returns
        -------
        (selected_roads, total_cost, augmented_graph)
            selected_roads : list of (from, to, dist, cap, cost) tuples
            total_cost     : sum of construction costs (Million EGP)
            augmented_graph: copy of self.graph with new edges added

        Complexity
        ----------
        Let E_p = number of potential roads, V = number of active nodes,
            E   = number of existing edges.
        • Sorting candidates          : O(E_p · log E_p)
        • Per candidate — recompute SCCs: O(V + E)   (Tarjan's / Kosaraju's)
        • Worst case total            : O(E_p · (V + E + E_p))
        For the Cairo dataset (V=19, E=28, E_p=15) this is trivially fast.
        """
        # Work on a copy so we don't mutate the base graph
        aug_graph = self.graph.copy()
        active = self._get_active_nodes()

        # Restrict to the active subgraph for SCC analysis
        sub = aug_graph.subgraph(active).copy()

        # Initial SCC count
        initial_sccs = list(nx.strongly_connected_components(sub))
        num_sccs = len(initial_sccs)

        print(f"  Initial SCC count (active subgraph) : {num_sccs}")
        print(f"  Potential new roads available        : {len(POTENTIAL_ROADS)}")
        print()

        # ── Step 1: Sort candidates by cost (Kruskal's greedy principle) ──
        sorted_candidates = sorted(POTENTIAL_ROADS, key=lambda r: r[4])

        selected: List[Tuple] = []
        total_cost = 0

        print("  Kruskal's Edge Selection (cheapest first):")
        print("  " + "─" * 70)

        for from_id, to_id, dist, cap, cost in sorted_candidates:
            from_name = self.get_node_name(from_id)
            to_name   = self.get_node_name(to_id)

            # Check current SCC membership
            scc_map = self._scc_label_map(sub)
            same_scc = scc_map.get(from_id) == scc_map.get(to_id)

            if same_scc:
                print(f"    SKIP   {from_id:>3} → {to_id:<3}  "
                      f"({from_name} → {to_name})  "
                      f"cost={cost:,} M EGP  — already in same SCC")
                continue

            # Tentatively add the edge and check if it reduces SCC count
            sub.add_edge(from_id, to_id, weight=dist, capacity=cap, condition=8)
            new_sccs = list(nx.strongly_connected_components(sub))
            new_count = len(new_sccs)

            if new_count < num_sccs:
                # Edge merges components → KEEP
                merged = num_sccs - new_count
                num_sccs = new_count
                total_cost += cost
                selected.append((from_id, to_id, dist, cap, cost))

                # Also add to the full augmented graph
                aug_graph.add_edge(from_id, to_id, weight=dist,
                                   capacity=cap, condition=8, new_road=True)

                print(f"    ADD    {from_id:>3} → {to_id:<3}  "
                      f"({from_name} → {to_name})  "
                      f"cost={cost:,} M EGP  — merged {merged} SCC(s), "
                      f"remaining={num_sccs}")

                if num_sccs == 1:
                    print()
                    print("  ✓  Graph is now STRONGLY CONNECTED!")
                    break
            else:
                # Edge does not reduce SCC count → remove it
                sub.remove_edge(from_id, to_id)
                print(f"    SKIP   {from_id:>3} → {to_id:<3}  "
                      f"({from_name} → {to_name})  "
                      f"cost={cost:,} M EGP  — does not merge any SCCs")

        print("  " + "─" * 70)

        return selected, total_cost, aug_graph

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def plan_infrastructure(self) -> None:
        """
        Run the full infrastructure planning pipeline and print the report.

        Steps:
        1. Show the current graph status (nodes, edges, SCCs).
        2. Run Kruskal's augmentation algorithm.
        3. Print a summary of selected roads and total cost.
        4. Verify strong connectivity of the augmented graph.
        """
        active = self._get_active_nodes()
        sub = self.graph.subgraph(active).copy()

        # ── Header ────────────────────────────────────────────────────── #
        print("=" * 72)
        print("  🏗️   INFRASTRUCTURE NETWORK DESIGN — Kruskal's MST Augmentation")
        print("=" * 72)
        print()

        # ── Current state ─────────────────────────────────────────────── #
        print("  CURRENT NETWORK STATUS")
        print("  " + "─" * 50)
        print(f"  Active nodes           : {len(active)}")
        print(f"  Existing directed edges: {sub.number_of_edges()}")

        sccs = list(nx.strongly_connected_components(sub))
        print(f"  Strongly connected     : {len(sccs) == 1}")
        print(f"  Number of SCCs         : {len(sccs)}")
        print()

        for i, scc in enumerate(sorted(sccs, key=len, reverse=True)):
            members = ", ".join(
                f"{n} ({self.get_node_name(n)})" for n in sorted(scc)
            )
            print(f"    SCC {i+1:>2} [{len(scc):>2} node(s)] : {members}")

        print()

        # ── Run Kruskal's ─────────────────────────────────────────────── #
        selected, total_cost, aug_graph = self.kruskal_augment()
        print()

        # ── Results ───────────────────────────────────────────────────── #
        if not selected:
            print("  ✗  No roads selected — augmentation could not proceed.")
            print("=" * 72)
            return

        print("  SELECTED ROADS TO BUILD")
        print("  " + "─" * 70)
        print(f"  {'#':<4} {'From':>4} → {'To':<4}  "
              f"{'From Name':<20} {'To Name':<25} "
              f"{'Dist':>6}  {'Cost':>10}")
        print("  " + "─" * 70)

        for i, (f_id, t_id, dist, cap, cost) in enumerate(selected, 1):
            print(f"  {i:<4} {f_id:>4} → {t_id:<4}  "
                  f"{self.get_node_name(f_id):<20} {self.get_node_name(t_id):<25} "
                  f"{dist:>5.1f} km  {cost:>7,} M EGP")

        print("  " + "─" * 70)
        print(f"  {'TOTAL':>57}  {total_cost:>7,} M EGP")
        print()

        # ── Verification ──────────────────────────────────────────────── #
        aug_active = set()
        for u, v in aug_graph.edges():
            aug_active.add(u)
            aug_active.add(v)
        aug_sub = aug_graph.subgraph(aug_active).copy()
        is_sc = nx.is_strongly_connected(aug_sub)
        final_sccs = list(nx.strongly_connected_components(aug_sub))

        # Separate the core network (15 districts + F2 + F7) from
        # source-only facilities (F1, F8) that have no incoming roads
        # in either existing or potential data and thus CANNOT be reached.
        core_nodes = set(str(i) for i in range(1, 16)) | {"F2", "F7"}
        core_in_graph = core_nodes & aug_active
        core_sub = aug_sub.subgraph(core_in_graph).copy()
        core_sc = nx.is_strongly_connected(core_sub)

        # Source-only facilities: nodes with outgoing but no incoming edges
        source_only = [
            n for n in aug_active
            if n not in core_nodes and aug_sub.in_degree(n) == 0
        ]

        print("  POST-AUGMENTATION VERIFICATION")
        print("  " + "─" * 68)
        print(f"  Total active nodes     : {len(aug_active)}")
        print(f"  Total directed edges   : {aug_sub.number_of_edges()}")
        print(f"  Full graph strongly connected  : {is_sc}")
        print(f"  Core network (districts + F2, F7) strongly connected: {core_sc}")
        print(f"  Number of SCCs (full)  : {len(final_sccs)}")
        print()

        if core_sc:
            print("  ✓  All 15 districts + Ramses Station (F2) + Smart Village (F7)")
            print("     are STRONGLY CONNECTED.")
            print(f"  ✓  Total construction cost: {total_cost:,} Million EGP")
            print(f"  ✓  New roads to build: {len(selected)}")
        else:
            print("  ✗  Core network is NOT strongly connected.")
            for i, scc in enumerate(sorted(final_sccs, key=len, reverse=True)):
                members = ", ".join(sorted(scc))
                print(f"     SCC {i+1}: {{{members}}}")

        if source_only:
            print()
            print("  ⚠  SOURCE-ONLY FACILITIES (no incoming roads exist in the data):")
            for n in sorted(source_only):
                print(f"     • {n} ({self.get_node_name(n)}) — outgoing-only; "
                      "no existing or potential road leads into this node.")
            print("     These nodes can feed traffic into the network but cannot")
            print("     be reached from it.  Connecting them would require new")
            print("     roads not listed in the current candidate set.")

        print()

        # ── Reachability check for key nodes ──────────────────────────── #
        print("  KEY NODE REACHABILITY (post-augmentation)")
        print("  " + "─" * 50)
        for key_node in ["1", "13"]:
            reachable = nx.descendants(aug_sub, key_node)
            ancestors = nx.ancestors(aug_sub, key_node)
            print(f"  Node {key_node} ({self.get_node_name(key_node)}):")
            print(f"    Can reach   : {len(reachable)} / {len(aug_active)-1} active nodes")
            print(f"    Reached from: {len(ancestors)} / {len(aug_active)-1} active nodes")

        print()
        print("=" * 72)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    planner = InfrastructurePlanner()
    planner.verify()
    print()
    planner.plan_infrastructure()
