/**
 * API Service for Cairo Transportation System
 * Connects frontend to the Flask backend
 */

/**
 * Resolves API base so requests work when opening the app via localhost *or* LAN
 * (e.g. Vite "Network" URL). In dev, use same-origin `/api` so Vite proxies to Flask.
 */
function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv?.trim()) {
    return fromEnv.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '/api';
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const body = JSON.parse(text) as { error?: string; message?: string };
    return body.error ?? body.message ?? (text || response.statusText);
  } catch {
    return text || response.statusText;
  }
}

export interface Node {
  id: string;
  name: string;
  type: string;
  population: number;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface PathStep {
  nodeId: string;
  nodeName: string;
  isOrigin: boolean;
  isDestination: boolean;
  lat?: number | null;
  lon?: number | null;
  segmentDistance?: number;
  cumulativeDistance?: number;
  segmentTime?: number;
  cumulativeTime?: number;
  congestion?: number;
}

export interface DijkstraResponse {
  success: boolean;
  algorithm: string;
  path: PathStep[];
  summary: {
    totalDistance: number;
    estimatedTime: number;
    numberOfHops: number;
  };
}

export interface EmergencyResponse {
  success: boolean;
  algorithm: string;
  nearestHospital: {
    id: string;
    name: string;
  };
  path: PathStep[];
  summary: {
    totalDistance: number;
    totalTime: number;
    numberOfHops: number;
  };
  alternativeHospitals: Array<{
    id: string;
    name: string;
    travelTime: number;
  }>;
}

export interface InfrastructureRoad {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  distance: number;
  capacity: number;
  cost: number;
}

export interface InfrastructureResponse {
  success: boolean;
  algorithm: string;
  selectedRoads: InfrastructureRoad[];
  summary: {
    totalCost: number;
    numberOfRoads: number;
    isStronglyConnected: boolean;
    activeNodes: number;
    totalEdges: number;
  };
}

export interface AlgorithmResult {
  algorithm: string;
  executionTime: number;
  pathLength: number;
  nodesVisited: number;
  path: string[];
}

export interface CompareResponse {
  success: boolean;
  results: AlgorithmResult[];
  fastest: string;
  summary: {
    source: string;
    destination: string;
  };
}

export interface DashboardStats {
  success: boolean;
  trafficDensityPercent: number;
  avgTravelTimeMin: number;
  activeRoutes: number;
  efficiencyGainPercent: number;
}

export interface TransitResponse {
  status: string;
  path?: string[];
  path_names?: string[];
  total_time_min?: number;
  total_distance_km?: number;
  time_of_day?: string;
  mode?: string;
  message?: string;
  cache_hit?: boolean;
}

/**
 * Fetch all available nodes
 */
export async function fetchNodes(): Promise<Node[]> {
  const response = await fetch(`${getApiBaseUrl()}/nodes`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json();
}

/**
 * Calculate shortest path using Dijkstra's algorithm
 */
export async function calculateDijkstraRoute(
  source: string,
  destination: string
): Promise<DijkstraResponse> {
  const response = await fetch(`${getApiBaseUrl()}/dijkstra`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source, destination }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Find fastest route to nearest hospital using A* algorithm
 */
export async function findNearestHospital(
  location: string
): Promise<EmergencyResponse> {
  const response = await fetch(`${getApiBaseUrl()}/emergency`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ location }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Get infrastructure planning using MST (Kruskal's algorithm)
 */
export async function getInfrastructurePlan(): Promise<InfrastructureResponse> {
  const response = await fetch(`${getApiBaseUrl()}/infrastructure`);
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Compare different pathfinding algorithms
 */
export async function compareAlgorithms(
  source: string,
  destination: string
): Promise<CompareResponse> {
  const response = await fetch(`${getApiBaseUrl()}/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source, destination }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Aggregated metrics for the main dashboard (derived from the live graph).
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${getApiBaseUrl()}/dashboard`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json();
}

/**
 * Public transit / weighted road routing (memoized Dijkstra), or fewest-hops path.
 */
export async function fetchTransitRoute(
  source: string,
  destination: string,
  mode: 'time' | 'hops' = 'time',
  timeOfDay: string = 'morning'
): Promise<TransitResponse> {
  const response = await fetch(`${getApiBaseUrl()}/transit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source,
      destination,
      mode,
      time_of_day: timeOfDay,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{
  status: string;
  message: string;
  nodes?: number;
  edges?: number;
}> {
  const response = await fetch(`${getApiBaseUrl()}/health`);
  if (!response.ok) {
    throw new Error('Backend is not responding');
  }
  return response.json();
}
